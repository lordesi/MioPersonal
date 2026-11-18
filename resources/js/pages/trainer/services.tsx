import { Head, Link, useForm } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import TrainerServicesController from '@/actions/App/Http/Controllers/TrainerServicesController';
import type {
    PlaceType,
    Pricing,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    initialDraft,
    isPricingValid,
    toServicesPayload,
} from '@/components/onboarding/trainer/draft';
import { Counter } from '@/components/onboarding/trainer/dark-bits';
import StepServices from '@/components/onboarding/trainer/step-services';
import ProfilePage, {
    ProfileSection,
    SaveBar,
} from '@/components/trainer/profile-pages/profile-page';
import { ServiceRows } from '@/components/trainer/services/client-preview';
import {
    firstSessionMode,
    previewRows,
} from '@/components/trainer/services/pricing';
import {
    stepListClassName,
    stepRowClassName,
} from '@/components/trainer/ui/styles';
import { register } from '@/routes/trainer';

type ServicesProps = {
    /** null until the registration is sent. */
    pricing: Pricing | null;
    /** Trains both online and in person: online may have its own prices. */
    asksOnlinePrice: boolean;
    /** Confirmed sessions of the last 90 days by service, the most booked first. */
    booked: { label: string; count: number }[];
};

export default function Services({
    pricing,
    asksOnlinePrice,
    booked,
}: ServicesProps) {
    return (
        <>
            <Head title="Servizi e prezzi" />

            <ProfilePage
                title={
                    <>
                        Servizi e <strong>prezzi</strong>
                    </>
                }
                intro="Quanto durano le sedute, quanto costano e gli extra per i clienti. Le modifiche sono subito sul profilo."
            >
                {pricing === null ? (
                    <p className="text-[15px] text-muted-foreground">
                        Scegli i tuoi servizi nella{' '}
                        <Link
                            href={register()}
                            className="font-semibold text-brand underline-offset-4 hover:underline"
                        >
                            registrazione da trainer
                        </Link>
                        : poi potrai cambiarli da qui.
                    </p>
                ) : (
                    <ServicesForm
                        saved={pricing}
                        asksOnlinePrice={asksOnlinePrice}
                        booked={booked}
                    />
                )}
            </ProfilePage>
        </>
    );
}

/**
 * The fields of step 4 of "Diventa trainer" on the prices of the profile,
 * the preview for the clients and "Salva modifiche". Everything is saved
 * with one button, public right away.
 */
function ServicesForm({
    saved,
    asksOnlinePrice,
    booked,
}: {
    saved: Pricing;
    asksOnlinePrice: boolean;
    booked: ServicesProps['booked'];
}) {
    const [pricing, setPricing] = useState(saved);
    const [changed, setChanged] = useState(false);
    // Only the request: the fields live in `pricing`.
    const form = useForm({});

    // Step 4 asks the online prices from the places: online and somewhere else.
    const places: PlaceType[] = asksOnlinePrice ? ['online', 'home'] : [];
    const draft: TrainerDraft = { ...initialDraft, places, pricing };

    const ownOnline = asksOnlinePrice && !pricing.onlineSamePrice;
    const firstMode = firstSessionMode(pricing);
    // "A prezzo ridotto" is at least 1 €: 0 is "Gratuita".
    const complete =
        isPricingValid(pricing, ownOnline) &&
        (firstMode !== 'paid' || (pricing.firstSession.priceCents ?? 0) >= 100);

    const update = (changes: Partial<TrainerDraft>) => {
        if (changes.pricing) {
            setPricing(changes.pricing);
            setChanged(true);
        }
    };

    const errors = Object.values(form.errors as Record<string, string>);

    const save = (event: React.FormEvent) => {
        event.preventDefault();

        if (!complete || form.processing) {
            return;
        }

        form.transform(() => toServicesPayload(pricing, ownOnline));
        form.put(TrainerServicesController.update.url(), {
            preserveScroll: true,
            // Start again from what was saved.
            onSuccess: (page) => {
                const next = (page.props as unknown as ServicesProps).pricing;

                if (next) {
                    setPricing(next);
                }

                setChanged(false);
            },
        });
    };

    let status: string | undefined;

    if (errors.length > 0) {
        status = 'Controlla i campi segnati';
    } else if (changed) {
        status = complete
            ? 'Modifiche non salvate'
            : 'Completa i prezzi per salvare';
    }

    return (
        <form noValidate onSubmit={save} className="flex flex-col gap-10">
            {errors.length > 0 && (
                <ul
                    role="alert"
                    className="flex flex-col gap-1 rounded-[20px] p-4 text-[15px] text-destructive shadow-[inset_0_0_0_1.5px_var(--destructive)]"
                >
                    {errors.map((message) => (
                        <li key={message}>{message}</li>
                    ))}
                </ul>
            )}

            <StepServices draft={draft} update={update} />

            <ProfileSection
                title="Così ti vedono i clienti"
                aside={
                    <Counter>
                        <Eye aria-hidden="true" className="size-4.5" />
                    </Counter>
                }
            >
                <ServiceRows
                    rows={previewRows(pricing, firstMode, ownOnline)}
                    empty="Scrivi i prezzi per vedere come appaiono i tuoi servizi sul profilo."
                />
            </ProfileSection>

            {booked.length > 0 && (
                <ProfileSection
                    title="Prenotazioni degli ultimi 90 giorni"
                    description="Le sedute confermate, dal servizio più prenotato."
                >
                    <ul className={stepListClassName}>
                        {booked.map((row) => (
                            <li
                                key={row.label}
                                className={`${stepRowClassName} flex items-center justify-between gap-3 text-[17px]`}
                            >
                                <span className="min-w-0">{row.label}</span>
                                <span className="font-semibold tabular-nums">
                                    {row.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                </ProfileSection>
            )}

            <SaveBar
                status={status}
                disabled={!changed || !complete}
                saving={form.processing}
            />
        </form>
    );
}

Services.layout = { section: 'services' };
