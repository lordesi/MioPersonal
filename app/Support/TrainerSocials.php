<?php

namespace App\Support;

use App\Enums\SocialProvider;
use App\Models\TrainerProfile;
use App\Models\TrainerSocialAccount;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

/**
 * The socials linked by a trainer (TrainerSocialController). Before the
 * trainer profile exists ("Diventa trainer" of a guest or of a client) they
 * wait in the session and are saved with the profile (attachPending()).
 */
final class TrainerSocials
{
    /** Session key: provider value => {id, handle, url}. */
    public const PENDING_KEY = 'trainer_socials_pending';

    /**
     * For "Collega" in "Diventa trainer" and "Modifica profilo": the socials
     * that can be linked and the ones already linked.
     *
     * @return array{providers: list<array{provider: string, label: string}>, linked: list<array{provider: string, handle: string, url: string}>}
     */
    public static function props(Request $request): array
    {
        $profile = self::profileOf($request->user());

        $linked = $profile !== null
            ? $profile->socialAccounts()->get()->map(fn (TrainerSocialAccount $account) => [
                'provider' => $account->provider->value,
                'handle' => $account->handle,
                'url' => $account->url,
            ])->all()
            : array_map(fn (string $provider, array $data) => [
                'provider' => $provider,
                'handle' => $data['handle'],
                'url' => $data['url'],
            ], array_keys(self::pending($request)), self::pending($request));

        return [
            'providers' => array_map(fn (SocialProvider $provider) => [
                'provider' => $provider->value,
                'label' => $provider->label(),
            ], SocialProvider::enabledCases()),
            'linked' => self::sorted(array_values($linked)),
        ];
    }

    /**
     * The icons of the public profile: the linked socials, and the Instagram
     * typed by hand (accounts that are not professional) when not linked.
     *
     * @return list<array{provider: string, handle: string, url: string}>
     */
    public static function publicLinks(TrainerProfile $profile): array
    {
        $links = $profile->socialAccounts->map(fn (TrainerSocialAccount $account) => [
            'provider' => $account->provider->value,
            'handle' => $account->handle,
            'url' => $account->url,
        ])->all();

        $hasInstagram = $profile->socialAccounts->contains('provider', SocialProvider::Instagram);

        if ($profile->instagram !== null && ! $hasInstagram) {
            $links[] = [
                'provider' => SocialProvider::Instagram->value,
                'handle' => $profile->instagram,
                'url' => $profile->instagramUrl(),
            ];
        }

        return self::sorted(array_values($links));
    }

    /** The profile where a link goes now; null = it waits in the session. */
    public static function profileOf(?User $user): ?TrainerProfile
    {
        return $user?->trainerProfile;
    }

    /**
     * @return array<string, array{id: string, handle: string, url: string}>
     */
    public static function pending(Request $request): array
    {
        return (array) $request->session()->get(self::PENDING_KEY, []);
    }

    /** Linked to another trainer (or waiting in this session for nobody else). */
    public static function takenByOther(SocialProvider $provider, string $id, ?TrainerProfile $profile): bool
    {
        return TrainerSocialAccount::where('provider', $provider)
            ->where('provider_user_id', $id)
            ->when($profile !== null, fn ($query) => $query->where('trainer_profile_id', '!=', $profile?->id))
            ->exists();
    }

    /**
     * Saves a link on the profile, replacing the one of the same social. An
     * Instagram linked takes the place of the one typed by hand.
     *
     * @return bool false when another trainer took that account in the meantime
     */
    public static function save(TrainerProfile $profile, SocialProvider $provider, string $id, string $handle, string $url): bool
    {
        try {
            $profile->socialAccounts()->updateOrCreate(
                ['provider' => $provider],
                ['provider_user_id' => $id, 'handle' => $handle, 'url' => $url, 'connected_at' => now()],
            );
        } catch (UniqueConstraintViolationException) {
            return false;
        }

        if ($provider === SocialProvider::Instagram && $profile->instagram !== null) {
            $profile->forceFill(['instagram' => null])->save();
        }

        return true;
    }

    /** "Invia" of "Diventa trainer": the socials linked before the profile existed. */
    public static function attachPending(Request $request, TrainerProfile $profile): void
    {
        foreach (self::pending($request) as $value => $data) {
            $provider = SocialProvider::tryFrom($value);

            if ($provider !== null && ! self::takenByOther($provider, $data['id'], $profile)) {
                self::save($profile, $provider, $data['id'], $data['handle'], $data['url']);
            }
        }

        $request->session()->forget(self::PENDING_KEY);
    }

    /**
     * In the order of SocialProvider (Instagram, TikTok, Facebook, YouTube).
     *
     * @param  list<array{provider: string, handle: string, url: string}>  $links
     * @return list<array{provider: string, handle: string, url: string}>
     */
    private static function sorted(array $links): array
    {
        $order = array_flip(array_map(fn (SocialProvider $provider) => $provider->value, SocialProvider::cases()));
        usort($links, fn (array $a, array $b) => ($order[$a['provider']] ?? 99) <=> ($order[$b['provider']] ?? 99));

        return $links;
    }
}
