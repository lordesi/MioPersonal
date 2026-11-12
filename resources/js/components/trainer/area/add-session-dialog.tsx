import { Link, router } from '@inertiajs/react';
import { Check, Copy, Mail, MessageCircle } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import FormField from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatPrice } from '@/lib/format';
import { whatsAppUrl } from '@/lib/whatsapp';
import { services as servicesPage } from '@/routes/trainer';
import { store } from '@/routes/trainer/calendar/sessions';
import { dismiss } from '@/routes/trainer/clients/invite-prompt';
import type { InvitePrompt, SessionOptions } from '@/types';

type Errors = Partial<Record<string, string>>;

/** The value of "+ Aggiungi cliente" in the list of clients. */
const NEW_CLIENT = 'new';

const selectClass =
    'h-11 w-full rounded-xl border border-input bg-transparent px-3.5 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive';

const inputClass = 'h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]';

type AddSessionDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    options: SessionOptions;
    /** "YYYY-MM-DD": the day chosen in the calendar. */
    date: string;
    /** "YYYY-MM-DD", Rome. */
    today: string;
};

/**
 * "Aggiungi seduta" (TrainerManualSessionController): with someone of the
 * list or someone new, at any time. Without an account the session is
 * confirmed at once and the next step suggests inviting them; with an
 * account the client gets a notification to accept it.
 */
