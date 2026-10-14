import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import FormField from '@/components/auth/form-field';
import type {
    PricePackage,
    Pricing,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    asksOnlinePrice,
    emptyPackage,
    hasOwnOnlinePrice,
    MAX_PACKAGES,
    NOTE_MAX,
    PACKAGE_SESSIONS,
} from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import ServicePicker from '@/components/profile/service-picker';
import SwitchRow from '@/components/shared/switch-row';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SESSION_MINUTES } from '@/lib/booking';
import { formatDuration, formatPrice } from '@/lib/format';
import type { TrainerService } from '@/types';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/**
 * Step 4 "Servizi e prezzi": an hourly price (required) for the single
 * session in every duration of step 5, an online price (optional), a first
 * session (optional, can be free) and up to 3 packages. Each part becomes a
 * service of the profile: see SaveTrainerProfile::saveServices().
 */
export default function StepServices({ draft, update }: StepProps) {
    const { pricing } = draft;
    const change = (changes: Partial<Pricing>) =>
        update({ pricing: { ...pricing, ...changes } });
    const changeFirst = (changes: Partial<Pricing['firstSession']>) =>
        change({ firstSession: { ...pricing.firstSession, ...changes } });
    const changePackage = (index: number, changes: Partial<PricePackage>) =>
        change({
            packages: pricing.packages.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        });

    return (
        <>
            <StepTitle
                title="Servizi e prezzi"
                description="I prezzi sono indicativi: il pagamento lo concordi tu con il cliente."
            />

            <Card title="Seduta singola">
                <PriceField
                    label="Prezzo all’ora (€)"
                    hint="Vale per tutte le durate che scegli al passo successivo: per esempio 1 ora e mezza costa 1,5 volte il prezzo all’ora."
                    value={pricing.hourlyCents}
                    onChange={(hourlyCents) => change({ hourlyCents })}
                    required
                />
                <NoteField
                    value={pricing.singleNote}
                    placeholder="Es. in studio, a domicilio o al parco"
                    onChange={(singleNote) => change({ singleNote })}
                />
            </Card>

            {asksOnlinePrice(draft) && (
                <Card title="Online">
                    <SwitchRow
                        label="Online allo stesso prezzo"
                        description="Spegnilo se in videochiamata chiedi un prezzo diverso."
                        checked={pricing.onlineSamePrice}
                        onCheckedChange={(onlineSamePrice) =>
                            change({ onlineSamePrice })
                        }
                    />
                    {hasOwnOnlinePrice(draft) && (
                        <>
                            <PriceField
                                label="Prezzo online all’ora (€)"
                                value={pricing.onlineHourlyCents}
                                onChange={(onlineHourlyCents) =>
                                    change({ onlineHourlyCents })
                                }
                                required
                            />
                            <NoteField
                                value={pricing.onlineNote}
                                placeholder="Es. in videochiamata, con il programma via email"
                                onChange={(onlineNote) =>
                                    change({ onlineNote })
                                }
                            />
                        </>
                    )}
                </Card>
            )}

            <Card title="Prima seduta" note="facoltativa">
                <SwitchRow
                    label="Offri una prima seduta"
                    description="Una seduta di prova o di valutazione, con una durata fissa. Può essere anche gratis."
                    checked={pricing.firstSession.enabled}
                    onCheckedChange={(enabled) => changeFirst({ enabled })}
                />
                {pricing.firstSession.enabled && (
                    <>
                        <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr]">
                            <FormField
                                label="Nome"
                                counter={{
                                    length: pricing.firstSession.name.length,
                                    max: 100,
                                }}
                            >
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        aria-describedby={describedBy}
                                        required
                                        maxLength={100}
                                        placeholder="Es. Valutazione iniziale"
                                        value={pricing.firstSession.name}
                                        onChange={(event) =>
                                            changeFirst({
                                                name: event.target.value,
                                            })
                                        }
                                    />
                                )}
                            </FormField>
                            <DurationField
                                value={pricing.firstSession.minutes}
                                onChange={(minutes) => changeFirst({ minutes })}
                            />
                            <PriceField
                                label="Prezzo (€)"
                                hint="0 = gratis"
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
                            hourlyCents={pricing.hourlyCents}
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
    children,
}: {
    title: string;
    note?: string;
    children: ReactNode;
}) {
    return (
        <section className="flex flex-col gap-3.5 rounded-lg border p-3 md:p-4">
            <h3 className="text-[15px] font-semibold tabular-nums">
                {title}
                {note && (
                    <span className="font-normal text-muted-foreground">
                        {' '}
                        · {note}
                    </span>
                )}
            </h3>
            {children}
        </section>
    );
}

