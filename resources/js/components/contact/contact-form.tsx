import { Form, Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import FormField from '@/components/auth/form-field';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import type { ChoiceOption } from '@/components/shared/choice-chips';
import ChoiceChips from '@/components/shared/choice-chips';
import SegmentedControl from '@/components/shared/segmented-control';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { store } from '@/routes/contact';
import { privacy } from '@/routes/legal';

/** A hint for the message, depending on the chosen topic. */
const placeholders: Record<string, string> = {
    booking: 'Indica trainer, giorno e orario della prenotazione…',
    privacy:
        'Dicci cosa vuoi fare: vedere, correggere o cancellare i tuoi dati…',
    profile: 'Cosa vuoi cambiare o cosa non funziona?',
    verification:
        'Da quanto hai inviato il profilo? Ti serve aiuto con un documento?',
};

const inputClass = 'h-11 text-base md:text-base';

type ContactFormProps = {
    /** True right after a message was sent: shows "Messaggio inviato". */
    sent: boolean;
    roles: ChoiceOption<string>[];
    /** role => the topics offered to that role. */
    topics: Record<string, ChoiceOption<string>[]>;
    messageMaxLength: number;
};

/** "Scrivici un messaggio": sends an email to the team and a copy to the sender. */
export default function ContactForm({
    sent,
    roles,
    topics,
    messageMaxLength,
}: ContactFormProps) {
    const titleId = useId();
    const topicLabelId = useId();
    const [role, setRole] = useState(roles[0].value);
    const [topic, setTopic] = useState(topics[role][0].value);
    // "Scrivi un altro messaggio" goes back to an empty form.
    const [writingAnother, setWritingAnother] = useState(false);

    const changeRole = (value: string) => {
        setRole(value);

        // Keep the topic when the new role has it too (e.g. "Privacy e dati").
        if (!topics[value].some((option) => option.value === topic)) {
            setTopic(topics[value][0].value);
        }
    };

    if (sent && !writingAnother) {
        return (
            <section
                aria-label="Messaggio inviato"
                className="rounded-[18px] border bg-card p-4.5 md:p-7"
            >
                <div
                    role="status"
                    className="flex flex-col items-center gap-2.5 px-2 py-8 text-center"
                >
                    <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check aria-hidden="true" className="size-6" />
                    </span>
                    <strong className="text-xl">Messaggio inviato</strong>
                    <span className="max-w-90 text-sm text-muted-foreground">
                        Grazie! Ti abbiamo mandato una copia via email e ti
                        rispondiamo appena possibile.
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={() => setWritingAnother(true)}
                    >
                        Scrivi un altro messaggio
                    </Button>
                </div>
            </section>
        );
    }

    return (
        <Form
            {...store.form()}
            disableWhileProcessing
            resetOnSuccess
            onSuccess={() => setWritingAnother(false)}
            aria-labelledby={titleId}
            className="flex flex-col gap-4.5 rounded-[18px] border bg-card p-4.5 md:p-7"
        >
            {({ processing, errors }) => (
                <>
                    <h2
                        id={titleId}
                        className="text-xl font-semibold tracking-tight"
                    >
                        Scrivici un messaggio
                    </h2>

                    <fieldset className="flex flex-col gap-2">
                        <legend className="pb-2 text-sm font-medium">
                            Sei
                        </legend>
                        <SegmentedControl
                            options={roles}
                            value={role}
                            onChange={changeRole}
                        />
                        <input type="hidden" name="role" value={role} />
                        {errors.role && (
                            <p className="text-sm text-destructive">
                                {errors.role}
                            </p>
                        )}
                    </fieldset>

                    <div className="grid gap-3.5 sm:grid-cols-2">
                        <FormField label="Nome" error={errors.name}>
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    aria-describedby={describedBy}
                                    aria-invalid={!!errors.name}
                                    className={inputClass}
                                />
                            )}
                        </FormField>
                        <FormField label="Email" error={errors.email}>
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    type="email"
                                    name="email"
                                    required
                                    autoComplete="email"
                                    placeholder="nome@esempio.it"
                                    aria-describedby={describedBy}
                                    aria-invalid={!!errors.email}
                                    className={inputClass}
                                />
                            )}
                        </FormField>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span
                            id={topicLabelId}
                            className="pb-2 text-sm font-medium"
                        >
                            Argomento
                        </span>
                        <ChoiceChips
                            options={topics[role]}
                            value={topic}
                            onChange={setTopic}
                            aria-labelledby={topicLabelId}
                        />
                        <input type="hidden" name="topic" value={topic} />
                        {errors.topic && (
                            <p className="text-sm text-destructive">
                                {errors.topic}
                            </p>
                        )}
                    </div>

                    <FormField
                        label="Messaggio"
                        hint="Non inserire dati sulla salute o di pagamento."
                        error={errors.message}
                    >
                        {({ id, describedBy }) => (
                            <Textarea
                                id={id}
                                name="message"
                                required
                                rows={6}
                                maxLength={messageMaxLength}
                                placeholder={
                                    placeholders[topic] ??
                                    'Scrivi qui il tuo messaggio…'
                                }
                                aria-describedby={describedBy}
                                aria-invalid={!!errors.message}
                                className="min-h-36 resize-y text-base md:text-base"
                            />
                        )}
                    </FormField>

                    <ConsentCheckbox
                        name="privacy"
                        required
                        error={errors.privacy}
                    >
                        Ho letto la{' '}
                        <Link href={privacy()} className="underline">
                            privacy policy
                        </Link>{' '}
                        e acconsento a essere ricontattato via email.
                    </ConsentCheckbox>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-12 rounded-[10px] text-base font-semibold"
                    >
                        {processing && <Spinner />}
                        Invia messaggio
                    </Button>
                </>
            )}
        </Form>
    );
}
