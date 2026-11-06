<?php

namespace App\Http\Controllers;

use App\Enums\GymPlanPeriod;
use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Http\Requests\TrainerProfileRequest;
use App\Models\GymPlan;
use App\Models\GymProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Abbonamenti" of the gym area: the list is saved all together and is
 * public right away. A plan sent with its id is updated (its promotions stay
 * linked), the missing ones are deleted. Shown only: paid at the gym.
 */
class GymPlansController extends Controller
{
    use BuildsGymArea;

    public function show(): Response
    {
        $profile = $this->gymOrFail();

        return Inertia::render('gym/plans', [
            'gymArea' => $this->gymArea(),
            'plans' => $profile->plans->map(fn (GymPlan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'period' => $plan->period->value,
                'entriesCount' => $plan->entries_count,
                'priceCents' => $plan->price_cents,
                'features' => $plan->features ?? [],
                'note' => $plan->note ?? '',
                'isActive' => $plan->is_active,
            ])->values(),
            'max' => GymProfile::MAX_PLANS,
            'maxFeatures' => GymPlan::MAX_FEATURES,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $profile = $this->gymOrFail();

        $data = $request->validate([
            'plans' => ['present', 'array', 'max:'.GymProfile::MAX_PLANS],
            'plans.*.id' => ['nullable', 'integer'],
            'plans.*.name' => ['required', 'string', 'max:100'],
            'plans.*.period' => ['required', Rule::enum(GymPlanPeriod::class)],
            'plans.*.entries_count' => ['nullable', 'required_if:plans.*.period,entries', 'integer', 'between:1,500'],
            'plans.*.price_cents' => ['required', 'integer', 'min:100', 'max:'.TrainerProfileRequest::MAX_PRICE_CENTS],
            'plans.*.features' => ['array', 'max:'.GymPlan::MAX_FEATURES],
            'plans.*.features.*' => ['string', 'max:80'],
            'plans.*.note' => ['nullable', 'string', 'max:200'],
            'plans.*.is_active' => ['boolean'],
        ], [
            'plans.max' => 'Puoi aggiungere al massimo '.GymProfile::MAX_PLANS.' abbonamenti.',
            'plans.*.name.required' => 'Scrivi il nome di ogni abbonamento.',
            'plans.*.name.max' => 'Il nome di un abbonamento può avere al massimo 100 caratteri.',
            'plans.*.period.*' => 'Scegli la durata di ogni abbonamento.',
            'plans.*.entries_count.*' => 'Scrivi quanti ingressi comprende il pacchetto (da 1 a 500).',
            'plans.*.price_cents.*' => 'Il prezzo di ogni abbonamento deve essere tra 1 e 10.000 €.',
            'plans.*.features.max' => 'Al massimo '.GymPlan::MAX_FEATURES.' righe in “Cosa include”.',
            'plans.*.features.*.max' => 'Ogni riga di “Cosa include” può avere al massimo 80 caratteri.',
            'plans.*.note.max' => 'Le note possono avere al massimo 200 caratteri.',
        ]);

        DB::transaction(function () use ($profile, $data) {
            $existing = $profile->plans()->get()->keyBy('id');
            $kept = [];

            foreach ($data['plans'] as $index => $row) {
                $period = GymPlanPeriod::from($row['period']);
                $attributes = [
                    'name' => trim($row['name']),
                    'period' => $period,
                    'entries_count' => $period === GymPlanPeriod::Entries ? (int) $row['entries_count'] : null,
                    'price_cents' => (int) $row['price_cents'],
                    'features' => array_values(array_filter(array_map('trim', $row['features'] ?? []))),
                    'note' => filled($row['note'] ?? null) ? trim($row['note']) : null,
                    'is_active' => (bool) ($row['is_active'] ?? true),
                    'sort' => $index,
                ];

                $plan = $existing->get((int) ($row['id'] ?? 0));

                if ($plan !== null) {
                    $plan->update($attributes);
                    $kept[] = $plan->id;
                } else {
                    $kept[] = $profile->plans()->create($attributes)->id;
                }
            }

            $profile->plans()->whereKeyNot($kept)->delete();
            $profile->refreshMonthlyFrom();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Abbonamenti salvati.']);

        return to_route('gym.plans');
    }
}
