import { Check, ChevronDown, X } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { AreaSwitch, areaButtonClassName } from '@/components/mp/area-bits';
import { pillFieldClassName } from '@/components/onboarding/dark-fields';
import {
    AddButton,
    ChipRow,
    DeleteButton,
    EuroField,
} from '@/components/onboarding/trainer/dark-bits';
import type {
    Pricing,
    SessionType,
} from '@/components/onboarding/trainer/draft';
import {
    emptyPackage,
    firstSessionType,
    INCLUDED_LINE_MAX,
    INCLUDED_MAX,
    MAX_PACKAGES,
    MAX_SESSION_TYPES,
    NOTE_MAX,
    SESSION_NAME_MAX,
    sessionNameError,
} from '@/components/onboarding/trainer/draft';
import {
    FriendsFields,
    PackageCard,
    PriceRows,
} from '@/components/onboarding/trainer/step-services';
import {
    NEW_SESSION_NAME,
    removeDuration,
    shortDuration,
} from '@/components/trainer/services/pricing';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

/** The durations of the design; one saved before (2 h 30) stays in its card. */
const DURATIONS = [30, 60, 90, 120];

/** Every duration of at least one kind of session, shortest first. */
function allDurations(pricing: Pricing): number[] {
    return [
        ...new Set(
            pricing.sessions.flatMap((session) =>
                session.prices.map((price) => price.minutes),
            ),
        ),
    ].sort((a, b) => a - b);
}

/** The pills of the design: turquoise when chosen, outlined when not. */
function pillClassName(on: boolean): string {
    return cn(
        'h-11 rounded-full px-4.5 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
        on
            ? 'bg-primary text-primary-foreground'
            : 'bg-transparent text-foreground shadow-[inset_0_0_0_1px_var(--input)]',
    );
}

const titleClassName = 'text-xl leading-6.5 font-bold tracking-[-0.02em]';
const labelClassName = 'text-[15px] leading-5 font-semibold';

/**
 * "Servizi e prezzi" (design "Trainer · Servizi · nuovo"): "Le tue sedute",
 * a card for each kind of session with its own durations, then the extras
 * "Prima seduta scontata", "Porta un amico" and "Pacchetti". Online costs
 * as in person.
 */