export default function AddSessionDialog({
    open,
    onOpenChange,
    options,
    date,
    today,
}: AddSessionDialogProps) {
    const [invite, setInvite] = useState<InvitePrompt | null>(null);

    const close = (next: boolean) => {
        onOpenChange(next);

        if (!next) {
            setInvite(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
                {invite ? (
                    <InviteStep invite={invite} onDone={() => close(false)} />
                ) : (
                    <SessionForm
                        // A fresh form each time the dialog opens on another day.
                        key={date}
                        options={options}
                        date={date < today ? today : date}
                        today={today}
                        onCancel={() => close(false)}
                        onSaved={(prompt) =>
                            prompt ? setInvite(prompt) : close(false)
                        }
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function SessionForm({
    options,
    date: initialDate,
    today,
    onCancel,
    onSaved,
}: {
    options: SessionOptions;
    date: string;
    today: string;
    onCancel: () => void;
    onSaved: (invite: InvitePrompt | null) => void;
}) {
    const { clients, services, places } = options;
    const [client, setClient] = useState(
        clients[0] ? String(clients[0].id) : NEW_CLIENT,
    );
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [serviceId, setServiceId] = useState(String(services[0]?.id ?? ''));
    const [minutes, setMinutes] = useState(String(services[0]?.minutes ?? 60));
    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState('18:00');
    const [placeId, setPlaceId] = useState(String(places[0]?.id ?? ''));
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    const isNew = client === NEW_CLIENT;
    const chosen = clients.find((item) => String(item.id) === client);
    const registered = clients.filter((item) => item.registered);
    const offApp = clients.filter((item) => !item.registered);
    const firstName = (isNew ? name : (chosen?.name ?? '')).split(' ')[0];

    if (services.length === 0) {
        return (
            <>
                <DialogHeader>
                    <DialogTitle>Aggiungi seduta</DialogTitle>
                    <DialogDescription>
                        Per mettere una seduta in calendario serve almeno un
                        servizio: il prezzo e la durata partono da lì.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button asChild className="h-11 rounded-xl font-semibold">
                        <Link href={servicesPage()}>
                            Vai a Servizi e prezzi
                        </Link>
                    </Button>
                </DialogFooter>
            </>
        );
    }

    const chooseService = (value: string) => {
        setServiceId(value);
        const service = services.find((item) => String(item.id) === value);

        if (service) {
            setMinutes(String(service.minutes));
        }
    };

    const save = () =>
        router.post(
            store.url(),
            {
                client_record_id: isNew ? null : Number(client),
                new_client: isNew ? { name, email, phone } : null,
                service_id: Number(serviceId),
                date,
                time,
                minutes: Number(minutes),
                place_id: places.length > 1 ? Number(placeId) : null,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: setErrors,
                // "Invita Marco su Miopersonal": only for someone without an account.
                onSuccess: (page) =>
                    onSaved(
                        (
                            page.flash as
                                | { invitePrompt?: InvitePrompt }
                                | undefined
                        )?.invitePrompt ?? null,
                    ),
            },
        );

    const clientError =
        errors.client_record_id ??
        errors.new_client ??
        errors['new_client.name'];

    return (
        <>
            <DialogHeader>
                <DialogTitle>Aggiungi seduta</DialogTitle>
                <DialogDescription>
                    Anche con chi non è ancora su Miopersonal: la tieni in
                    calendario insieme alle altre.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3.5">
                <FormField label="Cliente" error={clientError}>
                    {({ id, describedBy }) => (
                        <select
                            id={id}
                            value={client}
                            onChange={(event) => setClient(event.target.value)}
                            aria-describedby={describedBy}
                            aria-invalid={!!clientError}
                            className={selectClass}
                        >
                            {registered.length > 0 && (
                                <optgroup label="Su Miopersonal">
                                    {registered.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            {offApp.length > 0 && (
                                <optgroup label="Non ancora iscritti">
                                    {offApp.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            <option value={NEW_CLIENT}>
                                + Aggiungi cliente
                            </option>
                        </select>
                    )}
                </FormField>

                {isNew && (
                    <div className="flex flex-col gap-3 rounded-[14px] border bg-secondary/50 p-3.5">
                        <FormField
                            label="Nome e cognome"
                            error={errors['new_client.name']}
                        >
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    value={name}
                                    maxLength={100}
                                    autoComplete="off"
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    aria-describedby={describedBy}
                                    className={inputClass}
                                />
                            )}
                        </FormField>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                                label="Telefono · facoltativo"
                                error={errors['new_client.phone']}
                            >
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        type="tel"
                                        value={phone}
                                        autoComplete="off"
                                        onChange={(event) =>
                                            setPhone(event.target.value)
                                        }
                                        aria-describedby={describedBy}
                                        className={inputClass}
                                    />
                                )}
                            </FormField>
                            <FormField
                                label="Email · facoltativa"
                                error={errors['new_client.email']}
                            >
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        type="email"
                                        value={email}
                                        autoComplete="off"
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        aria-describedby={describedBy}
                                        className={inputClass}
                                    />
                                )}
                            </FormField>
                        </div>
                    </div>
                )}

                <FormField label="Seduta" error={errors.service_id}>
                    {({ id, describedBy }) => (
                        <select
                            id={id}
                            value={serviceId}
                            onChange={(event) =>
                                chooseService(event.target.value)
                            }
                            aria-describedby={describedBy}
                            aria-invalid={!!errors.service_id}
                            className={selectClass}
                        >
                            {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name} · {service.minutes} min ·{' '}
                                    {formatPrice(service.priceCents)}
                                </option>
                            ))}
                        </select>
                    )}
                </FormField>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <FormField
                        label="Giorno"
                        error={errors.date ?? errors.start}
                    >
                        {({ id, describedBy }) => (
                            <Input
                                id={id}
                                type="date"
                                min={today}
                                value={date}
                                onChange={(event) =>
                                    setDate(event.target.value)
                                }
                                aria-describedby={describedBy}
                                aria-invalid={!!(errors.date ?? errors.start)}
                                className={inputClass}
                            />
                        )}
                    </FormField>
                    <FormField label="Ora" error={errors.time}>
                        {({ id, describedBy }) => (
                            <Input
                                id={id}
                                type="time"
                                step={300}
                                value={time}
                                onChange={(event) =>
                                    setTime(event.target.value)
                                }
                                aria-describedby={describedBy}
                                className={inputClass}
                            />
                        )}
                    </FormField>
                    <FormField label="Minuti" error={errors.minutes}>
                        {({ id, describedBy }) => (
                            <Input
                                id={id}
                                type="number"
                                inputMode="numeric"
                                min={15}
                                max={240}
                                step={5}
                                value={minutes}
                                onChange={(event) =>
                                    setMinutes(event.target.value)
                                }
                                aria-describedby={describedBy}
                                className={inputClass}
                            />
                        )}
                    </FormField>
                </div>

                {places.length > 1 && (
                    <FormField label="Dove" error={errors.place_id}>
                        {({ id, describedBy }) => (
                            <select
                                id={id}
                                value={placeId}
                                onChange={(event) =>
                                    setPlaceId(event.target.value)
                                }
                                aria-describedby={describedBy}
                                className={selectClass}
                            >
                                {places.map((place) => (
                                    <option key={place.id} value={place.id}>
                                        {place.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </FormField>
                )}

                <p className="text-[13px] leading-4.5 text-muted-foreground">
                    {chosen?.registered
                        ? `${firstName} riceverà una notifica per accettarla: finché non risponde l’orario resta occupato.`
                        : 'La seduta entra subito in calendario come confermata. Anche fuori dai tuoi orari.'}
                </p>
            </div>

            <DialogFooter className="gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={onCancel}
                >
                    Annulla
                </Button>
                <Button
                    type="button"
                    disabled={processing}
                    className="h-11 rounded-xl px-4.5 font-semibold"
                    onClick={save}
                >
                    {processing && <Spinner />}
                    {chosen?.registered ? 'Invia proposta' : 'Aggiungi seduta'}
                </Button>
            </DialogFooter>
        </>
    );
}

/**
 * "Invita Marco su Miopersonal": after a session with someone without an
 * account. "Non chiedermelo più" stops it for this person.
 */
function InviteStep({
    invite,
    onDone,
}: {
    invite: InvitePrompt;
    onDone: () => void;
}) {
    const [copied, copy] = useClipboard();
    const [dontAsk, setDontAsk] = useState(false);
    const checkboxId = useId();
    const firstName = invite.name.split(' ')[0];
    const message = `Ciao ${firstName}! Ho messo in calendario le nostre sedute su Miopersonal: iscriviti da qui per vederle, ricevere i promemoria e prenotare da solo/a. ${invite.link}`;

    const done = () => {
        if (dontAsk) {
            router.post(
                dismiss.url(invite.recordId),
                {},
                { preserveScroll: true },
            );
        }

        onDone();
    };

    return (
        <>
            <DialogHeader>
                <span
                    aria-hidden="true"
                    className="mb-1 flex size-10 items-center justify-center rounded-full bg-foreground text-background"
                >
                    <Check className="size-5" strokeWidth={3} />
                </span>
                <DialogTitle>Seduta aggiunta</DialogTitle>
                <DialogDescription>
                    Invita {firstName} su Miopersonal: vedrà le sedute in
                    calendario, riceverà i promemoria e potrà prenotare da solo.
                    Quando si iscrive con il suo link, le sedute diventano sue.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
                <Button asChild className="h-11 rounded-xl font-semibold">
                    <a
                        href={whatsAppUrl(invite.phone ?? '', message)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <MessageCircle />
                        Invia su WhatsApp
                    </a>
                </Button>
                {invite.email && (
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 rounded-xl"
                    >
                        <a
                            href={`mailto:${invite.email}?subject=${encodeURIComponent('Le nostre sedute su Miopersonal')}&body=${encodeURIComponent(message)}`}
                        >
                            <Mail />
                            Invia per email
                        </a>
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={async () => {
                        if (await copy(invite.link)) {
                            toast.success('Link copiato');
                        }
                    }}
                >
                    {copied === invite.link ? <Check /> : <Copy />}
                    {copied === invite.link ? 'Copiato' : 'Copia link'}
                </Button>
            </div>

            <div className="flex items-center gap-2.5">
                <Checkbox
                    id={checkboxId}
                    checked={dontAsk}
                    onCheckedChange={(value) => setDontAsk(value === true)}
                />
                <label htmlFor={checkboxId} className="text-sm">
                    Non chiedermelo più per {firstName}
                </label>
            </div>

            <DialogFooter>
                <Button
                    type="button"
                    variant="ghost"
                    className="h-11 rounded-xl"
                    onClick={done}
                >
                    {dontAsk ? 'Chiudi' : 'Più tardi'}
                </Button>
            </DialogFooter>
        </>
    );
}
