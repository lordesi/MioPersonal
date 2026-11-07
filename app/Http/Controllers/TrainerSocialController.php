<?php

namespace App\Http\Controllers;

use App\Enums\SocialProvider;
use App\Enums\UserRole;
use App\Models\User;
use App\Support\TrainerSocials;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Socialite\AbstractUser;
use Laravel\Socialite\Contracts\User as SocialUser;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirect;
use Throwable;

/**
 * "Collega Instagram / TikTok / Facebook / YouTube" of the trainer profile,
 * in "Diventa trainer" (also for guests: the link waits in the session until
 * the profile is sent, see TrainerSocials) and in "Modifica profilo".
 *
 * 1. connect(): opened in a popup (?popup=1), so the form being filled in is
 *    not lost; the user logs in on the social and allows the app.
 * 2. callback(): the social sends them back here. We read who the account
 *    is (id, username, link) and drop the token: nothing else is kept.
 *    In the popup the answer is a small page that tells the opener and closes.
 */
class TrainerSocialController extends Controller
{
    /** Session key: the popup flag of the connection in progress. */
    private const POPUP_KEY = 'trainer_social_popup';

    public function connect(Request $request, SocialProvider $provider): SymfonyRedirect
    {
        abort_unless($provider->enabled() && $this->canLink($request->user()), 404);

        $request->session()->put(self::POPUP_KEY, $request->boolean('popup'));

        return Socialite::driver($provider->value)->redirect();
    }

    public function callback(Request $request, SocialProvider $provider): View|RedirectResponse
    {
        abort_unless($provider->enabled() && $this->canLink($request->user()), 404);

        $popup = (bool) $request->session()->pull(self::POPUP_KEY, false);

        try {
            $account = Socialite::driver($provider->value)->user();
        } catch (Throwable) {
            // Cancelled on the social, or the link was opened twice.
            return $this->answer($request, $provider, $popup, false, "Collegamento con {$provider->label()} non riuscito. Riprova.");
        }

        [$id, $handle, $url] = $this->identity($provider, $account);

        if ($id === '' || $handle === '' || $url === '') {
            return $this->answer($request, $provider, $popup, false, $this->missingMessage($provider));
        }

        $profile = TrainerSocials::profileOf($request->user());

        if (TrainerSocials::takenByOther($provider, $id, $profile)) {
            return $this->answer($request, $provider, $popup, false, "Questo account {$provider->label()} è già collegato a un altro trainer.");
        }

        if ($profile !== null) {
            if (! TrainerSocials::save($profile, $provider, $id, $handle, $url)) {
                return $this->answer($request, $provider, $popup, false, "Questo account {$provider->label()} è già collegato a un altro trainer.");
            }
        } else {
            $request->session()->put(TrainerSocials::PENDING_KEY.'.'.$provider->value, ['id' => $id, 'handle' => $handle, 'url' => $url]);
        }

        return $this->answer($request, $provider, $popup, true, "{$provider->label()} collegato: @{$handle}.");
    }

    /** "Scollega": the icon goes away from the profile. */
    public function disconnect(Request $request, SocialProvider $provider): RedirectResponse
    {
        abort_unless($this->canLink($request->user()), 404);

        $profile = TrainerSocials::profileOf($request->user());

        if ($profile !== null) {
            $profile->socialAccounts()->where('provider', $provider)->delete();
        } else {
            $request->session()->forget(TrainerSocials::PENDING_KEY.'.'.$provider->value);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$provider->label()} scollegato."]);

        return back();
    }

    /** Guests and clients (in "Diventa trainer") and trainers: not gyms or the team. */
    private function canLink(?User $user): bool
    {
        return $user === null || in_array($user->role, [UserRole::Client, UserRole::Trainer], true);
    }

    /**
     * Id, username without "@" and public link of the account.
     *
     * @return array{string, string, string}
     */
    private function identity(SocialProvider $provider, SocialUser $account): array
    {
        $id = (string) $account->getId();
        $handle = ltrim(trim((string) $account->getNickname()), '@');

        if ($provider === SocialProvider::Facebook) {
            // Facebook has no username: the name, and the link it gives.
            $raw = $account instanceof AbstractUser ? $account->getRaw() : [];
            $link = is_string($raw['link'] ?? null) ? $raw['link'] : '';

            return [$id, trim((string) $account->getName()), str_starts_with($link, 'https://') ? $link : ''];
        }

        return [$id, $handle, $handle === '' ? '' : $provider->profileUrl($handle)];
    }

    private function missingMessage(SocialProvider $provider): string
    {
        return match ($provider) {
            SocialProvider::YouTube => 'Questo account Google non ha un canale YouTube con un nome (@…).',
            SocialProvider::Facebook => 'Facebook non ci ha dato il link del tuo profilo: riprova e consenti l’accesso al link.',
            default => "{$provider->label()} non ci ha dato il nome del tuo profilo. Riprova.",
        };
    }

    /** In the popup: the page that tells the opener. Otherwise back to the form with a toast. */
    private function answer(Request $request, SocialProvider $provider, bool $popup, bool $ok, string $message): View|RedirectResponse
    {
        if ($popup) {
            return view('social.popup-done', [
                'payload' => ['type' => 'trainer-social', 'provider' => $provider->value, 'ok' => $ok, 'message' => $message],
                'message' => $message,
            ]);
        }

        Inertia::flash('toast', ['type' => $ok ? 'success' : 'error', 'message' => $message]);

        $profile = TrainerSocials::profileOf($request->user());

        return to_route($profile?->isApproved() ? 'trainer.profile.edit' : 'trainer.register');
    }
}
