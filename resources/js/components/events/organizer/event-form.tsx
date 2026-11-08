import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import ChoiceChips from '@/components/shared/choice-chips';
import SwitchRow from '@/components/shared/switch-row';
import PageHeading from '@/components/trainer/area/page-heading';
import Panel from '@/components/trainer/area/panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { organizerRoutes } from '@/lib/events';
import type { CatalogOption, OrganizerArea } from '@/types';

type EditedEvent = {
    id: number;
    type: string;
    title: string;
    description: string;
    disciplineId: number | null;
    place: string;
    gymProfileId: number | null;
    address: string;
    cityId: number | null;
    /** "YYYY-MM-DD", Rome */
    date: string;
    /** "18:30" */
    start: string;
    end: string;
    capacity: number;
    /** "12,50" */
    price: string;
    coverUrl: string | null;
    registered: number;
    inSeries: boolean;
    href: string;
};

export type OrganizerEventFormProps = {
    area: OrganizerArea;
    /** null: "Nuovo evento". */
    event: EditedEvent | null;
    types: CatalogOption[];
    places: CatalogOption[];
    /** The gym itself, or the gyms where the trainer works. */
    gyms: CatalogOption[];
    disciplines: CatalogOption[];
    cities: CatalogOption[];
    maxDates: number;
    maxCapacity: number;
    approved: boolean;
};

const NONE = 'none';

