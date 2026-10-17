import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import TrainerServicesController from '@/actions/App/Http/Controllers/TrainerServicesController';
import type { Pricing } from '@/components/onboarding/trainer/draft';
import {
    isPricingValid,
    toServicesPayload,
} from '@/components/onboarding/trainer/draft';
import PageHeading from '@/components/trainer/area/page-heading';
import ClientPreview from '@/components/trainer/services/client-preview';
import FirstSessionSection from '@/components/trainer/services/first-session-section';
import OnlinePricesSection from '@/components/trainer/services/online-prices-section';
import PackagesSection from '@/components/trainer/services/packages-section';
import PriceListSection from '@/components/trainer/services/price-list-section';
import type { FirstSessionMode } from '@/components/trainer/services/pricing';
import {
    firstSessionMode,
    initialColumns,
    previewRows,
} from '@/components/trainer/services/pricing';
import { register } from '@/routes/trainer';

type ServicesProps = {
    /** null until the team approves the profile: it is changed from "Diventa trainer". */
    pricing: Pricing | null;
    /** Trains both online and in person: online may have its own prices. */
    asksOnlinePrice: boolean;
};

export default function Services({ pricing, asksOnlinePrice }: ServicesProps) {
    return (
        <>
            <Head title="Servizi e prezzi" />

            <PageHeading
                title="Servizi e prezzi"
                description="I prezzi sono indicativi: il pagamento lo concordi tu con il cliente."
            />

            {pricing === null ? (
                <p className="text-sm text-muted-foreground">
                    Finché il profilo non è approvato i servizi li modifichi
                    dalla{' '}
                    <Link
                        href={register()}
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        registrazione da trainer
                    </Link>
                    .
                </p>
            ) : (
                <ServicesForm
                    saved={pricing}
                    asksOnlinePrice={asksOnlinePrice}
                />
            )}
        </>
    );
}

/** The pricing with the first session as the chosen mode says (free = 0 €). */
function withFirstMode(pricing: Pricing, mode: FirstSessionMode): Pricing {
    return {
        ...pricing,
        firstSession: {
            ...pricing.firstSession,
            enabled: mode !== 'off',
            priceCents: mode === 'free' ? 0 : pricing.firstSession.priceCents,
        },
    };
}

/**
 * The cards of "Servizi e prezzi" on the left, the preview with "Salva" on
 * the right. Everything is saved with one button, public right away.
 */
function ServicesForm({
    saved,
    asksOnlinePrice,
}: {
    saved: Pricing;
    asksOnlinePrice: boolean;
}) {
    const [pricing, setPricing] = useState(saved);
    const [columns, setColumns] = useState(() => initialColumns(saved));
    const [firstMode, setFirstMode] = useState(() => firstSessionMode(saved));
    const [changed, setChanged] = useState(false);
    // Only the request: the fields live in `pricing`.
    const form = useForm({});

    const ownOnline = asksOnlinePrice && !pricing.onlineSamePrice;
    const toSave = withFirstMode(pricing, firstMode);
    // "A prezzo ridotto" is at least 1 €: 0 is "Gratuita".
    const complete =
        isPricingValid(toSave, ownOnline) &&
        (firstMode !== 'paid' || (pricing.firstSession.priceCents ?? 0) >= 100);

    const update = (changes: Partial<Pricing>) => {
        setPricing({ ...pricing, ...changes });
        setChanged(true);
    };

    const changeFirstMode = (mode: FirstSessionMode) => {
        setFirstMode(mode);
        setChanged(true);

        // From "Gratuita" (0 €) to a lower price: the price to write.
        if (mode === 'paid' && pricing.firstSession.priceCents === 0) {
            setPricing({
                ...pricing,
                firstSession: { ...pricing.firstSession, priceCents: null },
            });
        }
    };

    const errorsOf = (matches: (field: string) => boolean) =>
        Object.entries(form.errors as Record<string, string>)
            .filter(([field]) => matches(field))
            .map(([, message]) => message);
    const isOnlineField = (field: string) =>
        field.startsWith('sessions.') && field.includes('.online');

    const save = (event: React.FormEvent) => {
        event.preventDefault();

        if (!complete || form.processing) {
            return;
        }

        form.transform(() => toServicesPayload(toSave, ownOnline));
        form.put(TrainerServicesController.update.url(), {
            preserveScroll: true,
            // Start again from what was saved.
            onSuccess: (page) => {
                const next = (page.props as unknown as ServicesProps).pricing;

                if (next) {
                    setPricing(next);
                    setFirstMode(firstSessionMode(next));
                }

                setChanged(false);
            },
        });
    };

    let status = 'Modifiche non salvate';

    if (form.processing) {
        status = 'Salvataggio…';
    } else if (!changed) {
        status = 'Tutto salvato';
    } else if (!complete) {
        status = 'Completa i prezzi per salvare';
    }

    return (
        <form
            noValidate
            onSubmit={save}
            className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
            <div className="flex min-w-0 flex-col gap-4">
                <PriceListSection
                    sessions={pricing.sessions}
                    onChange={(sessions) => update({ sessions })}
                    columns={columns}
                    onColumnsChange={setColumns}
                    errors={errorsOf(
                        (field) =>
                            field.startsWith('sessions') &&
                            !isOnlineField(field),
                    )}
                />
                {asksOnlinePrice && (
                    <OnlinePricesSection
                        sessions={pricing.sessions}
                        onChange={(sessions) => update({ sessions })}
                        samePrice={pricing.onlineSamePrice}
                        onSamePriceChange={(onlineSamePrice) =>
                            update({ onlineSamePrice })
                        }
                        columns={columns}
                        errors={errorsOf(isOnlineField)}
                    />
                )}
                <FirstSessionSection
                    mode={firstMode}
                    onModeChange={changeFirstMode}
                    firstSession={pricing.firstSession}
                    onChange={(changes) =>
                        update({
                            firstSession: {
                                ...pricing.firstSession,
                                ...changes,
                            },
                        })
                    }
                    errors={errorsOf((field) =>
                        field.startsWith('first_session'),
                    )}
                />
                <PackagesSection
                    packages={pricing.packages}
                    onChange={(packages) => update({ packages })}
                    sessions={pricing.sessions}
                    errors={errorsOf((field) => field.startsWith('packages'))}
                />
            </div>
            <aside className="xl:sticky xl:top-4">
                <ClientPreview
                    rows={previewRows(toSave, firstMode, ownOnline)}
                    status={status}
                    canSave={changed && complete}
                    saving={form.processing}
                />
            </aside>
        </form>
    );
}

Services.layout = { section: 'services' };
