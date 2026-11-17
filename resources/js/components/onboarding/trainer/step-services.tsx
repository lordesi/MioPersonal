import { useId } from 'react';
import type { ReactNode } from 'react';
import {
    pillFieldClassName,
    Section,
} from '@/components/onboarding/dark-fields';
import {
    AddButton,
    ChipRow,
    Counter,
    DarkCard,
    dashedBoxClassName,
    DeleteButton,
    EuroField,
    SwitchRow,
} from '@/components/onboarding/trainer/dark-bits';
import type {
    DurationPrice,
    Pricing,
    SessionType,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    asksOnlinePrice,
    emptyPackage,
    firstSessionType,
    groupPrices,
    MAX_PACKAGES,
    MAX_PEOPLE,
    MAX_SESSION_TYPES,
    NOTE_MAX,
    onlinePrices,
    PACKAGE_SESSIONS,
    SESSION_NAME_MAX,
    sessionNameError,
} from '@/components/onboarding/trainer/draft';
import SegmentedControl from '@/components/mp/segmented-control';
import type { FirstSessionMode } from '@/components/trainer/services/pricing';
import {
    firstSessionMode,
    PACKAGE_SESSION_OPTIONS,
    removeDuration,
    shortDuration,
    withCurrent,
} from '@/components/trainer/services/pricing';
import { Input } from '@/components/ui/input';
import { SESSION_MINUTES } from '@/lib/booking';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/** Every duration chosen in at least one kind of session, shortest first. */
function chosenDurations(pricing: Pricing): number[] {
    return [
        ...new Set(
            pricing.sessions.flatMap((session) =>
                session.prices.map((price) => price.minutes),
            ),
        ),
    ].sort((a, b) => a - b);
}

/** "1 tipo di seduta · 2 durate", under the button on phones. */
export function servicesSummary(draft: TrainerDraft): string {
    const kinds = draft.pricing.sessions.length;
    const durations = chosenDurations(draft.pricing).length;

    if (durations === 0) {
        return 'Scegli almeno una durata';
    }

    return `${kinds} ${kinds === 1 ? 'tipo' : 'tipi'} di seduta · ${durations} ${durations === 1 ? 'durata' : 'durate'}`;
}

const firstModes: { value: FirstSessionMode; label: string }[] = [
    { value: 'off', label: 'Non la offro' },
    { value: 'free', label: 'Gratuita' },
    { value: 'paid', label: 'Ridotta' },
];

/** The text field of a card (name, note): round, as the others. */
const cardFieldClassName = cn(pillFieldClassName, 'md:h-12');

/**
 * Step 4 "Servizi e prezzi": the durations (the same for every kind of
 * session), the price list, the online prices (who trains both online and
 * in person), "Invita un amico", the first session and the packages. Each
 * part becomes services of the profile: see SaveTrainerServices.
 */
