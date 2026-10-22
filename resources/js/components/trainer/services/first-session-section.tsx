import { useId } from 'react';
import type { Pricing } from '@/components/onboarding/trainer/draft';
import ChoiceChips from '@/components/shared/choice-chips';
import EuroInput from '@/components/trainer/services/euro-input';
import type { FirstSessionMode } from '@/components/trainer/services/pricing';
import {
    FIRST_SESSION_MINUTES,
    withCurrent,
} from '@/components/trainer/services/pricing';
import SectionCard from '@/components/trainer/services/section-card';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

type FirstSession = Pricing['firstSession'];

type FirstSessionSectionProps = {
    step: number;
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
    step,
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
            step={step}
            title="Prima seduta per nuovi clienti"
            description="Solo per chi prenota con te per la prima volta. Aiuta chi è indeciso a provare."
            errors={errors}
        >
            <div
                role="radiogroup"
                aria-label="Prima seduta"
                className="grid grid-cols-3 gap-1 rounded-[14px] bg-secondary p-1"
            >
                {modes.map((option) => {
                    const on = option.value === mode;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => onModeChange(option.value)}
                            className={cn(
                                'h-10 rounded-[10px] px-2.5 text-sm leading-5 transition-colors',
                                on
                                    ? 'bg-foreground font-semibold text-background'
                                    : 'font-medium text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>

            {mode !== 'off' && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                    <div className="flex items-center gap-2.5">
                        <span
                            id={durationId}
                            className="text-[13px] leading-4.5 font-semibold"
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
                        <div className="flex items-center gap-2.5">
                            <label
                                htmlFor={priceId}
                                className="text-[13px] leading-4.5 font-semibold"
                            >
                                Prezzo
                            </label>
                            <EuroInput
                                id={priceId}
                                required
                                className="h-10 w-30"
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
