import { useId } from 'react';
import type { Pricing } from '@/components/onboarding/trainer/draft';
import ChoiceChips from '@/components/shared/choice-chips';
import SegmentedControl from '@/components/shared/segmented-control';
import EuroInput from '@/components/trainer/services/euro-input';
import type { FirstSessionMode } from '@/components/trainer/services/pricing';
import {
    FIRST_SESSION_MINUTES,
    withCurrent,
} from '@/components/trainer/services/pricing';
import SectionCard from '@/components/trainer/services/section-card';
import { formatDuration } from '@/lib/format';

type FirstSession = Pricing['firstSession'];

type FirstSessionSectionProps = {
    mode: FirstSessionMode;
    onModeChange: (mode: FirstSessionMode) => void;
    firstSession: FirstSession;
    onChange: (changes: Partial<FirstSession>) => void;
    errors: string[];
};

const modes: { value: FirstSessionMode; label: string }[] = [
    { value: 'off', label: 'Non la offro' },
    { value: 'free', label: 'Gratuita' },
    { value: 'paid', label: 'A prezzo ridotto' },
];

/**
 * "Prima seduta per nuovi clienti": a fixed duration, free or at a lower
 * price, only for a client's first booking with the trainer.
 */
export default function FirstSessionSection({
    mode,
    onModeChange,
    firstSession,
    onChange,
    errors,
}: FirstSessionSectionProps) {
    const durationId = useId();
    const priceId = useId();

    return (
        <SectionCard
            title="Prima seduta per nuovi clienti"
            description="Solo per chi prenota con te per la prima volta."
            errors={errors}
            action={
                <SegmentedControl
                    aria-label="Prima seduta"
                    className="w-full sm:w-105"
                    options={modes}
                    value={mode}
                    onChange={onModeChange}
                />
            }
        >
            {mode !== 'off' && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                        <span
                            id={durationId}
                            className="text-[13px] font-semibold"
                        >
                            Durata
                        </span>
                        <ChoiceChips
                            aria-labelledby={durationId}
                            className="gap-1.5"
                            options={withCurrent(
                                FIRST_SESSION_MINUTES,
                                firstSession.minutes,
                            ).map((minutes) => ({
                                value: String(minutes),
                                label: formatDuration(minutes),
                            }))}
                            value={String(firstSession.minutes)}
                            onChange={(minutes) =>
                                onChange({ minutes: Number(minutes) })
                            }
                        />
                    </div>
                    {mode === 'paid' && (
                        <div className="flex items-center gap-4">
                            <label
                                htmlFor={priceId}
                                className="text-[13px] font-semibold"
                            >
                                Prezzo
                            </label>
                            <EuroInput
                                id={priceId}
                                required
                                className="w-32"
                                value={firstSession.priceCents}
                                onChange={(priceCents) =>
                                    onChange({ priceCents })
                                }
                            />
                        </div>
                    )}
                </div>
            )}
        </SectionCard>
    );
}