export default function StepServices({ draft, update }: StepProps) {
    const { pricing } = draft;
    const durations = chosenDurations(pricing);

    const change = (changes: Partial<Pricing>) =>
        update({ pricing: { ...pricing, ...changes } });
    const changeSession = (index: number, changes: Partial<SessionType>) =>
        change({
            sessions: pricing.sessions.map((session, i) =>
                i === index ? { ...session, ...changes } : session,
            ),
        });

    // A duration on: every kind of session gets it; off: every one loses it.
    const toggleDuration = (minutes: number) => {
        const on = durations.includes(minutes);

        change({
            sessions: pricing.sessions.map((session) =>
                on
                    ? removeDuration(session, minutes)
                    : session.prices.some((price) => price.minutes === minutes)
                      ? session
                      : {
                            ...session,
                            prices: [
                                ...session.prices,
                                { minutes, priceCents: null },
                            ].sort((a, b) => a.minutes - b.minutes),
                        },
            ),
        });
    };

    const addSession = () =>
        change({
            sessions: [
                ...pricing.sessions,
                {
                    ...firstSessionType,
                    name: '',
                    prices: durations.map((minutes) => ({
                        minutes,
                        priceCents: null,
                    })),
                },
            ],
        });

    return (
        <div className="flex flex-col gap-10 md:gap-12">
            <Section
                title="Quanto durano"
                description="Le durate che i clienti possono scegliere."
            >
                <ChipRow
                    label="Durate"
                    options={SESSION_MINUTES.map((minutes) => ({
                        value: minutes,
                        label: shortDuration(minutes),
                    }))}
                    isOn={(minutes) => durations.includes(minutes)}
                    onToggle={toggleDuration}
                />
            </Section>

            <Section
                title="Listino"
                aside={
                    <Counter>
                        {pricing.sessions.length}
                        <span className="md:hidden"> di </span>
                        <span className="hidden md:inline">
                            {' '}
                            {pricing.sessions.length === 1 ? 'tipo' : 'tipi'} di
                            seduta su{' '}
                        </span>
                        {MAX_SESSION_TYPES}
                    </Counter>
                }
            >
                <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
                    {pricing.sessions.map((session, index) => (
                        <SessionCard
                            key={index}
                            session={session}
                            nameError={
                                session.name.trim() === ''
                                    ? null
                                    : sessionNameError(pricing.sessions, index)
                            }
                            onChange={(changes) =>
                                changeSession(index, changes)
                            }
                            onRemove={
                                pricing.sessions.length > 1
                                    ? () =>
                                          change({
                                              sessions: pricing.sessions.filter(
                                                  (_, i) => i !== index,
                                              ),
                                          })
                                    : undefined
                            }
                        />
                    ))}
                </div>
                {pricing.sessions.length < MAX_SESSION_TYPES && (
                    <AddButton onClick={addSession}>
                        Aggiungi un tipo di seduta
                    </AddButton>
                )}
            </Section>

            {asksOnlinePrice(draft) && (
                <OnlinePrices
                    pricing={pricing}
                    change={change}
                    changeSession={changeSession}
                />
            )}

            <Section
                title="Extra facoltativi"
                description={
                    <span className="hidden md:inline">
                        Aiutano chi è indeciso a provare e a tornare.
                    </span>
                }
            >
                <InviteFriends
                    sessions={pricing.sessions}
                    setSessions={(sessions) => change({ sessions })}
                    changeSession={changeSession}
                />
                <FirstSession
                    pricing={pricing}
                    durations={durations}
                    change={change}
                />
                <Packages
                    pricing={pricing}
                    durations={durations}
                    change={change}
                />
            </Section>
        </div>
    );
}

/** A kind of session: its name, a note and a price for each duration. */
function SessionCard({
    session,
    nameError,
    onChange,
    onRemove,
}: {
    session: SessionType;
    nameError: string | null;
    onChange: (changes: Partial<SessionType>) => void;
    onRemove?: () => void;
}) {
    const id = useId();
    const name = session.name.trim() || 'questo tipo di seduta';

    return (
        <DarkCard>
            <div className="flex items-center justify-between gap-3">
                <label
                    htmlFor={`${id}-name`}
                    className="text-[15px] leading-5 font-semibold"
                >
                    Tipo di seduta
                </label>
                {onRemove && (
                    <DeleteButton
                        label={`Elimina ${name}`}
                        onClick={onRemove}
                    />
                )}
            </div>
            <Input
                id={`${id}-name`}
                value={session.name}
                maxLength={SESSION_NAME_MAX}
                placeholder="Es. Seduta singola"
                aria-invalid={nameError !== null}
                aria-describedby={nameError ? `${id}-error` : undefined}
                onChange={(event) => onChange({ name: event.target.value })}
                className={cardFieldClassName}
            />
            {nameError && (
                <p
                    id={`${id}-error`}
                    className="text-[13px] leading-4.5 text-destructive"
                >
                    {nameError}
                </p>
            )}
            <Input
                aria-label={`Nota di ${name}, facoltativa`}
                value={session.note}
                maxLength={NOTE_MAX}
                placeholder="Nota: es. a domicilio o al parco"
                onChange={(event) => onChange({ note: event.target.value })}
                className={cn(cardFieldClassName, 'font-normal')}
            />
            <PriceRows
                prices={session.prices}
                label={(minutes) =>
                    `Prezzo di ${name}, ${shortDuration(minutes)}`
                }
                onChange={(prices) => onChange({ prices })}
                empty="Scegli almeno una durata qui sopra."
            />
        </DarkCard>
    );
}

