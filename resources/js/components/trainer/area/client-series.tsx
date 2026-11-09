import { router } from '@inertiajs/react';
import { Repeat } from 'lucide-react';
import { useState } from 'react';
import TrainerSeriesController from '@/actions/App/Http/Controllers/TrainerSeriesController';
import FormField from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateMedium, formatPrice } from '@/lib/format';
import type { SeriesService, TrainerClient } from '@/types';

type Errors = Partial<Record<string, string>>;

const weekdays = [
    'Lunedì',
    'Martedì',
    'Mercoledì',
    'Giovedì',
    'Venerdì',
    'Sabato',
    'Domenica',
];

/** Half hours from 06:00 to 22:00. */
const times = Array.from({ length: 33 }, (_, index) => {
    const minutes = 6 * 60 + index * 30;

    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 === 0 ? '00' : '30'}`;
});

const selectClass =
    'h-11 w-full rounded-xl border border-input bg-transparent px-3.5 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive';

/** Today as Y-m-d on the trainer's device. */
function today(): string {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * "Sedute fisse" in the card of a client: «ogni martedì alle 18». The
 * sessions are real confirmed bookings, made some weeks ahead and topped up
 * every day; one of them can still be cancelled on its own. Only for who has
 * an account.
 */
export default function ClientSeries({
    client,
    services,
}: {
    client: TrainerClient;
    services: SeriesService[];
}) {
    return (
        <section aria-label="Sedute fisse" className="flex flex-col gap-3">
            <h3 className="text-[15px] leading-5.5 font-semibold">
                Sedute fisse
            </h3>

            {!client.registered ? (
                <p className="text-sm text-muted-foreground">
                    Si possono fissare quando il cliente si iscrive con il suo
                    link personale.
                </p>
            ) : (
                <>
                    {client.series.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Nessuna seduta fissa. Es. «ogni martedì alle 18:00»:
                            le sedute entrano in calendario da sole.
                        </p>
                    )}
                    {client.series.length > 0 && (
                        <ul className="flex flex-col gap-2">
                            {client.series.map((item) => (
                                <SeriesRow key={item.id} item={item} />
                            ))}
                        </ul>
                    )}
                    <NewSeries client={client} services={services} />
                </>
            )}
        </section>
    );
}

function SeriesRow({ item }: { item: TrainerClient['series'][number] }) {
    const [confirming, setConfirming] = useState(false);

    const end = (cancelFuture: boolean) =>
        router.post(
            TrainerSeriesController.end.url(item.id),
            { cancel_future: cancelFuture },
            { preserveScroll: true, onFinish: () => setConfirming(false) },
        );

    return (
        <li className="flex flex-col gap-2.5 rounded-[14px] border bg-secondary/50 p-3">
            <div className="flex items-center gap-3">
                <span
                    aria-hidden="true"
                    className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-foreground text-background"
                >
                    <Repeat className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        {item.name} · {item.minutes} min
                        {item.usesPackage && ' · dal pacchetto'}
                        {item.endsOn &&
                            ` · fino al ${formatDateMedium(item.endsOn)}`}
                        {` · ${item.upcomingCount} in calendario`}
                    </span>
                </span>
                {!confirming && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-[9px] px-3 text-[13px] font-semibold"
                        onClick={() => setConfirming(true)}
                    >
                        Termina
                    </Button>
                )}
            </div>
            {confirming && (
                <div
                    role="alertdialog"
                    aria-label="Terminare le sedute fisse?"
                    className="flex flex-col gap-2.5 rounded-xl bg-card p-3"
                >
                    <span className="text-sm font-semibold">
                        Cosa fare delle sedute già in calendario?
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10"
                            onClick={() => end(false)}
                        >
                            Tienile
                        </Button>
                        <Button
                            type="button"
                            className="h-10"
                            onClick={() => end(true)}
                        >
                            Annullale tutte
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-10"
                            onClick={() => setConfirming(false)}
                        >
                            Indietro
                        </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Il cliente riceve un solo avviso.
                    </span>
                </div>
            )}
        </li>
    );
}

function NewSeries({
    client,
    services,
}: {
    client: TrainerClient;
    services: SeriesService[];
}) {
    const [open, setOpen] = useState(false);
    // "service:12" or "package:3"
    const [what, setWhat] = useState(
        client.seriesPackage
            ? `package:${client.seriesPackage.id}`
            : `service:${services[0]?.id ?? ''}`,
    );
    const [weekday, setWeekday] = useState('1');
    const [time, setTime] = useState('18:00');
    const [startsOn, setStartsOn] = useState(today);
    const [endsOn, setEndsOn] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    if (!open) {
        return (
            <Button
                type="button"
                variant="outline"
                className="h-11 self-start rounded-xl px-4 font-semibold"
                disabled={services.length === 0 && !client.seriesPackage}
                onClick={() => setOpen(true)}
            >
                <Repeat />
                Rendi fissa
            </Button>
        );
    }

    const [kind, id] = what.split(':');

    const save = () =>
        router.post(
            TrainerSeriesController.store.url(client.recordId),
            {
                service_id: kind === 'service' ? Number(id) : null,
                client_package_id: kind === 'package' ? Number(id) : null,
                weekday: Number(weekday),
                start_time: time,
                starts_on: startsOn,
                ends_on: endsOn || null,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setOpen(false);
                    setErrors({});
                },
                onError: setErrors,
            },
        );

    const error =
        errors.series ?? errors.service_id ?? errors.client_package_id;

    return (
        <div className="flex flex-col gap-3 rounded-[14px] border p-3.5">
            <FormField label="Che seduta" error={error}>
                {({ id: fieldId, describedBy }) => (
                    <select
                        id={fieldId}
                        value={what}
                        onChange={(event) => setWhat(event.target.value)}
                        aria-describedby={describedBy}
                        aria-invalid={!!error}
                        className={selectClass}
                    >
                        {client.seriesPackage && (
                            <option
                                value={`package:${client.seriesPackage.id}`}
                            >
                                Dal pacchetto: {client.seriesPackage.name} (
                                {client.seriesPackage.remaining} rimaste)
                            </option>
                        )}
                        {services.map((service) => (
                            <option
                                key={service.id}
                                value={`service:${service.id}`}
                            >
                                {service.name} · {service.minutes} min ·{' '}
                                {formatPrice(service.priceCents)}
                            </option>
                        ))}
                    </select>
                )}
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Giorno" error={errors.weekday}>
                    {({ id: fieldId }) => (
                        <select
                            id={fieldId}
                            value={weekday}
                            onChange={(event) => setWeekday(event.target.value)}
                            className={selectClass}
                        >
                            {weekdays.map((day, index) => (
                                <option key={day} value={index + 1}>
                                    Ogni {day.toLowerCase()}
                                </option>
                            ))}
                        </select>
                    )}
                </FormField>
                <FormField label="Alle" error={errors.start_time}>
                    {({ id: fieldId }) => (
                        <select
                            id={fieldId}
                            value={time}
                            onChange={(event) => setTime(event.target.value)}
                            className={selectClass}
                        >
                            {times.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    )}
                </FormField>
                <FormField label="Da" error={errors.starts_on}>
                    {({ id: fieldId, describedBy }) => (
                        <Input
                            id={fieldId}
                            type="date"
                            min={today()}
                            value={startsOn}
                            onChange={(event) =>
                                setStartsOn(event.target.value)
                            }
                            aria-describedby={describedBy}
                            className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                        />
                    )}
                </FormField>
                <FormField
                    label="Fino al · facoltativo"
                    error={errors.ends_on}
                    hint="Senza una data continuano finché non le termini."
                >
                    {({ id: fieldId, describedBy }) => (
                        <Input
                            id={fieldId}
                            type="date"
                            min={startsOn}
                            value={endsOn}
                            onChange={(event) => setEndsOn(event.target.value)}
                            aria-describedby={describedBy}
                            className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                        />
                    )}
                </FormField>
            </div>
            <p className="text-[13px] leading-4.5 text-muted-foreground">
                Le sedute entrano subito in calendario come confermate, per le
                prossime 8 settimane, e si aggiungono di settimana in settimana.
                Le date occupate o fuori dai tuoi orari vengono saltate. Il
                cliente riceve un solo avviso.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl px-4"
                    onClick={() => setOpen(false)}
                >
                    Annulla
                </Button>
                <Button
                    type="button"
                    disabled={processing}
                    className="h-11 rounded-xl px-4.5 font-semibold"
                    onClick={save}
                >
                    Fissa le sedute
                </Button>
            </div>
        </div>
    );
}
