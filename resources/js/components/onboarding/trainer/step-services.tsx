import { Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import FormField from '@/components/auth/form-field';
import type {
    DurationPrice,
    PricePackage,
    Pricing,
    SessionType,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    asksOnlinePrice,
    emptyPackage,
    FIRST_SESSION_NAME,
    hasOwnOnlinePrice,
    MAX_PACKAGES,
    MAX_PRICE_CENTS,
    MAX_SESSION_TYPES,
    NOTE_MAX,
    onlinePrices,
    PACKAGE_SESSIONS,
    SESSION_NAME_MAX,
    sessionNameError,
} from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import ServicePicker from '@/components/profile/service-picker';
import SwitchRow from '@/components/shared/switch-row';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SESSION_MINUTES } from '@/lib/booking';
import { formatDuration, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerService } from '@/types';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/**
 * Step 4 "Servizi e prezzi": a first session (optional, can be free, only
 * for a client's first booking), one or more kinds of session ("Seduta
 * singola", "Calisthenics"…) with a price for each duration, online prices
 * (optional, for each kind) and up to 3 packages. Each part becomes services
 * of the profile: see SaveTrainerServices.
 */
export default function StepServices({ draft, update }: StepProps) {
    const { pricing } = draft;
    const ownOnline = hasOwnOnlinePrice(draft);
    const change = (changes: Partial<Pricing>) =>
        update({ pricing: { ...pricing, ...changes } });
    const changeFirst = (changes: Partial<Pricing['firstSession']>) =>
        change({ firstSession: { ...pricing.firstSession, ...changes } });
    const changeSession = (index: number, changes: Partial<SessionType>) =>
        change({
            sessions: pricing.sessions.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        });
    const changePackage = (index: number, changes: Partial<PricePackage>) =>
        change({
            packages: pricing.packages.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        });

    // "+": a copy of the last kind (same durations and prices), with a new name to write.
    const last = pricing.sessions[pricing.sessions.length - 1];
    const addSession = () =>
        change({
            sessions: [
                ...pricing.sessions,
                {
                    ...last,
                    name: '',
                    prices: [...last.prices],
                    online: [...last.online],
                },
            ],
        });

    return (
        <>
            <StepTitle
                title="Servizi e prezzi"
                description="I prezzi sono indicativi: il pagamento lo concordi tu con il cliente."
            />

            <Card title={FIRST_SESSION_NAME} note="facoltativa">
                <SwitchRow
                    label="Offri una prima seduta"
                    description="Una seduta di prova o di valutazione, con una durata fissa, solo per chi prenota con te per la prima volta. Può essere anche gratis."
                    checked={pricing.firstSession.enabled}
                    onCheckedChange={(enabled) => changeFirst({ enabled })}
                />
                {pricing.firstSession.enabled && (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <DurationField
                                value={pricing.firstSession.minutes}
                                onChange={(minutes) => changeFirst({ minutes })}
                            />
                            <PriceField
                                label="Prezzo (€)"
                                placeholder={`0-${MAX_PRICE_CENTS / 100}`}
                                min={0}
                                value={pricing.firstSession.priceCents}
                                onChange={(priceCents) =>
                                    changeFirst({ priceCents })
                                }
                                required
                            />
                        </div>
                        <NoteField
                            value={pricing.firstSession.note}
                            placeholder="Es. test di partenza e obiettivi"
                            onChange={(note) => changeFirst({ note })}
                        />
                    </>
                )}
            </Card>

            {pricing.sessions.map((session, index) => (
                <SessionCard
                    key={index}
                    session={session}
                    nameError={
                        // Empty is only "required": no message while it's being written.
                        session.name.trim() === ''
                            ? undefined
                            : (sessionNameError(pricing.sessions, index) ??
                              undefined)
                    }
                    ownOnline={ownOnline}
                    onChange={(changes) => changeSession(index, changes)}
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
            <div className="flex flex-col gap-1.5">
                <Button
                    type="button"
                    variant="outline"
                    className="self-start"
                    disabled={pricing.sessions.length >= MAX_SESSION_TYPES}
                    onClick={addSession}
                >
                    <Plus aria-hidden="true" />
                    Aggiungi un tipo di seduta
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                    Es. calisthenics e crossfit a prezzi diversi ·{' '}
                    {pricing.sessions.length} di {MAX_SESSION_TYPES} al massimo
                </span>
            </div>

            {asksOnlinePrice(draft) && (
                <Card title="Online">
                    <SwitchRow
                        label="Online agli stessi prezzi"
                        description="Spegnilo se in videochiamata chiedi prezzi diversi: li scrivi in ogni servizio qui sopra."
                        checked={pricing.onlineSamePrice}
                        onCheckedChange={(onlineSamePrice) =>
                            change({ onlineSamePrice })
                        }
                    />
                </Card>
            )}

            <Card
                title="Pacchetti"
                note={`facoltativi · ${pricing.packages.length} di ${MAX_PACKAGES} al massimo`}
            >
                {pricing.packages.map((item, index) => (
                    <div
                        key={index}
                        className="flex flex-col gap-3 rounded-lg border p-3"
                    >
                        <div className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                            <FormField label="Sedute">
                                {({ id }) => (
                                    <Input
                                        id={id}
                                        type="number"
                                        inputMode="numeric"
                                        min={PACKAGE_SESSIONS.min}
                                        max={PACKAGE_SESSIONS.max}
                                        step={1}
                                        className="tabular-nums"
                                        value={item.sessions}
                                        onChange={(event) =>
                                            changePackage(index, {
                                                sessions: Math.round(
                                                    Number(event.target.value),
                                                ),
                                            })
                                        }
                                    />
                                )}
                            </FormField>
                            <DurationField
                                label="Durata di ogni seduta"
                                value={item.minutes}
                                onChange={(minutes) =>
                                    changePackage(index, { minutes })
                                }
                            />
                            <PriceField
                                label="Prezzo totale (€)"
                                value={item.priceCents}
                                onChange={(priceCents) =>
                                    changePackage(index, { priceCents })
                                }
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="sm:mt-6"
                                aria-label={`Rimuovi il pacchetto ${index + 1}`}
                                onClick={() =>
                                    change({
                                        packages: pricing.packages.filter(
                                            (_, i) => i !== index,
                                        ),
                                    })
                                }
                            >
                                <Trash2 />
                            </Button>
                        </div>
                        <PackageSavings
                            item={item}
                            sessions={pricing.sessions}
                        />
                        <NoteField
                            value={item.note}
                            placeholder="Es. prenoti qui la prima seduta"
                            onChange={(note) => changePackage(index, { note })}
                        />
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    className="self-start"
                    disabled={pricing.packages.length >= MAX_PACKAGES}
                    onClick={() =>
                        change({
                            packages: [...pricing.packages, emptyPackage],
                        })
                    }
                >
                    <Plus aria-hidden="true" />
                    Aggiungi un pacchetto
                </Button>
            </Card>

            <Preview draft={draft} />
        </>
    );
}

function Card({
    title,
    note,
    action,
    children,
}: {
    title: string;
    note?: string;
    /** On the right of the title, e.g. the trash of a kind of session. */
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="flex flex-col gap-3.5 rounded-lg border p-3 md:p-4">
            <div className="flex min-h-8 items-center justify-between gap-3">
                <h3 className="min-w-0 text-[15px] font-semibold break-words tabular-nums">
                    {title}
                    {note && (
                        <span className="font-normal text-muted-foreground">
                            {' '}
                            · {note}
                        </span>
                    )}
                </h3>
                {action}
            </div>
            {children}
        </section>
    );
}

/**
 * A kind of session: its name (free text), a price for each duration, a
 * note and, when online has its own prices, the online prices of this kind.
 */
function SessionCard({
    session,
    nameError,
    ownOnline,
    onChange,
    onRemove,
}: {
    session: SessionType;
    nameError?: string;
    ownOnline: boolean;
    onChange: (changes: Partial<SessionType>) => void;
    /** Missing for the only kind: at least one is needed. */
    onRemove?: () => void;
}) {
    const title = session.name.trim() || 'Nuovo servizio';

    return (
        <Card
            title={title}
            action={
                onRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Rimuovi ${title}`}
                        onClick={onRemove}
                    >
                        <Trash2 />
                    </Button>
                )
            }
        >
            <FormField
                label="Nome del servizio"
                error={nameError}
                counter={{ length: session.name.length, max: SESSION_NAME_MAX }}
            >
                {({ id, describedBy }) => (
                    <Input
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={!!nameError}
                        required
                        maxLength={SESSION_NAME_MAX}
                        placeholder="Es. Seduta di calisthenics"
                        value={session.name}
                        onChange={(event) =>
                            onChange({ name: event.target.value })
                        }
                    />
                )}
            </FormField>
            <DurationPrices
                legend="Durate e prezzi"
                hint="Spunta le durate che offri e scrivi il prezzo di ognuna. Il cliente sceglie la durata quando prenota."
                prices={session.prices}
                onChange={(prices) => onChange({ prices })}
            />
            <NoteField
                value={session.note}
                placeholder="Es. in studio, a domicilio o al parco"
                onChange={(note) => onChange({ note })}
            />
            {ownOnline && (
                <>
                    <OnlinePrices
                        prices={onlinePrices(session)}
                        onChange={(minutes, priceCents) =>
                            onChange({
                                online: [
                                    ...session.online.filter(
                                        (item) => item.minutes !== minutes,
                                    ),
                                    { minutes, priceCents },
                                ],
                            })
                        }
                    />
                    <NoteField
                        label="Nota online (facoltativa)"
                        value={session.onlineNote}
                        placeholder="Es. in videochiamata, con il programma via email"
                        onChange={(onlineNote) => onChange({ onlineNote })}
                    />
                </>
            )}
        </Card>
    );
}

/**
 * Euros on screen, whole cents in the draft (as the other prices of the site).
 * More than 10.000 € can't be typed: the field keeps the previous value.
 */
function PriceInput({
    value,
    onChange,
    min = 1,
    className,
    ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'min'> & {
    value: number | null;
    onChange: (cents: number | null) => void;
    min?: number;
}) {
    return (
        <Input
            {...props}
            type="number"
            inputMode="decimal"
            min={min}
            max={MAX_PRICE_CENTS / 100}
            step={1}
            className={cn('max-w-40 tabular-nums', className)}
            value={value === null ? '' : value / 100}
            onChange={(event) => {
                if (event.target.value === '') {
                    onChange(null);

                    return;
                }

                const cents = Math.round(Number(event.target.value) * 100);

                if (cents <= MAX_PRICE_CENTS) {
                    onChange(cents);
                }
            }}
        />
    );
}

function PriceField({
    label,
    hint,
    placeholder,
    value,
    onChange,
    min = 1,
    required,
}: {
    label: string;
    hint?: string;
    /** Light grey in the empty field, e.g. the allowed range "0-10000". */
    placeholder?: string;
    value: number | null;
    onChange: (cents: number | null) => void;
    min?: number;
    required?: boolean;
}) {
    return (
        <FormField label={label} hint={hint}>
            {({ id, describedBy }) => (
                <PriceInput
                    id={id}
                    aria-describedby={describedBy}
                    placeholder={placeholder}
                    min={min}
                    required={required}
                    value={value}
                    onChange={onChange}
                />
            )}
        </FormField>
    );
}

/**
 * A kind of session: one row for each duration of SESSION_MINUTES. A ticked
 * duration gets its own price (30 minutes is not half of an hour).
 */
function DurationPrices({
    legend,
    hint,
    prices,
    onChange,
}: {
    legend: string;
    hint: string;
    prices: DurationPrice[];
    onChange: (prices: DurationPrice[]) => void;
}) {
    const hintId = useId();

    const toggle = (minutes: number, checked: boolean) =>
        onChange(
            checked
                ? [...prices, { minutes, priceCents: null }].sort(
                      (a, b) => a.minutes - b.minutes,
                  )
                : prices.filter((item) => item.minutes !== minutes),
        );

    const setPrice = (minutes: number, priceCents: number | null) =>
        onChange(
            prices.map((item) =>
                item.minutes === minutes ? { ...item, priceCents } : item,
            ),
        );

    return (
        <fieldset aria-describedby={hintId} className="flex flex-col gap-2">
            <legend className="pb-1 text-sm font-medium">
                {legend}
                <span className="font-normal text-muted-foreground">
                    {' '}
                    · almeno una
                </span>
            </legend>
            <span id={hintId} className="text-xs text-muted-foreground">
                {hint}
            </span>
            {SESSION_MINUTES.map((minutes) => {
                const price = prices.find((item) => item.minutes === minutes);
                const checkboxId = `${hintId}-${minutes}`;

                return (
                    <div
                        key={minutes}
                        className="grid min-h-10 grid-cols-[minmax(0,10rem)_minmax(0,10rem)] items-center gap-3"
                    >
                        <span className="flex items-center gap-2.5">
                            <Checkbox
                                id={checkboxId}
                                checked={price !== undefined}
                                onCheckedChange={(checked) =>
                                    toggle(minutes, checked === true)
                                }
                            />
                            <Label
                                htmlFor={checkboxId}
                                className="font-normal tabular-nums"
                            >
                                {formatDuration(minutes)}
                            </Label>
                        </span>
                        {price && (
                            <PriceInput
                                aria-label={`Prezzo per ${formatDuration(minutes)} (€)`}
                                placeholder="Prezzo €"
                                required
                                value={price.priceCents}
                                onChange={(cents) => setPrice(minutes, cents)}
                            />
                        )}
                    </div>
                );
            })}
        </fieldset>
    );
}

/** The online prices of a kind of session: one for each of its durations. */
function OnlinePrices({
    prices,
    onChange,
}: {
    prices: DurationPrice[];
    onChange: (minutes: number, priceCents: number | null) => void;
}) {
    return (
        <fieldset className="flex flex-col gap-2">
            <legend className="pb-1 text-sm font-medium">
                Prezzi online (€)
            </legend>
            {prices.map((price) => (
                <div
                    key={price.minutes}
                    className="grid min-h-10 grid-cols-[minmax(0,10rem)_minmax(0,10rem)] items-center gap-3"
                >
                    <span className="text-sm tabular-nums">
                        {formatDuration(price.minutes)}
                    </span>
                    <PriceInput
                        aria-label={`Prezzo online per ${formatDuration(price.minutes)} (€)`}
                        placeholder="Prezzo €"
                        required
                        value={price.priceCents}
                        onChange={(cents) => onChange(price.minutes, cents)}
                    />
                </div>
            ))}
        </fieldset>
    );
}

function DurationField({
    label = 'Durata',
    value,
    onChange,
}: {
    label?: string;
    value: number;
    onChange: (minutes: number) => void;
}) {
    return (
        <FormField label={label}>
            {({ id }) => (
                <Select
                    value={String(value)}
                    onValueChange={(minutes) => onChange(Number(minutes))}
                >
                    <SelectTrigger id={id} className="w-full tabular-nums">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SESSION_MINUTES.map((minutes) => (
                            <SelectItem key={minutes} value={String(minutes)}>
                                {formatDuration(minutes)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </FormField>
    );
}

function NoteField({
    label = 'Nota (facoltativa)',
    value,
    placeholder,
    onChange,
}: {
    label?: string;
    value: string;
    placeholder: string;
    onChange: (note: string) => void;
}) {
    return (
        <FormField
            label={label}
            hint="Compare sotto il servizio, sul profilo."
            counter={{ length: value.length, max: NOTE_MAX }}
        >
            {({ id, describedBy }) => (
                // A textarea: a long note wraps instead of running off the field.
                <Textarea
                    id={id}
                    aria-describedby={describedBy}
                    rows={2}
                    maxLength={NOTE_MAX}
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}
        </FormField>
    );
}

/**
 * "40 € a seduta · risparmi l'11%" compared with the cheapest kind of
 * session of the same duration.
 */
function PackageSavings({
    item,
    sessions,
}: {
    item: PricePackage;
    sessions: SessionType[];
}) {
    if (item.priceCents === null || item.sessions < PACKAGE_SESSIONS.min) {
        return null;
    }

    const perSession = Math.round(item.priceCents / item.sessions);
    const prices = sessions
        .flatMap((session) => session.prices)
        .filter((price) => price.minutes === item.minutes)
        .map((price) => price.priceCents)
        .filter((cents): cents is number => cents !== null);
    const full = prices.length > 0 ? Math.min(...prices) : null;
    const saving =
        full !== null && full > 0
            ? Math.round((1 - perSession / full) * 100)
            : 0;

    return (
        <p className="text-sm text-muted-foreground tabular-nums">
            {formatPrice(perSession)} a seduta
            {saving > 0 &&
                ` · risparmi il ${saving}% rispetto alla seduta singola`}
        </p>
    );
}

/** The services as the profile will show them (same component of the profile). */
function Preview({ draft }: { draft: TrainerDraft }) {
    const services = previewServices(draft);
    // The first one until the trainer taps another (as on the profile).
    const [selected, setSelected] = useState<number | null>(null);

    return (
        <section className="flex flex-col gap-2 rounded-lg bg-muted p-3 md:p-4">
            {services.length > 0 ? (
                <ServicePicker
                    legend="Così li vedono i clienti sul tuo profilo"
                    services={services}
                    value={selected ?? services[0].id}
                    onChange={setSelected}
                    variant="detailed"
                />
            ) : (
                <p className="text-sm text-muted-foreground">
                    Scrivi i prezzi per vedere come appaiono i tuoi servizi sul
                    profilo.
                </p>
            )}
        </section>
    );
}

/** "da 30 min a 2 ore", or "1 ora" for a single duration. */
function durationsLabel(minutes: number[]): string {
    const shortest = Math.min(...minutes);
    const longest = Math.max(...minutes);

    return shortest === longest
        ? formatDuration(shortest)
        : `da ${formatDuration(shortest)} a ${formatDuration(longest)}`;
}

/**
 * A kind of session (or its online prices) as one service of the profile,
 * with a price for each duration that has one; null while no price is written.
 */
function durationsService(
    id: number,
    name: string,
    note: string,
    prices: DurationPrice[],
): TrainerService | null {
    const options = prices
        .filter((price) => price.priceCents !== null)
        .map((price, index) => ({
            serviceId: id * 10 + index,
            minutes: price.minutes,
            priceCents: price.priceCents ?? 0,
        }));

    if (options.length === 0) {
        return null;
    }

    return {
        id,
        packageId: null,
        name,
        durationLabel: durationsLabel(options.map((option) => option.minutes)),
        note,
        priceCents: Math.min(...options.map((option) => option.priceCents)),
        options,
    };
}

/** A service with one duration (first session, package). */
function fixedService(
    id: number,
    name: string,
    durationLabel: string,
    note: string,
    minutes: number,
    priceCents: number,
): TrainerService {
    return {
        id,
        packageId: null,
        name,
        durationLabel,
        note,
        priceCents,
        options: [{ serviceId: id, minutes, priceCents }],
    };
}

/**
 * The same services the profile shows (see TrainerProfileController), in
 * the same order: the first session on top, then each kind of session and
 * its online prices, then the packages. A service shows up once it has a price.
 */
function previewServices(draft: TrainerDraft): TrainerService[] {
    const { pricing } = draft;
    const services: (TrainerService | null)[] = [];

    if (
        pricing.firstSession.enabled &&
        pricing.firstSession.priceCents !== null
    ) {
        services.push(
            fixedService(
                1,
                FIRST_SESSION_NAME,
                formatDuration(pricing.firstSession.minutes),
                pricing.firstSession.note,
                pricing.firstSession.minutes,
                pricing.firstSession.priceCents,
            ),
        );
    }

    pricing.sessions.forEach((session, index) => {
        const name = session.name.trim() || 'Nuovo servizio';

        // Ids 10, 11, 12… so their options (id × 10 + n) never meet the others.
        services.push(
            durationsService(
                10 + index * 2,
                name,
                session.note,
                session.prices,
            ),
        );

        if (hasOwnOnlinePrice(draft)) {
            services.push(
                durationsService(
                    11 + index * 2,
                    `${name} (online)`,
                    session.onlineNote,
                    onlinePrices(session),
                ),
            );
        }
    });

    pricing.packages.forEach((item, index) => {
        if (item.priceCents !== null) {
            services.push(
                fixedService(
                    1000 + index,
                    `Pacchetto ${item.sessions} sedute`,
                    `${item.sessions} × ${formatDuration(item.minutes)}`,
                    item.note,
                    item.minutes,
                    item.priceCents,
                ),
            );
        }
    });

    return services.filter((service) => service !== null);
}
