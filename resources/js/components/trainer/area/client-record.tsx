import { router } from '@inertiajs/react';
import { Check, Copy, MessageCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import TrainerClientRecordsController from '@/actions/App/Http/Controllers/TrainerClientRecordsController';
import FormField from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDateMedium, formatPrice } from '@/lib/format';
import { whatsAppUrl } from '@/lib/whatsapp';
import type { TrainerClient } from '@/types';

const NOTES_MAX = 2000;

type Errors = Partial<Record<string, string>>;

/** Today as Y-m-d on the trainer's device. */
function today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * "Scheda del cliente" in the card of "Clienti": what only the trainer sees.
 * Goal and private notes, the contacts of who has no account yet, the
 * personal link to send, and the payments noted by hand (a register: no
 * money goes through the site).
 */
export default function ClientRecord({ client }: { client: TrainerClient }) {
    return (
        <section
            aria-label="Scheda del cliente"
            className="flex flex-col gap-4"
        >
            <h3 className="text-[15px] leading-5.5 font-semibold">
                Scheda del cliente
            </h3>
            <p className="-mt-2.5 text-[13px] leading-4.5 text-muted-foreground">
                Solo tu la vedi: il cliente non riceve mai queste note.
            </p>

            {client.inviteLink && <PersonalLink client={client} />}
            <NotesForm client={client} />
            <Payments client={client} />
            {!client.registered && <RemoveClient client={client} />}
        </section>
    );
}

function NotesForm({ client }: { client: TrainerClient }) {
    const [goal, setGoal] = useState(client.goal ?? '');
    const [notes, setNotes] = useState(client.notes ?? '');
    const [name, setName] = useState(client.name);
    const [email, setEmail] = useState(client.contacts.email);
    const [phone, setPhone] = useState(client.contacts.phone ?? '');
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    const dirty =
        goal !== (client.goal ?? '') ||
        notes !== (client.notes ?? '') ||
        (!client.registered &&
            (name !== client.name ||
                email !== client.contacts.email ||
                phone !== (client.contacts.phone ?? '')));

    const save = () =>
        router.patch(
            TrainerClientRecordsController.update.url(client.recordId),
            {
                goal,
                notes,
                ...(client.registered ? {} : { name, email, phone }),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setErrors({}),
                onError: setErrors,
            },
        );

    return (
        <div className="flex flex-col gap-3">
            {!client.registered && (
                <>
                    <FormField label="Nome" error={errors.name}>
                        {({ id, describedBy }) => (
                            <Input
                                id={id}
                                value={name}
                                maxLength={100}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                aria-describedby={describedBy}
                                aria-invalid={!!errors.name}
                                className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                            />
                        )}
                    </FormField>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField label="Email" error={errors.email}>
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    aria-describedby={describedBy}
                                    aria-invalid={!!errors.email}
                                    className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                                />
                            )}
                        </FormField>
                        <FormField label="Telefono" error={errors.phone}>
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    type="tel"
                                    value={phone}
                                    onChange={(event) =>
                                        setPhone(event.target.value)
                                    }
                                    aria-describedby={describedBy}
                                    aria-invalid={!!errors.phone}
                                    className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                                />
                            )}
                        </FormField>
                    </div>
                </>
            )}
            <FormField label="Obiettivo" error={errors.goal}>
                {({ id, describedBy }) => (
                    <Input
                        id={id}
                        value={goal}
                        maxLength={200}
                        placeholder="Es. Prepararsi alla mezza maratona di aprile"
                        onChange={(event) => setGoal(event.target.value)}
                        aria-describedby={describedBy}
                        aria-invalid={!!errors.goal}
                        className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                    />
                )}
            </FormField>
            <FormField
                label="Note private"
                error={errors.notes}
                counter={{ length: notes.length, max: NOTES_MAX }}
            >
                {({ id, describedBy }) => (
                    <Textarea
                        id={id}
                        rows={4}
                        maxLength={NOTES_MAX}
                        placeholder="Infortuni, preferenze, cosa avete fatto l’ultima volta…"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        aria-describedby={describedBy}
                        aria-invalid={!!errors.notes}
                        className="rounded-xl px-3.5 py-3 text-[15px] leading-5.5 md:text-[15px]"
                    />
                )}
            </FormField>
            <div className="flex justify-end">
                <Button
                    type="button"
                    disabled={!dirty || processing}
                    onClick={save}
                    className="h-11 rounded-xl px-4.5 font-semibold"
                >
                    Salva scheda
                </Button>
            </div>
        </div>
    );
}