/** A row for each duration: "1 h" on the left, the price on the right. */
function PriceRows({
    prices,
    label,
    onChange,
    empty,
    rowLabel = (minutes) => shortDuration(minutes),
}: {
    prices: DurationPrice[];
    label: (minutes: number) => string;
    onChange: (prices: DurationPrice[]) => void;
    empty?: string;
    rowLabel?: (minutes: number) => ReactNode;
}) {
    if (prices.length === 0) {
        return empty ? (
            <p className="border-t border-separator pt-3.5 text-[13px] leading-4.5 text-[#ff9230]">
                {empty}
            </p>
        ) : null;
    }

    return (
        <div className="flex flex-col pt-1">
            {prices.map((price, index) => (
                <div
                    key={price.minutes}
                    className="flex min-h-16 items-center justify-between gap-3 border-t border-separator"
                >
                    <span className="text-[17px] font-semibold tabular-nums">
                        {rowLabel(price.minutes)}
                    </span>
                    <EuroField
                        aria-label={label(price.minutes)}
                        value={price.priceCents}
                        onChange={(priceCents) =>
                            onChange(
                                prices.map((item, i) =>
                                    i === index
                                        ? { ...item, priceCents }
                                        : item,
                                ),
                            )
                        }
                        className="w-32"
                    />
                </div>
            ))}
        </div>
    );
}

/** Online: the same prices, or each kind of session at its own online prices. */
function OnlinePrices({
    pricing,
    change,
    changeSession,
}: {
    pricing: Pricing;
    change: (changes: Partial<Pricing>) => void;
    changeSession: (index: number, changes: Partial<SessionType>) => void;
}) {
    return (
        <Section
            title="Sedute online"
            description="Alleni sia di persona sia online."
        >
            <DarkCard>
                <SwitchRow
                    title="Stessi prezzi online"
                    description={
                        pricing.onlineSamePrice
                            ? 'Online costa come di persona.'
                            : 'Scrivi i prezzi online di ogni tipo di seduta.'
                    }
                    checked={pricing.onlineSamePrice}
                    onCheckedChange={(onlineSamePrice) =>
                        change({ onlineSamePrice })
                    }
                />
            </DarkCard>
            {!pricing.onlineSamePrice && (
                <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
                    {pricing.sessions.map((session, index) => {
                        const name =
                            session.name.trim() ||
                            `Tipo di seduta ${index + 1}`;

                        return (
                            <DarkCard key={index}>
                                <span className="text-[15px] leading-5 font-semibold">
                                    {name} · online
                                </span>
                                <Input
                                    aria-label={`Nota online di ${name}, facoltativa`}
                                    value={session.onlineNote}
                                    maxLength={NOTE_MAX}
                                    placeholder="Nota: es. su Google Meet"
                                    onChange={(event) =>
                                        changeSession(index, {
                                            onlineNote: event.target.value,
                                        })
                                    }
                                    className={cn(
                                        cardFieldClassName,
                                        'font-normal',
                                    )}
                                />
                                <PriceRows
                                    prices={onlinePrices(session)}
                                    label={(minutes) =>
                                        `Prezzo online di ${name}, ${shortDuration(minutes)}`
                                    }
                                    onChange={(online) =>
                                        changeSession(index, { online })
                                    }
                                />
                            </DarkCard>
                        );
                    })}
                </div>
            )}
        </Section>
    );
}

/**
 * "Invita un amico": the booker can bring friends to the same session.
 * On: how many people at most and the total price for each number of
 * people and duration, for every kind of session.
 */
