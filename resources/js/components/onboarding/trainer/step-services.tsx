import { Eye, Info } from 'lucide-react';
import { useState } from 'react';
import type {
    Pricing,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    asksOnlinePrice,
    hasOwnOnlinePrice,
} from '@/components/onboarding/trainer/draft';
import {
    DarkPanel,
    PanelNote,
    StepColumns,
} from '@/components/onboarding/trainer/onboarding-shell';
import { ServiceRows } from '@/components/trainer/services/client-preview';
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

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/**
 * Step 4 "Servizi e prezzi", with the same cards of "Servizi" in the trainer
 * area: the price list (a row for each kind of session, a column for each
 * duration), online prices (only for who trains both online and in person),
 * the first session for new clients and up to 3 packages. "Gratuita" is a
 * first session at 0 €. Each part becomes services of the profile: see
 * SaveTrainerServices.
 */
export default function StepServices({ draft, update }: StepProps) {
    const { pricing } = draft;
    // The durations shown as columns: the ones with a price when the step opens.
    const [columns, setColumns] = useState(() => initialColumns(pricing));
    const firstMode = firstSessionMode(pricing);
    const asksOnline = asksOnlinePrice(draft);
    const firstStep = asksOnline ? 3 : 2;

    const change = (changes: Partial<Pricing>) =>
        update({ pricing: { ...pricing, ...changes } });
    const changeFirst = (changes: Partial<Pricing['firstSession']>) =>
        change({ firstSession: { ...pricing.firstSession, ...changes } });

    const changeFirstMode = (mode: FirstSessionMode) => {
        if (mode === 'off') {
            changeFirst({ enabled: false });
        } else if (mode === 'free') {
            changeFirst({ enabled: true, priceCents: 0 });
        } else {
            // From "Gratuita" (0 €) to a lower price: the price to write.
            changeFirst({
                enabled: true,
                priceCents:
                    pricing.firstSession.priceCents === 0
                        ? null
                        : pricing.firstSession.priceCents,
            });
        }
    };

    return (
        <StepColumns
            aside={
                <DarkPanel
                    title="Anteprima"
                    action={
                        <Eye
                            aria-hidden="true"
                            className="size-4.5 text-sidebar-muted-foreground"
                        />
                    }
                    className="gap-3.5"
                >
                    <ServiceRows
                        rows={previewRows(
                            pricing,
                            firstMode,
                            hasOwnOnlinePrice(draft),
                        )}
                        empty="Inserisci almeno un prezzo nel listino: comparirà qui."
                    />
                    <PanelNote icon={<Info aria-hidden="true" />}>
                        Dopo l’approvazione puoi modificare prezzi e pacchetti
                        da Servizi, nella tua area trainer.
                    </PanelNote>
                </DarkPanel>
            }
        >
            <PriceListSection
                sessions={pricing.sessions}
                onChange={(sessions) => change({ sessions })}
                columns={columns}
                onColumnsChange={setColumns}
                errors={[]}
            />
            {asksOnline && (
                <OnlinePricesSection
                    step={2}
                    sessions={pricing.sessions}
                    onChange={(sessions) => change({ sessions })}
                    samePrice={pricing.onlineSamePrice}
                    onSamePriceChange={(onlineSamePrice) =>
                        change({ onlineSamePrice })
                    }
                    columns={columns}
                    errors={[]}
                />
            )}
            <FirstSessionSection
                step={firstStep}
                mode={firstMode}
                onModeChange={changeFirstMode}
                firstSession={pricing.firstSession}
                onChange={(changes) =>
                    // 0 € is "Gratuita": a lower price starts from 1 €.
                    changeFirst(
                        changes.priceCents === 0
                            ? { ...changes, priceCents: null }
                            : changes,
                    )
                }
                errors={[]}
            />
            <PackagesSection
                step={firstStep + 1}
                packages={pricing.packages}
                onChange={(packages) => change({ packages })}
                sessions={pricing.sessions}
                errors={[]}
            />
        </StepColumns>
    );
}
