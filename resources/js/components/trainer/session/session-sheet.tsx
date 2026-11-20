import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, Mail, NotebookPen, Phone, X } from 'lucide-react';
import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import {
    DayPicker,
    FormErrors,
    GroupTitle,
    RowSeparator,
    SessionRows,
    TimeWheels,
    glassFieldClassName,
    glassPanelClassName,
    glassRoundClassName,
    shortDate,
} from '@/components/trainer/session/session-fields';
import type { SessionForm } from '@/components/trainer/session/use-session-form';
import { cn } from '@/lib/utils';

const inputRowClassName =
    'h-13 min-w-0 flex-1 border-0 bg-transparent p-0 text-[17px] tracking-[-0.43px] text-foreground outline-none placeholder:text-muted-foreground';

/**
 * "Aggiungi seduta" on phones (design "A · Vetro"): a glass sheet over the
 * calendar. The name searches the clients as it is written; a name not in
 * the list is a new client, with phone and email. The pill of the day
 * opens the month and the wheels of the time.
 */
export default function SessionSheet({
    open,
    onOpenChange,
    form,
    today,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: SessionForm;
    today: string;
    onSave: () => void;
}) {
    const [picking, setPicking] = useState(false);
    const typed = form.query.trim() !== '';

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="theme-dark fixed inset-0 z-50 bg-black/50! data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    className={cn(
                        'theme-dark fixed inset-x-0 top-4 bottom-0 z-50 flex flex-col gap-6 overflow-y-auto overscroll-contain rounded-t-[38px] border-b-0 px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] text-foreground outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
                        glassPanelClassName,
                        'bg-[linear-gradient(170deg,rgba(36,36,36,0.62)_0%,rgba(20,20,20,0.72)_100%)]',
                    )}
                >
                    <DialogPrimitive.Title className="sr-only">
                        Nuova seduta
                    </DialogPrimitive.Title>

                    <div className="flex items-center justify-between gap-2.5">
                        <DialogPrimitive.Close
                            aria-label="Chiudi"
                            className={cn(
                                glassRoundClassName,
                                'bg-[#1c1c1cb8]',
                            )}
                        >
                            <X aria-hidden="true" className="size-5" />
                        </DialogPrimitive.Close>
                        <button
                            type="button"
                            disabled={form.processing}
                            onClick={onSave}
                            aria-label={
                                form.proposal
                                    ? 'Invia proposta'
                                    : 'Aggiungi seduta'
                            }
                            className="inline-flex size-11 items-center justify-center rounded-full bg-brand text-[#0a0a0a] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_8px_24px_0_rgba(66,215,217,0.28)] outline-none hover:bg-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
                        >
                            {form.processing ? (
                                <Spinner />
                            ) : (
                                <Check
                                    aria-hidden="true"
                                    className="size-5.5"
                                    strokeWidth={2.4}
                                />
                            )}
                        </button>
                    </div>

                    <div className="flex gap-2.5">
                        <span
                            aria-hidden="true"
                            className="w-1 shrink-0 rounded-full bg-brand shadow-[0_0_12px_0_rgba(66,215,217,0.45)]"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                            <label htmlFor="session-name" className="sr-only">
                                Nome e cognome
                            </label>
                            <input
                                id="session-name"
                                type="text"
                                autoComplete="off"
                                maxLength={100}
                                placeholder="Nome e cognome"
                                value={form.query}
                                onChange={(event) =>
                                    form.setQuery(event.target.value)
                                }
                                aria-invalid={!!form.clientError}
                                aria-describedby={
                                    form.clientError
                                        ? 'session-name-error'
                                        : undefined
                                }
                                className={cn(
                                    'h-14 w-full rounded-full px-5.5 text-[22px] font-bold tracking-[-0.26px] text-foreground outline-none placeholder:font-bold placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive',
                                    glassFieldClassName,
                                )}
                            />
                            {form.matches.length > 0 && (
                                <ul
                                    aria-label="Clienti trovati"
                                    className={cn(
                                        'overflow-hidden rounded-[26px] p-1',
                                        glassFieldClassName,
                                    )}
                                >
                                    {form.matches.map((client) => (
                                        <li key={client.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    form.pick(client.id)
                                                }
                                                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[22px] px-4 text-left text-[17px] outline-none hover:bg-white/[0.06] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            >
                                                <span className="truncate">
                                                    {client.name}
                                                </span>
                                                <span className="shrink-0 text-[13px] text-muted-foreground">
                                                    {client.registered
                                                        ? 'Su MioPersonal'
                                                        : 'Nella rubrica'}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {form.clientError && (
                                <p
                                    id="session-name-error"
                                    className="pl-5 text-[13px] text-destructive"
                                >
                                    {form.clientError}
                                </p>
                            )}
                            <button
                                type="button"
                                aria-expanded={picking}
                                onClick={() => setPicking(!picking)}
                                aria-invalid={!!form.whenError}
                                className={cn(
                                    'flex h-14 w-full items-center justify-between gap-3 rounded-full px-5.5 text-[17px] tracking-[-0.43px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                    glassFieldClassName,
                                    picking && 'border-brand',
                                )}
                            >
                                <span>{shortDate(form.date)}</span>
                                <span className="tabular-nums">
                                    {form.time} – {form.end}
                                </span>
                            </button>
                            {form.whenError && (
                                <p className="pl-5 text-[13px] text-destructive">
                                    {form.whenError}
                                </p>
                            )}
                        </div>
                    </div>

                    {picking && (
                        <section
                            aria-label="Giorno e ora"
                            className={cn(
                                'flex flex-col gap-5 rounded-[26px] p-3.5',
                                glassFieldClassName,
                            )}
                        >
                            <DayPicker
                                value={form.date}
                                today={today}
                                onChange={form.setDate}
                            />
                            <TimeWheels form={form} />
                            <button
                                type="button"
                                onClick={() => setPicking(false)}
                                className="h-11 rounded-full bg-white/[0.08] text-[15px] font-semibold outline-none hover:bg-white/[0.14] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                Fatto
                            </button>
                        </section>
                    )}

                    {form.isNew && typed && (
                        <section className="flex flex-col gap-2">
                            <GroupTitle>Contatti</GroupTitle>
                            <div
                                className={cn(
                                    'overflow-hidden rounded-[26px]',
                                    glassFieldClassName,
                                )}
                            >
                                <div className="flex items-center gap-3 px-4">
                                    <Phone
                                        aria-hidden="true"
                                        className="size-5 shrink-0 text-muted-foreground"
                                    />
                                    <label
                                        htmlFor="session-phone"
                                        className="sr-only"
                                    >
                                        Telefono
                                    </label>
                                    <input
                                        id="session-phone"
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="off"
                                        placeholder="Telefono"
                                        value={form.phone}
                                        onChange={(event) =>
                                            form.setPhone(event.target.value)
                                        }
                                        className={inputRowClassName}
                                    />
                                </div>
                                <RowSeparator />
                                <div className="flex items-center gap-3 px-4">
                                    <Mail
                                        aria-hidden="true"
                                        className="size-5 shrink-0 text-muted-foreground"
                                    />
                                    <label
                                        htmlFor="session-email"
                                        className="sr-only"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="session-email"
                                        type="email"
                                        inputMode="email"
                                        autoComplete="off"
                                        placeholder="Email"
                                        value={form.email}
                                        onChange={(event) =>
                                            form.setEmail(event.target.value)
                                        }
                                        className={inputRowClassName}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="flex flex-col gap-2">
                        <GroupTitle>Seduta</GroupTitle>
                        <SessionRows form={form} withPrice />
                    </section>

                    <section className="flex flex-col gap-2">
                        <GroupTitle>Dettagli</GroupTitle>
                        <div
                            className={cn(
                                'flex min-h-13 items-start gap-3 rounded-[26px] px-4 py-3.5',
                                glassFieldClassName,
                            )}
                        >
                            <NotebookPen
                                aria-hidden="true"
                                className="mt-px size-5 shrink-0 text-muted-foreground"
                            />
                            <label htmlFor="session-note" className="sr-only">
                                Note
                            </label>
                            <textarea
                                id="session-note"
                                rows={1}
                                maxLength={1000}
                                placeholder="Note per la seduta"
                                value={form.note}
                                onChange={(event) =>
                                    form.setNote(event.target.value)
                                }
                                className="field-sizing-content min-h-5.5 flex-1 resize-none border-0 bg-transparent p-0 text-[17px] leading-5.5 tracking-[-0.43px] outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                    </section>

                    <FormErrors messages={form.otherErrors} />

                    <p className="px-4 text-[13px] leading-4.5 text-muted-foreground">
                        {form.proposal
                            ? `${form.chosen?.name.split(' ')[0]} riceverà una notifica per accettarla: finché non risponde l’orario resta occupato.`
                            : 'La seduta entra subito in calendario come confermata. Anche fuori dai tuoi orari.'}
                    </p>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
