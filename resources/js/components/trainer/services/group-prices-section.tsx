import type { CSSProperties } from 'react';
import { useId } from 'react';
import type { SessionType } from '@/components/onboarding/trainer/draft';
import { groupPrices, MAX_PEOPLE } from '@/components/onboarding/trainer/draft';
import ChoiceChips from '@/components/shared/choice-chips';
import SwitchRow from '@/components/shared/switch-row';
import EuroInput from '@/components/trainer/services/euro-input';
import {
    cellLabelClassName,
    NEW_SESSION_NAME,
    priceCellClassName,
    priceCellsClassName,
    shortDuration,
} from '@/components/trainer/services/pricing';
import SectionCard from '@/components/trainer/services/section-card';
import { formatDuration, formatPrice } from '@/lib/format';

type GroupPricesSectionProps = {
    step: number;
    sessions: SessionType[];
    onChange: (sessions: SessionType[]) => void;
    columns: number[];
    errors: string[];
};

/** As the price list: the people, one 104 px column per duration. */
function gridColumns(columns: number[]): CSSProperties {
    return {
        gridTemplateColumns: `minmax(0, 1fr) ${columns.map(() => '104px').join(' ')}`,
    };
}

const PEOPLE_OPTIONS = Array.from(
    { length: MAX_PEOPLE - 1 },
    (_, index) => index + 2,
);

/**
 * "Invita un amico": for each kind of session, whether the client can bring
 * friends, up to how many, and the total for each number of people (the
 * same as one person if the price doesn't change). The slot stays the
 * booker's: only their friends join, with the invite link.
 */
export default function GroupPricesSection({
    step,
    sessions,
    onChange,
    columns,
    errors,
}: GroupPricesSectionProps) {
    const changeSession = (index: number, changes: Partial<SessionType>) =>
        onChange(
            sessions.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        );

    return (
        <SectionCard
            step={step}
            title="Invita un amico"
            description="Chi prenota può portare amici nella stessa seduta. Lo slot resta suo: nessun altro può prenotarlo."
            errors={errors}
        >
            {sessions.map((session, index) => (
                <GroupRow
                    key={index}
                    session={session}
                    columns={columns}
                    onChange={(changes) => changeSession(index, changes)}
                />
            ))}
        </SectionCard>
    );
}

function GroupRow({
    session,
    columns,
    onChange,
}: {
    session: SessionType;
    columns: number[];
    onChange: (changes: Partial<SessionType>) => void;
}) {
    const peopleLabelId = useId();
    const name = session.name.trim() || NEW_SESSION_NAME;
    const enabled = session.maxPeople > 1;
    const prices = groupPrices(session);

    // Turned on: the prices start as the price of one person ("il prezzo non cambia").
    const toggle = (on: boolean) => {
        if (!on) {
            onChange({ maxPeople: 1 });

            return;
        }

        onChange({
            maxPeople: 2,
            group: session.group.length
                ? session.group
                : session.prices.map(({ minutes, priceCents }) => ({
                      people: 2,
                      minutes,
                      priceCents,
                  })),
        });
    };

    // More people: each new row starts from the row before, to change if needed.
    const changeMax = (maxPeople: number) => {
        const group = [...session.group];

        for (let people = 3; people <= maxPeople; people++) {
            for (const { minutes } of session.prices) {
                const has = group.some(
                    (item) =>
                        item.people === people && item.minutes === minutes,
                );
                const before = group.find(
                    (item) =>
                        item.people === people - 1 && item.minutes === minutes,
                );

                if (!has && before) {
                    group.push({ ...before, people });
                }
            }
        }

        onChange({ maxPeople, group });
    };

    const setPrice = (
        people: number,
        minutes: number,
        priceCents: number | null,
    ) =>
        onChange({
            group: [
                ...session.group.filter(
                    (item) =>
                        !(item.people === people && item.minutes === minutes),
                ),
                { people, minutes, priceCents },
            ],
        });

    return (
        <div className="flex flex-col gap-3 rounded-2xl bg-secondary/60 px-4.5 py-4">
            <SwitchRow
                label={`${name}: più persone`}
                description={
                    session.prices.length === 0
                        ? 'Scrivi prima i prezzi nel listino.'
                        : 'Il cliente sceglie quante persone vengono e invita gli amici con un link.'
                }
                checked={enabled}
                disabled={session.prices.length === 0}
                onCheckedChange={toggle}
            />

            {enabled && (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            id={peopleLabelId}
                            className="mr-1 text-[13px] leading-4.5 font-semibold"
                        >
                            Fino a
                        </span>
                        <ChoiceChips
                            aria-labelledby={peopleLabelId}
                            className="gap-1.5"
                            options={PEOPLE_OPTIONS.map((people) => ({
                                value: String(people),
                                label: `${people} persone`,
                            }))}
                            value={String(session.maxPeople)}
                            onChange={(value) => changeMax(Number(value))}
                        />
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Scrivi il prezzo totale della seduta. Se non cambia,
                        lascia lo stesso prezzo: si divide tra chi viene.
                    </p>

                    <div className="sm:overflow-x-auto">
                        <div className="flex flex-col gap-2.5 sm:min-w-115">
                            <div
                                aria-hidden="true"
                                className="hidden gap-2.5 px-3.25 text-xs font-semibold tracking-[0.04em] text-muted-foreground sm:grid"
                                style={gridColumns(columns)}
                            >
                                <span>Persone</span>
                                {columns.map((minutes) => (
                                    <span key={minutes} className="text-right">
                                        {shortDuration(minutes)}
                                    </span>
                                ))}
                            </div>

                            {PEOPLE_OPTIONS.filter(
                                (people) => people <= session.maxPeople,
                            ).map((people) => (
                                <div
                                    key={people}
                                    className="flex flex-col gap-2.5 rounded-2xl border bg-card p-3 sm:grid sm:items-start"
                                    style={gridColumns(columns)}
                                >
                                    <span className="flex min-h-11 items-center text-[15px] font-semibold">
                                        {people} persone
                                    </span>
                                    <div className={priceCellsClassName}>
                                        {columns.map((minutes) => {
                                            const price = prices.find(
                                                (item) =>
                                                    item.people === people &&
                                                    item.minutes === minutes,
                                            );

                                            return (
                                                <div
                                                    key={minutes}
                                                    className={
                                                        priceCellClassName
                                                    }
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className={
                                                            cellLabelClassName
                                                        }
                                                    >
                                                        {shortDuration(minutes)}
                                                    </span>
                                                    {price ? (
                                                        <div className="flex flex-col gap-1">
                                                            <EuroInput
                                                                aria-label={`Prezzo ${name} ${formatDuration(minutes)} per ${people} persone`}
                                                                required
                                                                value={
                                                                    price.priceCents
                                                                }
                                                                onChange={(
                                                                    cents,
                                                                ) =>
                                                                    setPrice(
                                                                        people,
                                                                        minutes,
                                                                        cents,
                                                                    )
                                                                }
                                                            />
                                                            {price.priceCents !==
                                                                null && (
                                                                <span className="text-right text-[11px] text-muted-foreground tabular-nums">
                                                                    {formatPrice(
                                                                        Math.round(
                                                                            price.priceCents /
                                                                                people,
                                                                        ),
                                                                    )}{' '}
                                                                    a testa
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // Not offered in the price list.
                                                        <span className="flex h-11 items-center justify-end pr-3 text-sm text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
