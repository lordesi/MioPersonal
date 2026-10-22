import type { CSSProperties } from 'react';
import type { SessionType } from '@/components/onboarding/trainer/draft';
import { NOTE_MAX, onlinePrices } from '@/components/onboarding/trainer/draft';
import SwitchRow from '@/components/shared/switch-row';
import EuroInput from '@/components/trainer/services/euro-input';
import {
    NEW_SESSION_NAME,
    shortDuration,
} from '@/components/trainer/services/pricing';
import SectionCard from '@/components/trainer/services/section-card';
import { formatDuration } from '@/lib/format';

type OnlinePricesSectionProps = {
    step: number;
    sessions: SessionType[];
    onChange: (sessions: SessionType[]) => void;
    samePrice: boolean;
    onSamePriceChange: (samePrice: boolean) => void;
    columns: number[];
    errors: string[];
};

/** As the price list: name, one 104 px column per duration. */
function gridColumns(columns: number[]): CSSProperties {
    return {
        gridTemplateColumns: `minmax(0, 1fr) ${columns.map(() => '104px').join(' ')}`,
    };
}

/**
 * "Online", only for who trains both online and in person: online at the
 * same prices, or each kind of session with its own online price for the
 * same durations of the price list (not in the design: added for them).
 */
export default function OnlinePricesSection({
    step,
    sessions,
    onChange,
    samePrice,
    onSamePriceChange,
    columns,
    errors,
}: OnlinePricesSectionProps) {
    const changeSession = (index: number, changes: Partial<SessionType>) =>
        onChange(
            sessions.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        );

    const setPrice = (
        index: number,
        minutes: number,
        priceCents: number | null,
    ) => {
        const session = sessions[index];

        changeSession(index, {
            online: [
                ...session.online.filter((item) => item.minutes !== minutes),
                { minutes, priceCents },
            ],
        });
    };

    return (
        <SectionCard
            step={step}
            title="Online"
            description="Per le sedute in videochiamata."
            errors={errors}
        >
            <SwitchRow
                label="Online agli stessi prezzi"
                description="Spegnilo se in videochiamata chiedi prezzi diversi: li scrivi qui sotto."
                checked={samePrice}
                onCheckedChange={onSamePriceChange}
                className="rounded-2xl bg-secondary/60 px-4.5 py-4"
            />

            {!samePrice && (
                <div className="overflow-x-auto">
                    <div className="flex min-w-115 flex-col gap-2.5">
                        <div
                            aria-hidden="true"
                            className="grid gap-2.5 px-3.25 text-xs font-semibold tracking-[0.04em] text-muted-foreground"
                            style={gridColumns(columns)}
                        >
                            <span>Tipo di seduta</span>
                            {columns.map((minutes) => (
                                <span key={minutes} className="text-right">
                                    {shortDuration(minutes)}
                                </span>
                            ))}
                        </div>

                        {sessions.map((session, index) => {
                            const name =
                                session.name.trim() || NEW_SESSION_NAME;
                            const prices = onlinePrices(session);

                            return (
                                <div
                                    key={index}
                                    className="grid items-start gap-2.5 rounded-2xl border bg-secondary/50 p-3"
                                    style={gridColumns(columns)}
                                >
                                    <div className="flex min-w-0 flex-col gap-2">
                                        <span className="flex min-h-11 items-center text-[15px] font-semibold break-words">
                                            {name} (online)
                                        </span>
                                        <input
                                            aria-label={`Nota online di ${name}`}
                                            maxLength={NOTE_MAX}
                                            placeholder="Nota: es. in videochiamata"
                                            className="h-9.5 w-full min-w-0 rounded-[10px] border bg-card px-3 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10"
                                            value={session.onlineNote}
                                            onChange={(event) =>
                                                changeSession(index, {
                                                    onlineNote:
                                                        event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    {columns.map((minutes) => {
                                        const price = prices.find(
                                            (item) => item.minutes === minutes,
                                        );

                                        return price ? (
                                            <EuroInput
                                                key={minutes}
                                                aria-label={`Prezzo online ${name} ${formatDuration(minutes)}`}
                                                required
                                                value={price.priceCents}
                                                onChange={(cents) =>
                                                    setPrice(
                                                        index,
                                                        minutes,
                                                        cents,
                                                    )
                                                }
                                            />
                                        ) : (
                                            // Not offered in the price list: not online either.
                                            <span
                                                key={minutes}
                                                className="flex h-11 items-center justify-end pr-3 text-sm text-muted-foreground"
                                            >
                                                —
                                            </span>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </SectionCard>
    );
}
