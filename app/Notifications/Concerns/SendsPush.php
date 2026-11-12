<?php

namespace App\Notifications\Concerns;

use App\Enums\PushCategory;
use App\Models\User;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * Push notifications next to the emails: they reach the devices where the user
 * pressed "Attiva le notifiche" (public/sw.js shows them and opens `url`).
 * Short texts, no notes of the client: they pass through Apple's and Google's
 * push services (encrypted, but still the least we can send).
 */
trait SendsPush
{
    /**
     * The email and the bell inside the site always, the push too when the user
     * has a device. The email is kept for what the person must read even without
     * opening the site (the free plan of the mail provider has a daily limit:
     * use it sparingly, the others go through inAppAndPush()).
     *
     * @return list<string>
     */
    protected function mailAndPush(object $notifiable): array
    {
        return $this->withPush($notifiable, ['mail', 'database']);
    }

    /**
     * No email: the bell inside the site (always) and the push (with a device).
     *
     * @return list<string>
     */
    protected function inAppAndPush(object $notifiable): array
    {
        return $this->withPush($notifiable, ['database']);
    }

    /**
     * The bell inside the site: the same title, text and link of the push.
     *
     * @return array{title: string, body: string, url: string}
     */
    public function toArray(User $notifiable): array
    {
        /** @var array{title?: string, body?: string, data?: array{url?: string}} $push */
        $push = $this->toWebPush($notifiable)->toArray();

        // Saved as a path ("/area-trainer/richieste"): it keeps working if the domain changes.
        $link = parse_url($push['data']['url'] ?? '/');

        return [
            'title' => $push['title'] ?? '',
            'body' => $push['body'] ?? '',
            'url' => ($link['path'] ?? '/')
                .(isset($link['query']) ? "?{$link['query']}" : '')
                .(isset($link['fragment']) ? "#{$link['fragment']}" : ''),
        ];
    }

    /**
     * The switch of "Cosa ricevere sul dispositivo" that can stop this push;
     * null = always sent (decisions of the team, reminders with their own switch).
     */
    protected function pushCategory(): ?PushCategory
    {
        return null;
    }

    /**
     * @param  list<string>  $channels
     * @return list<string>
     */
    protected function withPush(object $notifiable, array $channels): array
    {
        $category = $this->pushCategory();

        if (
            $notifiable instanceof User
            && ($category === null || $notifiable->wantsPush($category))
            && $notifiable->hasPushDevices()
        ) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    /**
     * @param  string  $tag  one per booking: a newer notification replaces the older one
     */
    protected function pushMessage(string $title, string $body, string $url, string $tag): WebPushMessage
    {
        return (new WebPushMessage)
            ->title($title)
            ->body($body)
            ->icon('/icons/icon-192.png')
            ->badge('/icons/badge-96.png')
            ->lang('it')
            ->tag($tag)
            ->data(['url' => $url])
            // A phone that is off gets it within a day, then it's old news.
            ->options(['TTL' => 86400, 'urgency' => 'high']);
    }
}