/** The link that brings this person in, linked to the notes already written. */
function PersonalLink({ client }: { client: TrainerClient }) {
    const [copied, copy] = useClipboard();
    const link = client.inviteLink ?? '';
    const firstName = client.name.split(' ')[0];
    const message = `Ciao ${firstName}! Da ora puoi prenotare le nostre sedute qui, vedi subito gli orari liberi: ${link}`;

    return (
        <div className="flex flex-col gap-2.5 rounded-[14px] border bg-secondary/50 p-3.5">
            <span className="text-sm font-semibold">Il suo link personale</span>
            <span className="text-[13px] leading-4.5 text-muted-foreground">
                Quando si iscrive da qui lo riconosciamo: ritrova la sua scheda
                e le tue note.
            </span>
            <div className="flex flex-wrap gap-2">
                <Button asChild className="h-10 font-semibold">
                    <a
                        href={whatsAppUrl(client.contacts.phone ?? '', message)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <MessageCircle />
                        Invia su WhatsApp
                    </a>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={async () => {
                        if (await copy(link)) {
                            toast.success('Link copiato');
                        }
                    }}
                >
                    {copied === link ? <Check /> : <Copy />}
                    {copied === link ? 'Copiato' : 'Copia link'}
                </Button>
            </div>
        </div>
    );
}

function Payments({ client }: { client: TrainerClient }) {
    const [amount, setAmount] = useState('');
    const [paidOn, setPaidOn] = useState(today);
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    const add = () =>
        router.post(
            TrainerClientRecordsController.storePayment.url(client.recordId),
            { amount, paid_on: paidOn, note },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setAmount('');
                    setNote('');
                    setErrors({});
                },
                onError: setErrors,
            },
        );

    const remove = (payment: number) =>
        router.delete(
            TrainerClientRecordsController.destroyPayment.url({
                client: client.recordId,
                payment,
            }),
            { preserveScroll: true, preserveState: true },
        );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold">Incassi</h4>
                <span className="text-sm font-bold tabular-nums">
                    {formatPrice(client.paidCents)}
                </span>
            </div>

            {client.payments.length > 0 && (
                <ul className="flex flex-col overflow-hidden rounded-[14px] border">
                    {client.payments.map((payment) => (
                        <li
                            key={payment.id}
                            className="flex items-center gap-3 border-t py-2.5 pr-2 pl-3.5 first:border-t-0"
                        >
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-sm font-semibold tabular-nums">
                                    {formatPrice(payment.amountCents)}
                                </span>
                                <span className="truncate text-[13px] leading-4.5 text-muted-foreground">
                                    {formatDateMedium(payment.paidOn)}
                                    {payment.note && ` · ${payment.note}`}
                                </span>
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Elimina l’incasso di ${formatPrice(payment.amountCents)}`}
                                onClick={() => remove(payment.id)}
                            >
                                <Trash2 />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                <FormField label="Importo (€)" error={errors.amount}>
                    {({ id, describedBy }) => (
                        <Input
                            id={id}
                            inputMode="decimal"
                            placeholder="45"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            aria-describedby={describedBy}
                            aria-invalid={!!errors.amount}
                            className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                        />
                    )}
                </FormField>
                <FormField label="Giorno" error={errors.paid_on}>
                    {({ id, describedBy }) => (
                        <Input
                            id={id}
                            type="date"
                            max={today()}
                            value={paidOn}
                            onChange={(event) => setPaidOn(event.target.value)}
                            aria-describedby={describedBy}
                            aria-invalid={!!errors.paid_on}
                            className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                        />
                    )}
                </FormField>
            </div>
            <FormField label="Nota · facoltativa" error={errors.note}>
                {({ id, describedBy }) => (
                    <Input
                        id={id}
                        value={note}
                        maxLength={200}
                        placeholder="Es. Pacchetto da 10, contanti"
                        onChange={(event) => setNote(event.target.value)}
                        aria-describedby={describedBy}
                        aria-invalid={!!errors.note}
                        className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                    />
                )}
            </FormField>
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    disabled={amount.trim() === '' || processing}
                    onClick={add}
                    className="h-11 rounded-xl px-4.5 font-semibold"
                >
                    Segna incasso
                </Button>
            </div>
        </div>
    );
}

/** Only who never signed up: an account in the list has sessions and stays. */
function RemoveClient({ client }: { client: TrainerClient }) {
    const [confirming, setConfirming] = useState(false);

    if (!confirming) {
        return (
            <Button
                type="button"
                variant="ghost"
                className="self-start text-muted-foreground"
                onClick={() => setConfirming(true)}
            >
                <Trash2 />
                Rimuovi dalla lista
            </Button>
        );
    }

    return (
        <div
            role="alertdialog"
            aria-label="Rimuovere il cliente?"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3.5"
        >
            <span className="text-sm font-semibold">
                Rimuovere {client.name}? Note e incassi vanno persi.
            </span>
            <span className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirming(false)}
                >
                    Annulla
                </Button>
                <Button
                    type="button"
                    onClick={() =>
                        router.delete(
                            TrainerClientRecordsController.destroy.url(
                                client.recordId,
                            ),
                            { preserveScroll: true },
                        )
                    }
                >
                    Rimuovi
                </Button>
            </span>
        </div>
    );
}