export default function ServicesEditor({
    pricing,
    onChange,
}: {
    pricing: Pricing;
    onChange: (pricing: Pricing) => void;
}) {
    const [open, setOpen] = useState<number | null>(0);
    const durations = allDurations(pricing);

    const change = (changes: Partial<Pricing>) =>
        onChange({ ...pricing, ...changes });
    const changeSession = (index: number, changes: Partial<SessionType>) =>
        change({
            sessions: pricing.sessions.map((session, i) =>
                i === index ? { ...session, ...changes } : session,
            ),
        });

    const addSession = () => {
        setOpen(pricing.sessions.length);
        change({
            sessions: [
                ...pricing.sessions,
                { ...firstSessionType, name: '', prices: [] },
            ],
        });
    };

    return (
        <div className="flex flex-col gap-9">
            <section
                aria-label="Le tue sedute"
                className="flex flex-col gap-1.5"
            >
                <div className="flex flex-col gap-1">
                    <h2 className={titleClassName}>Le tue sedute</h2>
                    <p className="text-[13px] leading-4.5 text-muted-foreground md:hidden">
                        Tocca una seduta per scrivere prezzo, descrizione e cosa
                        è incluso. I clienti lo vedono nel tuo profilo.
                    </p>
                </div>
                <div className="mt-2 flex flex-col border-t border-separator">
                    {pricing.sessions.map((session, index) => (
                        <SessionCard
                            key={index}
                            session={session}
                            open={open === index}
                            onToggle={() =>
                                setOpen(open === index ? null : index)
                            }
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
                                    ? () => {
                                          setOpen(null);
                                          change({
                                              sessions: pricing.sessions.filter(
                                                  (_, i) => i !== index,
                                              ),
                                          });
                                      }
                                    : undefined
                            }
                        />
                    ))}
                </div>
                {pricing.sessions.length < MAX_SESSION_TYPES && (
                    <AddButton onClick={addSession} className="mt-3">
                        Aggiungi un tipo di seduta
                    </AddButton>
                )}
            </section>

            <section aria-label="Extra" className="flex flex-col">
                <div className="flex flex-col border-t border-separator">
                    <FirstSession
                        pricing={pricing}
                        durations={durations}
                        change={change}
                    />
                    <ExtraRow
                        title="Porta un amico"
                        description="Chi prenota può invitare amici nella stessa seduta."
                        action={(labelledBy, describedBy) => {
                            const on = pricing.sessions.some(
                                (session) => session.maxPeople > 1,
                            );

                            return (
                                <AreaSwitch
                                    checked={on}
                                    // On: up to 2 people for every kind; off: only the booker.
                                    onToggle={() =>
                                        change({
                                            sessions: pricing.sessions.map(
                                                (session) => ({
                                                    ...session,
                                                    maxPeople: on ? 1 : 2,
                                                    group: [],
                                                }),
                                            ),
                                        })
                                    }
                                    labelledBy={labelledBy}
                                    describedBy={describedBy}
                                />
                            );
                        }}
                    >
                        {pricing.sessions.some(
                            (session) => session.maxPeople > 1,
                        ) && (
                            <div className="flex flex-col gap-3 pb-4">
                                <FriendsFields
                                    sessions={pricing.sessions}
                                    changeSession={changeSession}
                                    chipClassName={pillClassName}
                                />
                            </div>
                        )}
                    </ExtraRow>
                    <ExtraRow
                        title="Pacchetti"
                        description="Es. 10 sedute a un prezzo scontato."
                        action={() =>
                            pricing.packages.length < MAX_PACKAGES && (
                                <button
                                    type="button"
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
                                    className={areaButtonClassName(
                                        'outline',
                                        'sm',
                                    )}
                                >
                                    Aggiungi
                                </button>
                            )
                        }
                    >
                        {pricing.packages.map((item, index) => (
                            <PackageCard
                                key={index}
                                item={item}
                                index={index}
                                durations={durations}
                                sessions={pricing.sessions}
                                className="border-b-0 pt-0 md:px-0"
                                chipClassName={pillClassName}
                                onChange={(changes) =>
                                    change({
                                        packages: pricing.packages.map(
                                            (other, i) =>
                                                i === index
                                                    ? { ...other, ...changes }
                                                    : other,
                                        ),
                                    })
                                }
                                onRemove={() =>
                                    change({
                                        packages: pricing.packages.filter(
                                            (_, i) => i !== index,
                                        ),
                                    })
                                }
                            />
                        ))}
                    </ExtraRow>
                </div>
            </section>
        </div>
    );
}

/** A row of the extras: title, grey line, the switch or button, what opens below. */
function ExtraRow({
    title,
    description,
    action,
    children,
}: {
    title: string;
    description: string;
    action: (labelledBy: string, describedBy: string) => ReactNode;
    children?: ReactNode;
}) {
    const id = useId();

    return (
        <div className="flex flex-col border-b border-separator">
            <div className="flex min-h-19 items-center gap-3.5 py-2.5">
                <span className="flex min-w-0 flex-1 flex-col gap-0.75">
                    <span
                        id={`${id}-title`}
                        className="text-[17px] font-semibold"
                    >
                        {title}
                    </span>
                    <span
                        id={`${id}-note`}
                        className="text-[13px] leading-4.5 text-muted-foreground"
                    >
                        {description}
                    </span>
                </span>
                {action(`${id}-title`, `${id}-note`)}
            </div>
            {children}
        </div>
    );
}

