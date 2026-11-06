<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Http\Requests\TrainerProfileRequest;
use App\Models\GymPlan;
use App\Models\GymProfile;
use App\Models\GymPromotion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Promozioni" of the gym area: public between their dates (Rome days).
 * Either a promotional price or a discount in percent, optionally on a plan.
 */
class GymPromotionsController extends Controller
{
    use BuildsGymArea;

    public function show(): Response
    {
        $profile = $this->gymOrFail();

        return Inertia::render('gym/promotions', [
            'gymArea' => $this->gymArea(),
            'promotions' => $profile->promotions()->with('plan')->get()->map(fn (GymPromotion $promotion) => [
                'id' => $promotion->id,
                'title' => $promotion->title,
                'description' => $promotion->description ?? '',
                'planId' => $promotion->gym_plan_id,
                'planName' => $promotion->plan?->name,
                'promoPriceCents' => $promotion->promo_price_cents,
                'discountPercent' => $promotion->discount_percent,
                'startsOn' => $promotion->starts_on?->toDateString(),
                'endsOn' => $promotion->ends_on?->toDateString(),
                'state' => $promotion->state(),
            ])->values(),
            'plans' => $profile->plans->map(fn (GymPlan $plan) => [
                'value' => (string) $plan->id,
                'label' => $plan->name,
            ])->values(),
            'maxActive' => GymProfile::MAX_ACTIVE_PROMOTIONS,
            'today' => GymPromotion::today(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $profile = $this->gymOrFail();
        $profile->promotions()->create($this->validated($request, $profile));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Promozione aggiunta.']);

        return to_route('gym.promotions');
    }

    public function update(Request $request, GymPromotion $promotion): RedirectResponse
    {
        $profile = $this->gymOrFail();
        abort_if($promotion->gym_profile_id !== $profile->id, 404);

        $promotion->update($this->validated($request, $profile, $promotion));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Promozione aggiornata.']);

        return to_route('gym.promotions');
    }

    public function destroy(GymPromotion $promotion): RedirectResponse
    {
        $profile = $this->gymOrFail();
        abort_if($promotion->gym_profile_id !== $profile->id, 404);

        $promotion->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Promozione eliminata.']);

        return to_route('gym.promotions');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, GymProfile $profile, ?GymPromotion $current = null): array
    {
        $validator = validator($request->all(), [
            'title' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'gym_plan_id' => ['nullable', 'integer', Rule::exists(GymPlan::class, 'id')->where('gym_profile_id', $profile->id)],
            'kind' => ['required', Rule::in(['price', 'percent'])],
            'promo_price_cents' => ['nullable', 'required_if:kind,price', 'integer', 'min:0', 'max:'.TrainerProfileRequest::MAX_PRICE_CENTS],
            'discount_percent' => ['nullable', 'required_if:kind,percent', 'integer', 'between:1,90'],
            'starts_on' => ['nullable', 'date_format:Y-m-d'],
            'ends_on' => array_filter([
                'nullable', 'date_format:Y-m-d', 'after_or_equal:'.GymPromotion::today(),
                // Compared with the start only when there is one.
                $request->filled('starts_on') ? 'after_or_equal:starts_on' : null,
            ]),
        ], [
            'title.required' => 'Scrivi il titolo della promozione.',
            'title.max' => 'Il titolo può avere al massimo 100 caratteri.',
            'description.max' => 'La descrizione può avere al massimo 500 caratteri.',
            'gym_plan_id.*' => 'Scegli un abbonamento della tua palestra.',
            'kind.*' => 'Scegli se indicare un prezzo o uno sconto.',
            'promo_price_cents.*' => 'Il prezzo in promozione deve essere tra 0 e 10.000 €.',
            'discount_percent.*' => 'Lo sconto deve essere tra 1% e 90%.',
            'starts_on.*' => 'Scegli una data di inizio valida.',
            'ends_on.after_or_equal' => 'La fine deve venire dopo l’inizio e non può essere già passata.',
            'ends_on.*' => 'Scegli una data di fine valida.',
        ]);

        $validator->after(function (Validator $validator) use ($profile, $current, $request) {
            // At most MAX_ACTIVE_PROMOTIONS public at the same time (today).
            $activeNow = $profile->activePromotions()
                ->when($current, fn ($query) => $query->whereKeyNot($current->id))
                ->count();
            $starts = $request->input('starts_on');
            $willBeActive = $starts === null || $starts <= GymPromotion::today();

            if ($willBeActive && $activeNow >= GymProfile::MAX_ACTIVE_PROMOTIONS) {
                $validator->errors()->add('title', 'Puoi avere al massimo '.GymProfile::MAX_ACTIVE_PROMOTIONS.' promozioni attive insieme.');
            }
        });

        $data = $validator->validate();
        $isPrice = $data['kind'] === 'price';

        return [
            'title' => trim($data['title']),
            'description' => filled($data['description'] ?? null) ? trim($data['description']) : null,
            'gym_plan_id' => $data['gym_plan_id'] ?? null,
            'promo_price_cents' => $isPrice ? (int) $data['promo_price_cents'] : null,
            'discount_percent' => $isPrice ? null : (int) $data['discount_percent'],
            'starts_on' => $data['starts_on'] ?? null,
            'ends_on' => $data['ends_on'] ?? null,
        ];
    }
}
