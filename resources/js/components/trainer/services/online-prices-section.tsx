import type { SessionType } from '@/components/onboarding/trainer/draft';
import { NOTE_MAX, onlinePrices } from '@/components/onboarding/trainer/draft';
import SwitchRow from '@/components/shared/switch-row';
import EuroInput from '@/components/trainer/services/euro-input';
import {
    NEW_SESSION_NAME,
    shortDuration,
} from '@/components/trainer/services/pricing';
import SectionCard from '@/components/trainer/services/section-card';
import { Input } from '@/components/ui/input';
import { formatDuration } from '@/lib/format';

type OnlinePricesSectionProps = {
    sessions: SessionType[];
    onChange: (sessions: SessionType[]) => void;
    samePrice: boolean;
    onSamePriceChange: (samePrice: boolean) => void;
    columns: number[];
    errors: string[];
};

/**
 * "Online", only for who trains both online and in person: online at the
 * same prices, or each kind of session with its own online price for the
 * same durations of the price list (not in the design: added for them).
 */
export default function OnlinePricesSection({
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
            title="Online"
            description="Per le sedute in videochiamata."
            errors={errors}
        >
            <SwitchRow
                label="Online agli stessi prezzi"
                description="Spegnilo se in videochiamata chiedi prezzi diversi: li scrivi qui sotto."
                checked={samePrice}
                onCheckedChange={onSamePriceChange}
            />

            {!samePrice && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-left text-xs text-muted-foreground">
                                <th
                                    scope="col"
                                    className="min-w-48 pr-3 pb-2.5 font-semibold"
                                >
                                    Tipo di seduta
                                </th>
                                {columns.map((minutes) => (
                                    <th
                                        key={minutes}
                                        scope="col"
                                        className="px-2 pb-2.5 font-semibold tabular-nums"
                                    >
                                        {shortDuration(minutes)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((session, index) => {
                                const name =
                                    session.name.trim() || NEW_SESSION_NAME;
                                const prices = onlinePrices(session);

                                return (
                                    <tr
                                        key={index}
                                        className="border-t align-top"
                                    >
                                        <td className="py-3 pr-3">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="flex min-h-10 items-center text-[15px] font-semibold break-words">
                                                    {name} (online)
                                                </span>
                                                <Input
                                                    aria-label={`Nota online di ${name}`}
                                                    maxLength={NOTE_MAX}
                                                    placeholder="Nota: es. in videochiamata"
                                                    className="h-8 text-[13px] text-muted-foreground md:text-[13px]"
                                                    value={session.onlineNote}
                                                    onChange={(event) =>
                                                        changeSession(index, {
                                                            onlineNote:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </td>
                                        {columns.map((minutes) => {
                                            const price = prices.find(
                                                (item) =>
                                                    item.minutes === minutes,
                                            );

                                            return (
                                                <td
                                                    key={minutes}
                                                    className="px-2 py-3"
                                                >
                                                    {price ? (
                                                        <EuroInput
                                                            aria-label={`Prezzo online ${name} ${formatDuration(minutes)}`}
                                                            required
                                                            className="w-22"
                                                            value={
                                                                price.priceCents
                                                            }
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
                                                        <span className="flex h-10 w-22 items-center justify-center text-sm text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </SectionCard>
    );
}