/** Tomorrow, Rome, "YYYY-MM-DD". */
function tomorrow(): string {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

/**
 * "Nuovo evento" / "Modifica evento": what, when, where, places and price.
 * A new event can repeat every week; a date of a series changes alone or
 * with the next ones.
 */
export default function OrganizerEventForm({
    area,
    event,
    types,
    places,
    gyms,
    disciplines,
    cities,
    maxDates,
    maxCapacity,
}: OrganizerEventFormProps) {
    const routes = organizerRoutes(area);
    const [preview, setPreview] = useState<string | null>(null);
    const [repeat, setRepeat] = useState(false);
    const form = useForm({
        type: event?.type ?? 'workshop',
        title: event?.title ?? '',
        description: event?.description ?? '',
        discipline_id: event?.disciplineId ?? (null as number | null),
        place: event?.place ?? (gyms.length > 0 ? 'gym' : 'address'),
        gym_profile_id:
            event?.gymProfileId ??
            (gyms.length > 0 ? Number(gyms[0].value) : (null as number | null)),
        address: event?.address ?? '',
        city_id: event?.cityId ?? (null as number | null),
        date: event?.date ?? tomorrow(),
        start: event?.start ?? '10:00',
        end: event?.end ?? '11:00',
        capacity: event?.capacity ?? 12,
        price: event?.price ?? '0',
        dates: 1,
        scope: 'this' as 'this' | 'following',
        cover: null as File | null,
        remove_cover: false,
    });

    const errors = form.errors as Record<string, string | undefined>;
    const shownCover =
        preview ?? (!form.data.remove_cover ? (event?.coverUrl ?? null) : null);
    const placeOptions = places.filter(
        (item) => item.value !== 'gym' || gyms.length > 0,
    );

    const submit = () => {
        const options = { forceFormData: true, preserveScroll: true };

        form.transform((data) => ({
            ...data,
            dates: !event && repeat ? Math.max(2, data.dates) : 1,
        }));

        if (event) {
            form.post(routes.update.url(event.id), options);
        } else {
            form.post(routes.store.url(), options);
        }
    };

    return (
        <>
            <Head title={event ? 'Modifica evento' : 'Nuovo evento'} />

            <Button asChild variant="ghost" className="-ml-3 self-start">
                <Link href={event ? event.href : routes.index.url()}>
                    <ArrowLeft aria-hidden="true" />
                    {event ? 'Torna all’evento' : 'Eventi'}
                </Link>
            </Button>

            <PageHeading
                title={event ? 'Modifica evento' : 'Nuovo evento'}
                description="Pubblicato subito: i clienti prenotano il posto finché ce ne sono, e pagano sul posto."
            />

            <form
                noValidate
                className="flex flex-col gap-4"
                onSubmit={(submitEvent) => {
                    submitEvent.preventDefault();
                    submit();
                }}
            >
                <Panel title="Cosa">
                    <div className="flex flex-col gap-1.5">
                        <Label id="event-type">Tipo</Label>
                        <ChoiceChips
                            aria-labelledby="event-type"
                            options={types}
                            value={form.data.type}
                            onChange={(value) => form.setData('type', value)}
                        />
                        <InputError message={errors.type} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="event-title">Titolo</Label>
                        <Input
                            id="event-title"
                            value={form.data.title}
                            maxLength={80}
                            placeholder="Es. Workshop di mobilità per la schiena"
                            onChange={(changeEvent) =>
                                form.setData('title', changeEvent.target.value)
                            }
                        />
                        <InputError message={errors.title} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="event-description">
                            Descrizione (facoltativa)
                        </Label>
                        <Textarea
                            id="event-description"
                            rows={4}
                            maxLength={2000}
                            placeholder="Cosa si fa, per chi è, cosa portare."
                            value={form.data.description}
                            onChange={(changeEvent) =>
                                form.setData(
                                    'description',
                                    changeEvent.target.value,
                                )
                            }
                        />
                        <InputError message={errors.description} />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:max-w-80">
                        <Label>Disciplina (facoltativa)</Label>
                        <Select
                            value={
                                form.data.discipline_id === null
                                    ? NONE
                                    : String(form.data.discipline_id)
                            }
                            onValueChange={(value) =>
                                form.setData(
                                    'discipline_id',
                                    value === NONE ? null : Number(value),
                                )
                            }
                        >
                            <SelectTrigger
                                aria-label="Disciplina"
                                className="w-full"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE}>Nessuna</SelectItem>
                                {disciplines.map((item) => (
                                    <SelectItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.discipline_id} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="event-cover">Foto (facoltativa)</Label>
                        {shownCover && (
                            <div className="relative max-w-120 overflow-hidden rounded-xl">
                                <img
                                    src={shownCover}
                                    alt=""
                                    className="aspect-16/9 w-full object-cover"
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    aria-label="Togli la foto"
                                    className="absolute right-2 bottom-2 size-8"
                                    onClick={() => {
                                        setPreview(null);
                                        form.setData((data) => ({
                                            ...data,
                                            cover: null,
                                            remove_cover: true,
                                        }));
                                    }}
                                >
                                    <Trash2 aria-hidden="true" />
                                </Button>
                            </div>
                        )}
                        <Input
                            id="event-cover"
                            type="file"
                            accept="image/jpeg,image/png"
                            className="max-w-120"
                            onChange={(changeEvent) => {
                                const file =
                                    changeEvent.target.files?.[0] ?? null;
                                setPreview(
                                    file ? URL.createObjectURL(file) : null,
                                );
                                form.setData((data) => ({
                                    ...data,
                                    cover: file,
                                    remove_cover: false,
                                }));
                            }}
                        />
                        <InputError message={errors.cover} />
                    </div>
                </Panel>

                <Panel title="Quando">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="event-date">Data</Label>
                            <Input
                                id="event-date"
                                type="date"
                                value={form.data.date}
                                onChange={(changeEvent) =>
                                    form.setData(
                                        'date',
                                        changeEvent.target.value,
                                    )
                                }
                            />
                            <InputError message={errors.date} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="event-start">Inizio</Label>
                            <Input
                                id="event-start"
                                type="time"
                                step={300}
                                value={form.data.start}
                                onChange={(changeEvent) =>
                                    form.setData(
                                        'start',
                                        changeEvent.target.value,
                                    )
                                }
                            />
                            <InputError message={errors.start} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="event-end">Fine</Label>
                            <Input
                                id="event-end"
                                type="time"
                                step={300}
                                value={form.data.end}
                                onChange={(changeEvent) =>
                                    form.setData(
                                        'end',
                                        changeEvent.target.value,
                                    )
                                }
                            />
                            <InputError message={errors.end} />
                        </div>
                    </div>

                    {!event && (
                        <>
                            <SwitchRow
                                label="Ripeti ogni settimana"
                                description="Stesso giorno e orario: ogni data ha i suoi posti e i suoi iscritti."
                                checked={repeat}
                                onCheckedChange={setRepeat}
                            />
                            {repeat && (
                                <div className="flex flex-col gap-1.5 sm:max-w-60">
                                    <Label>Quante date</Label>
                                    <Select
                                        value={String(
                                            Math.max(2, form.data.dates),
                                        )}
                                        onValueChange={(value) =>
                                            form.setData('dates', Number(value))
                                        }
                                    >
                                        <SelectTrigger
                                            aria-label="Quante date"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(
                                                { length: maxDates - 1 },
                                                (_, index) => index + 2,
                                            ).map((count) => (
                                                <SelectItem
                                                    key={count}
                                                    value={String(count)}
                                                >
                                                    {count} settimane
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.dates} />
                                </div>
                            )}
                        </>
                    )}
                </Panel>

                <Panel title="Dove">
                    <ChoiceChips
                        aria-label="Dove"
                        options={placeOptions}
                        value={form.data.place}
                        onChange={(value) => form.setData('place', value)}
                    />
                    <InputError message={errors.place} />

                    {form.data.place === 'gym' && (
                        <div className="flex flex-col gap-1.5 sm:max-w-100">
                            <Label>Palestra</Label>
                            <Select
                                value={
                                    form.data.gym_profile_id === null
                                        ? undefined
                                        : String(form.data.gym_profile_id)
                                }
                                onValueChange={(value) =>
                                    form.setData(
                                        'gym_profile_id',
                                        Number(value),
                                    )
                                }
                            >
                                <SelectTrigger
                                    aria-label="Palestra"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Scegli la palestra" />
                                </SelectTrigger>
                                <SelectContent>
                                    {gyms.map((item) => (
                                        <SelectItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.gym_profile_id} />
                        </div>
                    )}

                    {form.data.place === 'address' && (
                        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="event-address">Indirizzo</Label>
                                <Input
                                    id="event-address"
                                    value={form.data.address}
                                    maxLength={160}
                                    placeholder="Es. Parco Sempione, ingresso Arco della Pace"
                                    onChange={(changeEvent) =>
                                        form.setData(
                                            'address',
                                            changeEvent.target.value,
                                        )
                                    }
                                />
                                <InputError message={errors.address} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Città</Label>
                                <Select
                                    value={
                                        form.data.city_id === null
                                            ? undefined
                                            : String(form.data.city_id)
                                    }
                                    onValueChange={(value) =>
                                        form.setData('city_id', Number(value))
                                    }
                                >
                                    <SelectTrigger
                                        aria-label="Città"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Scegli" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map((item) => (
                                            <SelectItem
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.city_id} />
                            </div>
                        </div>
                    )}

                    {form.data.place === 'online' && (
                        <p className="text-sm text-muted-foreground">
                            Manda il link della diretta agli iscritti: trovi le
                            loro email nella pagina dell’evento.
                        </p>
                    )}
                </Panel>

                <Panel title="Posti e prezzo">
                    <div className="grid gap-4 sm:max-w-120 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="event-capacity">Posti</Label>
                            <Input
                                id="event-capacity"
                                type="number"
                                inputMode="numeric"
                                min={Math.max(1, event?.registered ?? 1)}
                                max={maxCapacity}
                                value={form.data.capacity}
                                onChange={(changeEvent) =>
                                    form.setData(
                                        'capacity',
                                        Number(changeEvent.target.value),
                                    )
                                }
                            />
                            <InputError message={errors.capacity} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="event-price">Prezzo (€)</Label>
                            <Input
                                id="event-price"
                                inputMode="decimal"
                                value={form.data.price}
                                placeholder="0 = gratis"
                                onChange={(changeEvent) =>
                                    form.setData(
                                        'price',
                                        changeEvent.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={errors.price_cents ?? errors.price}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Si paga sul posto. Chi prenota fuori dall’app? Dopo la
                        pubblicazione puoi correggere i posti rimasti.
                    </p>
                </Panel>

                {event?.inSeries && (
                    <Panel title="Quali date cambiare">
                        <ChoiceChips
                            aria-label="Quali date cambiare"
                            options={[
                                { value: 'this', label: 'Solo questa data' },
                                {
                                    value: 'following',
                                    label: 'Questa e le successive',
                                },
                            ]}
                            value={form.data.scope}
                            onChange={(value) =>
                                form.setData(
                                    'scope',
                                    value as 'this' | 'following',
                                )
                            }
                        />
                    </Panel>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="submit"
                        className="h-11 px-6"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        {event ? 'Salva' : 'Pubblica'}
                    </Button>
                    {event && event.registered > 0 && (
                        <p className="text-sm text-muted-foreground">
                            Se cambi data o orario, gli iscritti vengono
                            avvisati.
                        </p>
                    )}
                </div>
            </form>
        </>
    );
}