/** Euros on screen, whole cents in the draft (as the other prices of the site). */
function PriceField({
    label,
    hint,
    value,
    onChange,
    min = 1,
    required,
}: {
    label: string;
    hint?: string;
    value: number | null;
    onChange: (cents: number | null) => void;
    min?: number;
    required?: boolean;
}) {
    return (
        <FormField label={label} hint={hint}>
            {({ id, describedBy }) => (
                <Input
                    id={id}
                    aria-describedby={describedBy}
                    type="number"
                    inputMode="decimal"
                    min={min}
                    step={1}
                    required={required}
                    className="max-w-40 tabular-nums"
                    value={value === null ? '' : value / 100}
                    onChange={(event) =>
                        onChange(
                            event.target.value === ''
                                ? null
                                : Math.round(Number(event.target.value) * 100),
                        )
                    }
                />
            )}
        </FormField>
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
    value,
    placeholder,
    onChange,
}: {
    value: string;
    placeholder: string;
    onChange: (note: string) => void;
}) {
    return (
        <FormField
            label="Nota (facoltativa)"
            hint="Compare sotto il servizio, sul profilo."
            counter={{ length: value.length, max: NOTE_MAX }}
        >
            {({ id, describedBy }) => (
                <Input
                    id={id}
                    aria-describedby={describedBy}
                    maxLength={NOTE_MAX}
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}
        </FormField>
    );
}

/** "40 € a seduta · risparmi l'11%" compared with the hourly price. */
function PackageSavings({
    item,
    hourlyCents,
}: {
    item: PricePackage;
    hourlyCents: number | null;
}) {
    if (item.priceCents === null || item.sessions < PACKAGE_SESSIONS.min) {
        return null;
    }

    const perSession = Math.round(item.priceCents / item.sessions);
    const full =
        hourlyCents === null
            ? null
            : Math.round((hourlyCents * item.minutes) / 60);
    const saving =
        full !== null && full > 0
            ? Math.round((1 - perSession / full) * 100)
            : 0;

    return (
        <p className="text-sm text-muted-foreground tabular-nums">
            {formatPrice(perSession)} a seduta
            {saving > 0 &&
                ` · risparmi il ${saving}% rispetto al prezzo all’ora`}
        </p>
    );
}

/** The services as the profile will show them (same component of the profile). */
function Preview({ draft }: { draft: TrainerDraft }) {
    const services = previewServices(draft);
    const [selected, setSelected] = useState(1);

    return (
        <section className="flex flex-col gap-2 rounded-lg bg-muted p-3 md:p-4">
            {services.length > 0 ? (
                <ServicePicker
                    legend="Così li vedono i clienti sul tuo profilo"
                    services={services}
                    value={selected}
                    onChange={setSelected}
                    variant="detailed"
                />
            ) : (
                <p className="text-sm text-muted-foreground">
                    Scrivi il prezzo all’ora per vedere come appaiono i tuoi
                    servizi sul profilo.
                </p>
            )}
        </section>
    );
}

/** "da 30 min a 2 ore" from the durations of step 5. */
function durationsLabel(sessionMinutes: number[]): string {
    if (sessionMinutes.length === 0) {
        return formatDuration(60);
    }

    const shortest = Math.min(...sessionMinutes);
    const longest = Math.max(...sessionMinutes);

    return shortest === longest
        ? formatDuration(shortest)
        : `da ${formatDuration(shortest)} a ${formatDuration(longest)}`;
}

/**
 * The same rows SaveTrainerProfile writes, in the format of the profile.
 * A service shows up once it has a price.
 */
function previewServices(draft: TrainerDraft): TrainerService[] {
    const { pricing } = draft;
    const hourly = {
        minutes: 60,
        durationLabel: durationsLabel(draft.sessionMinutes),
        perHour: true,
        fixedDuration: false,
    };
    const services: TrainerService[] = [
        {
            ...hourly,
            id: 1,
            name: 'Seduta singola',
            note: pricing.singleNote,
            priceCents: pricing.hourlyCents ?? -1,
        },
    ];

    if (hasOwnOnlinePrice(draft)) {
        services.push({
            ...hourly,
            id: 2,
            name: 'Seduta online',
            note: pricing.onlineNote,
            priceCents: pricing.onlineHourlyCents ?? -1,
        });
    }

    if (pricing.firstSession.enabled) {
        services.push({
            id: 3,
            name: pricing.firstSession.name || 'Prima seduta',
            minutes: pricing.firstSession.minutes,
            durationLabel: formatDuration(pricing.firstSession.minutes),
            note: pricing.firstSession.note,
            priceCents: pricing.firstSession.priceCents ?? -1,
            perHour: false,
            fixedDuration: true,
        });
    }

    pricing.packages.forEach((item, index) =>
        services.push({
            id: 4 + index,
            name: `Pacchetto ${item.sessions} sedute`,
            minutes: item.minutes,
            durationLabel: `${item.sessions} × ${formatDuration(item.minutes)}`,
            note: item.note,
            priceCents: item.priceCents ?? -1,
            perHour: false,
            fixedDuration: true,
        }),
    );

    // -1 = no price written yet.
    return services.filter((service) => service.priceCents >= 0);
}