/**
 * "Prima seduta scontata": on, its price (0 = free). The duration is not
 * asked: the saved one, or the shortest of the sessions.
 */
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
    const first = pricing.firstSession;

    return (
        <ExtraRow
            title="Prima seduta scontata"
            description="Per chi prenota con te per la prima volta."
            action={(labelledBy, describedBy) => (
                <AreaSwitch
                    checked={first.enabled}
                    onToggle={() =>
                        change({
                            firstSession: {
                                ...first,
                                enabled: !first.enabled,
                                minutes:
                                    durations.length === 0 ||
                                    durations.includes(first.minutes)
                                        ? first.minutes
                                        : durations[0],
                            },
                        })
                    }
                    labelledBy={labelledBy}
                    describedBy={describedBy}
                />
            )}
        >
            {first.enabled && (
                <div className="flex max-w-60 flex-col gap-2 pb-4">
                    <label htmlFor={`${id}-price`} className={labelClassName}>
                        Prezzo della prima seduta
                    </label>
                    <EuroField
                        id={`${id}-price`}
                        value={first.priceCents}
                        placeholder="0 = gratuita"
                        onChange={(priceCents) =>
                            change({ firstSession: { ...first, priceCents } })
                        }
                    />
                </div>
            )}
        </ExtraRow>
    );
}

/**
 * A kind of session: a row with the name, what is filled and the price;
 * opened, the name, its durations, a price for each, the description and
 * "Cosa è incluso".
 */
