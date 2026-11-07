<?php

namespace App\Notifications\Concerns;

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
     * The email always, the push too when the user has a device.
     *
     * @return list<string>
     */
    protected function mailAndPush(object $notifiable): array
    {
        return $this->withPush($notifiable, ['mail']);
    }

    /**
     * @param  list<string>  $channels
     * @return list<string>
     */
    protected function withPush(object $notifiable, array $channels): array
    {
        if ($notifiable instanceof User && $notifiable->hasPushDevices()) {
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