function InviteFriends({
    sessions,
    setSessions,
    changeSession,
}: {
    sessions: SessionType[];
    setSessions: (sessions: SessionType[]) => void;
    changeSession: (index: number, changes: Partial<SessionType>) => void;
}) {
    const on = sessions.some((session) => session.maxPeople > 1);

    // On: up to 2 people for every kind of session; off: only the booker.
    const switchFriends = (value: boolean) =>
        setSessions(
            sessions.map((session) => ({
                ...session,
                maxPeople: value ? 2 : 1,
                group: [],
            })),
        );

    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-[20px] p-4 md:p-5',
                on
                    ? 'shadow-[inset_0_0_0_1px_var(--brand)]'
                    : 'border border-dashed border-border',
            )}
        >
            <SwitchRow
                title="Invita un amico"
                description="Chi prenota può portare amici nella stessa seduta e invitarli con un link. Lo slot resta suo."
                checked={on}
                onCheckedChange={switchFriends}
            />
            {on &&
                sessions.map((session, index) => {
                    const name =
                        session.name.trim() || `Tipo di seduta ${index + 1}`;
                    const group = groupPrices(session);

                    return (
                        <div
                            key={index}
                            className="flex flex-col gap-2 border-t border-separator pt-3"
                        >
                            <span className="text-[15px] leading-5 font-semibold">
                                {name}
                            </span>
                            <ChipRow
                                label={`Persone al massimo, ${name}`}
                                options={Array.from(
                                    { length: MAX_PEOPLE },
                                    (_, i) => ({
                                        value: i + 1,
                                        label:
                                            i === 0
                                                ? 'Solo chi prenota'
                                                : `Fino a ${i + 1}`,
                                    }),
                                )}
                                isOn={(people) => session.maxPeople === people}
                                onToggle={(maxPeople) =>
                                    changeSession(index, { maxPeople })
                                }
                            />
                            {group.length > 0 && (
                                <div className="flex flex-col pt-1">
                                    {group.map((item) => (
                                        <div
                                            key={`${item.people}-${item.minutes}`}
                                            className="flex min-h-16 items-center justify-between gap-3 border-t border-separator"
                                        >
                                            <span className="flex flex-col">
                                                <span className="text-[17px] font-semibold tabular-nums">
                                                    {item.people} persone ·{' '}
                                                    {shortDuration(
                                                        item.minutes,
                                                    )}
                                                </span>
                                                <span className="text-[13px] leading-4.5 text-muted-foreground">
                                                    Prezzo totale
                                                </span>
                                            </span>
                                            <EuroField
                                                aria-label={`${name}: prezzo totale per ${item.people} persone, ${shortDuration(item.minutes)}`}
                                                value={item.priceCents}
                                                onChange={(priceCents) =>
                                                    changeSession(index, {
                                                        group: [
                                                            ...group.filter(
                                                                (other) =>
                                                                    other.people !==
                                                                        item.people ||
                                                                    other.minutes !==
                                                                        item.minutes,
                                                            ),
                                                            {
                                                                ...item,
                                                                priceCents,
                                                            },
                                                        ],
                                                    })
                                                }
                                                className="w-32"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
        </div>
    );
}

/** "Prima seduta per nuovi clienti": not offered, free or at a lower price. */
function FirstSession({
    pricing,
    durations,
    change,
}: {
    pricing: Pricing;
    durations: number[];
    change: (changes: Partial<Pricing>) => void;
}) {
    const id = useId();
    const mode = firstSessionMode(pricing);
    const first = pricing.firstSession;
    const changeFirst = (changes: Partial<Pricing['firstSession']>) =>
        change({ firstSession: { ...first, ...changes } });

    const changeMode = (next: FirstSessionMode) => {
        if (next === 'off') {
            changeFirst({ enabled: false });
        } else if (next === 'free') {
            changeFirst({ enabled: true, priceCents: 0 });
        } else {
            // From "Gratuita" (0 €) to a lower price: the price to write.
            changeFirst({
                enabled: true,
                priceCents: first.priceCents === 0 ? null : first.priceCents,
            });
        }
    };

    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-[20px] p-4 md:p-5',
                mode === 'off'
                    ? 'border border-dashed border-border'
                    : 'shadow-[inset_0_0_0_1px_var(--brand)]',
            )}
        >
            <span className="flex flex-col gap-0.5">
                <span className="text-[17px] leading-5.5 font-semibold">
                    Prima seduta per nuovi clienti
                </span>
                <span className="text-[13px] leading-4.5 text-muted-foreground">
                    Solo per chi prenota con te per la prima volta.
                </span>
            </span>
            <SegmentedControl
                label="Prima seduta per nuovi clienti"
                options={firstModes}
                value={mode}
                onValueChange={changeMode}
            />
            {mode !== 'off' && (
                <>
                    <div className="flex flex-col gap-2">
                        <span className="text-[15px] leading-5 font-semibold">
                            Quanto dura
                        </span>
                        <ChipRow
                            label="Durata della prima seduta"
                            options={withCurrent(
                                durations.length > 0 ? durations : [60],
                                first.minutes,
                            ).map((minutes) => ({
                                value: minutes,
                                label: shortDuration(minutes),
                            }))}
                            isOn={(minutes) => first.minutes === minutes}
                            onToggle={(minutes) => changeFirst({ minutes })}
                        />
                    </div>
                    {mode === 'paid' && (
                        <div className="flex items-center justify-between gap-3">
                            <label
                                htmlFor={`${id}-price`}
                                className="text-[15px] leading-5 font-semibold"
                            >
                                Prezzo della prima seduta
                            </label>
                            <EuroField
                                id={`${id}-price`}
                                value={first.priceCents}
                                // 0 € is "Gratuita": a lower price starts from 1 €.
                                onChange={(priceCents) =>
                                    changeFirst({
                                        priceCents:
                                            priceCents === 0
                                                ? null
                                                : priceCents,
                                    })
                                }
                                className="w-32"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/** "Pacchetti": up to 3, each with sessions, duration and total price. */
function Packages({
    pricing,
    durations,
    change,
}: {
    pricing: Pricing;
    durations: number[];
    change: (changes: Partial<Pricing>) => void;
}) {
    const changePackage = (
        index: number,
        changes: Partial<Pricing['packages'][number]>,
    ) =>
        change({
            packages: pricing.packages.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        });

    return (
        <div className={dashedBoxClassName}>
            <div className="flex items-start justify-between gap-3">
                <span className="flex flex-col gap-0.5">
                    <span className="text-[17px] leading-5.5 font-semibold">
                        Pacchetti
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        Più sedute a un prezzo totale.
                    </span>
                </span>
                <Counter>
                    {pricing.packages.length} di {MAX_PACKAGES}
                </Counter>
            </div>
            {pricing.packages.map((item, index) => (
                <DarkCard key={index} className="md:p-4">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[15px] leading-5 font-semibold">
                            Pacchetto {index + 1}
                            {item.priceCents
                                ? ` · ${formatPrice(Math.round(item.priceCents / item.sessions))} a seduta`
                                : ''}
                        </span>
                        <DeleteButton
                            label={`Elimina il pacchetto ${index + 1}`}
                            onClick={() =>
                                change({
                                    packages: pricing.packages.filter(
                                        (_, i) => i !== index,
                                    ),
                                })
                            }
                        />
                    </div>
                    <ChipRow
                        label={`Sedute del pacchetto ${index + 1}`}
                        options={withCurrent(
                            PACKAGE_SESSION_OPTIONS,
                            item.sessions,
                        )
                            .filter(
                                (sessions) =>
                                    sessions >= PACKAGE_SESSIONS.min &&
                                    sessions <= PACKAGE_SESSIONS.max,
                            )
                            .map((sessions) => ({
                                value: sessions,
                                label: `${sessions} sedute`,
                            }))}
                        isOn={(sessions) => item.sessions === sessions}
                        onToggle={(sessions) =>
                            changePackage(index, { sessions })
                        }
                    />
                    <ChipRow
                        label={`Durata delle sedute del pacchetto ${index + 1}`}
                        options={withCurrent(
                            durations.length > 0 ? durations : [60],
                            item.minutes,
                        ).map((minutes) => ({
                            value: minutes,
                            label: shortDuration(minutes),
                        }))}
                        isOn={(minutes) => item.minutes === minutes}
                        onToggle={(minutes) =>
                            changePackage(index, { minutes })
                        }
                    />
                    <div className="flex items-center justify-between gap-3 border-t border-separator pt-3">
                        <span className="text-[17px] font-semibold">
                            Prezzo totale
                        </span>
                        <EuroField
                            aria-label={`Prezzo totale del pacchetto ${index + 1}`}
                            value={item.priceCents}
                            onChange={(priceCents) =>
                                changePackage(index, { priceCents })
                            }
                            className="w-32"
                        />
                    </div>
                </DarkCard>
            ))}
            {pricing.packages.length < MAX_PACKAGES && (
                <AddButton
                    onClick={() =>
                        change({
                            packages: [
                                ...pricing.packages,
                                {
                                    ...emptyPackage,
                                    minutes: durations.includes(
                                        emptyPackage.minutes,
                                    )
                                        ? emptyPackage.minutes
                                        : (durations[0] ??
                                          emptyPackage.minutes),
                                },
                            ],
                        })
                    }
                >
                    Aggiungi un pacchetto
                </AddButton>
            )}
        </div>
    );
}
