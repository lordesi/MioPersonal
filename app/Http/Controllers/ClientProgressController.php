<?php

namespace App\Http\Controllers;

use App\Enums\Achievement;
use App\Enums\ActivityKind;
use App\Http\Requests\ClientPreferencesRequest;
use App\Models\ActivityLog;
use App\Models\BodyMeasurement;
use App\Models\User;
use App\Support\Achievements;
use App\Support\ClientProgress;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * What the client writes in "Panoramica": "Segna un allenamento", the weekly
 * goal and the weight. Everything else on the page counts by itself.
 */
class ClientProgressController extends Controller
{
    /** Older trainings would only rewrite the weeks in a row already shown. */
    public const DAYS_BACK = 60;

    public const NOTE_MAX = 280;

    public const MINUTES_MAX = 600;

    public function storeActivity(Request $request): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();
        $today = $this->today();

        $data = $request->validate([
            'done_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.$today->subDays(self::DAYS_BACK)->format('Y-m-d'), 'before_or_equal:'.$today->format('Y-m-d')],
            'kind' => ['required', Rule::enum(ActivityKind::class)],
            'minutes' => ['nullable', 'integer', 'min:1', 'max:'.self::MINUTES_MAX],
            'effort' => ['nullable', 'integer', 'min:1', 'max:3'],
            'note' => ['nullable', 'string', 'max:'.self::NOTE_MAX],
        ], [
            'done_on.after_or_equal' => 'Puoi segnare gli allenamenti degli ultimi '.self::DAYS_BACK.' giorni.',
            'done_on.before_or_equal' => 'Gli allenamenti di domani si segnano domani.',
            'done_on.*' => 'Scegli il giorno.',
            'kind.*' => 'Scegli cosa hai fatto.',
            'minutes.*' => 'Scrivi i minuti, da 1 a '.self::MINUTES_MAX.'.',
            'note.max' => 'La nota può avere al massimo '.self::NOTE_MAX.' caratteri.',
        ]);

        $client->activityLogs()->create($data);
        $new = Achievements::sync($client, ClientProgress::for($client));

        Inertia::flash('toast', ['type' => 'success', 'message' => $new === []
            ? 'Allenamento segnato.'
            : 'Allenamento segnato. Nuovo traguardo: '.implode(', ', array_map(fn (Achievement $achievement) => $achievement->title(), $new)).'!']);

        return back();
    }

    public function destroyActivity(Request $request, ActivityLog $log): RedirectResponse
    {
        abort_unless($log->user_id === $request->user()?->id, 404);

        $log->delete();

        return back();
    }

    /** "Quante volte a settimana", the same answer as in "Su di te"; empty removes it. */
    public function updateGoal(Request $request): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();

        $data = $request->validate([
            'sessions_per_week' => ['nullable', 'integer', 'min:1', 'max:'.ClientPreferencesRequest::SESSIONS_PER_WEEK_MAX],
        ], ['sessions_per_week.*' => 'Scegli da 1 a '.ClientPreferencesRequest::SESSIONS_PER_WEEK_MAX.' allenamenti a settimana.']);

        $client->clientPreference()->updateOrCreate([], $data);

        return back();
    }

    /** One weight a day: the same day again replaces it. Only with the consent. */
    public function storeWeight(Request $request): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();

        if ($client->clientPreference?->body_data_consent_at === null) {
            throw ValidationException::withMessages(['weight' => 'Per segnare il peso serve il tuo consenso, in "Il mio profilo".']);
        }

        $today = $this->today();
        $data = $request->validate([
            'weight' => ['required', 'numeric', 'min:'.ClientPreferencesRequest::WEIGHT_MIN_KG, 'max:'.ClientPreferencesRequest::WEIGHT_MAX_KG],
            'measured_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.$today->subDays(self::DAYS_BACK)->format('Y-m-d'), 'before_or_equal:'.$today->format('Y-m-d')],
        ], [
            'weight.*' => 'Scrivi il peso in chili, tra '.ClientPreferencesRequest::WEIGHT_MIN_KG.' e '.ClientPreferencesRequest::WEIGHT_MAX_KG.'.',
            'measured_on.*' => 'Scegli un giorno degli ultimi '.self::DAYS_BACK.'.',
        ]);

        $client->bodyMeasurements()->updateOrCreate(
            ['measured_on' => $data['measured_on']],
            ['weight_grams' => (int) round((float) $data['weight'] * 1000)],
        );
        $this->syncProfileWeight($client);

        return back();
    }

    public function destroyWeight(Request $request, BodyMeasurement $measurement): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();
        abort_unless($measurement->user_id === $client->id, 404);

        $measurement->delete();
        $this->syncProfileWeight($client);

        return back();
    }

    /** "Su di te" shows the last weight. */
    private function syncProfileWeight(User $client): void
    {
        $grams = $client->bodyMeasurements()->latest('measured_on')->value('weight_grams');

        if ($grams !== null) {
            $client->clientPreference()->update(['weight_kg' => (int) round($grams / 1000)]);
        }
    }

    private function today(): CarbonImmutable
    {
        return CarbonImmutable::now(ClientProgress::TIMEZONE)->startOfDay();
    }
}