function SessionCard({
    session,
    open,
    onToggle,
    nameError,
    onChange,
    onRemove,
}: {
    session: SessionType;
    open: boolean;
    onToggle: () => void;
    nameError: string | null;
    onChange: (changes: Partial<SessionType>) => void;
    onRemove?: () => void;
}) {
    const id = useId();
    const name = session.name.trim() || 'questo tipo di seduta';
    const included = session.included ?? [];
    const [line, setLine] = useState('');
    const minutes = session.prices.map((price) => price.minutes);
    const cents = session.prices
        .map((price) => price.priceCents)
        .filter((value): value is number => value !== null);
    const price =
        cents.length === 0
            ? '— €'
            : cents.length < session.prices.length || new Set(cents).size > 1
              ? `da ${formatPrice(Math.min(...cents))}`
              : formatPrice(cents[0]);
    const summary = [
        minutes.map(shortDuration).join(' · '),
        session.note.trim() ? 'Descrizione pronta' : 'Senza descrizione',
        included.length === 0
            ? 'nulla di incluso'
            : included.length === 1
              ? '1 cosa inclusa'
              : `${included.length} cose incluse`,
    ]
        .filter(Boolean)
        .join(' · ');

    const toggleDuration = (value: number) =>
        onChange(
            minutes.includes(value)
                ? removeDuration(session, value)
                : {
                      prices: [
                          ...session.prices,
                          { minutes: value, priceCents: null },
                      ].sort((a, b) => a.minutes - b.minutes),
                  },
        );

    const addLine = () => {
        const text = line.trim();

        if (text === '' || included.length >= INCLUDED_MAX) {
            return;
        }

        onChange({ included: [...included, text] });
        setLine('');
    };

    return (
        <div className="border-b border-separator">
            <button
                type="button"
                aria-expanded={open}
                aria-controls={`${id}-panel`}
                onClick={onToggle}
                className="flex min-h-19 w-full items-center gap-3.5 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <span className="flex min-w-0 flex-1 flex-col gap-0.75">
                    <span className="truncate text-[17px] font-semibold">
                        {session.name.trim() || NEW_SESSION_NAME}
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        {summary}
                    </span>
                </span>
                <span className="text-[17px] font-bold whitespace-nowrap tabular-nums">
                    {price}
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'size-5 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {open && (
                <div
                    id={`${id}-panel`}
                    className="flex flex-col gap-5.5 pt-1 pb-6"
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <label
                                htmlFor={`${id}-name`}
                                className={labelClassName}
                            >
                                Nome
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
                            aria-describedby={
                                nameError ? `${id}-error` : undefined
                            }
                            onChange={(event) =>
                                onChange({ name: event.target.value })
                            }
                            className={pillFieldClassName}
                        />
                        {nameError && (
                            <p
                                id={`${id}-error`}
                                className="text-[13px] leading-4.5 text-destructive"
                            >
                                {nameError}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className={labelClassName}>Durate</span>
                        <ChipRow
                            label={`Durate di ${name}`}
                            options={[...new Set([...DURATIONS, ...minutes])]
                                .sort((a, b) => a - b)
                                .map((value) => ({
                                    value,
                                    label: shortDuration(value),
                                }))}
                            isOn={(value) => minutes.includes(value)}
                            onToggle={toggleDuration}
                            chipClassName={pillClassName}
                        />
                        {minutes.length === 0 && (
                            <p className="text-[13px] leading-4.5 text-[#ff9230]">
                                Scegli almeno una durata.
                            </p>
                        )}
                    </div>

                    {session.prices.length === 1 ? (
                        <div className="flex max-w-50 flex-col gap-2">
                            <label
                                htmlFor={`${id}-price`}
                                className={labelClassName}
                            >
                                Prezzo
                            </label>
                            <EuroField
                                id={`${id}-price`}
                                value={session.prices[0].priceCents}
                                placeholder="0"
                                onChange={(priceCents) =>
                                    onChange({
                                        prices: [
                                            {
                                                ...session.prices[0],
                                                priceCents,
                                            },
                                        ],
                                    })
                                }
                            />
                        </div>
                    ) : (
                        session.prices.length > 1 && (
                            <div className="flex flex-col gap-1">
                                <span className={labelClassName}>Prezzo</span>
                                <PriceRows
                                    prices={session.prices}
                                    label={(value) =>
                                        `Prezzo di ${name}, ${shortDuration(value)}`
                                    }
                                    onChange={(prices) => onChange({ prices })}
                                />
                            </div>
                        )
                    )}

                    <div className="flex flex-col gap-2">
                        <div className="flex items-baseline justify-between">
                            <label
                                htmlFor={`${id}-note`}
                                className={labelClassName}
                            >
                                Descrizione
                            </label>
                            <span className="text-[13px] text-muted-foreground tabular-nums">
                                {session.note.length}/{NOTE_MAX}
                            </span>
                        </div>
                        <Textarea
                            id={`${id}-note`}
                            rows={3}
                            maxLength={NOTE_MAX}
                            value={session.note}
                            placeholder="Cosa fate insieme, a chi è adatta, cosa portare"
                            onChange={(event) =>
                                onChange({ note: event.target.value })
                            }
                            className="min-h-26 rounded-[14px] border-input bg-card px-4 py-3.5 text-base leading-5.25 focus-visible:border-brand focus-visible:ring-0 md:text-[15px]"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className={labelClassName}>Cosa è incluso</span>
                        {included.length > 0 && (
                            <ul className="flex flex-col gap-1.5">
                                {included.map((item, index) => (
                                    <li
                                        key={`${item}-${index}`}
                                        className="flex min-h-12 items-center gap-3 rounded-2xl bg-card py-2.5 pr-1.5 pl-4 text-[15px] leading-5 font-medium"
                                    >
                                        <Check
                                            aria-hidden="true"
                                            className="size-4 shrink-0 text-brand"
                                            strokeWidth={2.5}
                                        />
                                        <span className="min-w-0 flex-1 break-words">
                                            {item}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Rimuovi «${item}»`}
                                            onClick={() =>
                                                onChange({
                                                    included: included.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                })
                                            }
                                            className="flex size-7.5 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <X
                                                aria-hidden="true"
                                                className="size-3.5"
                                                strokeWidth={2.5}
                                            />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {included.length < INCLUDED_MAX && (
                            <div className="flex items-center gap-2">
                                <Input
                                    className={cn(
                                        pillFieldClassName,
                                        'h-12.5 min-w-0 flex-1 text-base md:h-12.5 md:text-[15px]',
                                    )}
                                    value={line}
                                    maxLength={INCLUDED_LINE_MAX}
                                    aria-label={`Cosa è incluso in ${name}`}
                                    placeholder="Aggiungi una voce"
                                    onChange={(event) =>
                                        setLine(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        // Enter adds the line instead of saving the page.
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            addLine();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={addLine}
                                    disabled={line.trim() === ''}
                                    className="h-12.5 shrink-0 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                                >
                                    Aggiungi
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
