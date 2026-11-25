import { Form, Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import FormField from '@/components/auth/form-field';
import {
    brandFilledClassName,
    brandOutlineClassName,
    darkCardClassName,
    sectionTitleClassName,
} from '@/components/mp/page-bits';
import SegmentedControl from '@/components/mp/segmented-control';
import type { ChoiceOption } from '@/components/shared/choice-chips';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { darkCheckboxClassName, darkFieldClassName } from '@/lib/dark-form';
import { cn } from '@/lib/utils';
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

const labelClassName = 'text-[15px] leading-5 font-semibold';

type ContactFormProps = {
    /** True right after a message was sent: shows "Messaggio inviato". */
    sent: boolean;
    roles: ChoiceOption<string>[];
    /** role => the topics offered to that role. */
    topics: Record<string, ChoiceOption<string>[]>;
    messageMaxLength: number;
    className?: string;
};

/** "Scrivici un messaggio": sends an email to the team and a confirmation to the sender. */
export default function ContactForm({
    sent,
    roles,
    topics,
    messageMaxLength,
    className,
}: ContactFormProps) {
    const titleId = useId();
    const roleLabelId = useId();
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
                className={cn(darkCardClassName, 'p-5 md:p-8', className)}
            >
                <div
                    role="status"
                    className="flex flex-col items-center gap-3 px-2 py-8 text-center"
                >
                    <span className="flex size-14 items-center justify-center rounded-full border-[1.5px] border-brand text-brand">
                        <Check aria-hidden="true" className="size-7" />
                    </span>
                    <strong className="text-[22px] leading-7">
                        Messaggio inviato
                    </strong>
                    <span className="max-w-90 text-[15px] leading-5.25 text-muted-foreground">
                        Grazie! Ti abbiamo mandato una conferma via email e ti
                        rispondiamo appena possibile.
                    </span>
                    <button
                        type="button"
                        className={cn(brandOutlineClassName, 'mt-2 h-11')}
                        onClick={() => setWritingAnother(true)}
                    >
                        Scrivi un altro messaggio
                    </button>
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
            className={cn('flex flex-col gap-5 md:gap-6', className)}
        >
            {({ processing, errors }) => (
                <>
                    <h2 id={titleId} className={sectionTitleClassName}>
                        Scrivici un messaggio
                    </h2>

                    <div className="flex flex-col gap-2">
                        <span id={roleLabelId} className={labelClassName}>
                            Sei
                        </span>
                        <SegmentedControl
                            label="Sei"
                            tone="brand"
                            options={roles}
                            value={role}
                            onValueChange={changeRole}
                        />
                        <input type="hidden" name="role" value={role} />
                        {/* Honeypot: hidden from people, filled in by spam bots. */}
                        <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            aria-hidden="true"
                            className="absolute -left-[9999px] size-px opacity-0"
                        />
                        {errors.role && (
                            <p className="text-[13px] text-destructive">
                                {errors.role}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-5 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] md:gap-x-4 md:gap-y-6">
                        <FormField
                            label="Nome"
                            error={errors.name}
                            labelClassName={labelClassName}
                        >
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    aria-describedby={describedBy}
                                    aria-invalid={!!errors.name}
                                    className={darkFieldClassName}
                                />
                            )}
                        </FormField>
                        <FormField
                            label="Email"
                            error={errors.email}
                            labelClassName={labelClassName}
                        >
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    type="email"
                                    name="email"
                                    required
                                    inputMode="email"
                                    autoComplete="email"
                                    placeholder="nome@esempio.it"
                                    aria-describedby={describedBy}
                                    aria-invalid={!!errors.email}
                                    className={darkFieldClassName}
                                />
                            )}
                        </FormField>
                    </div>

                    <div
                        role="group"
                        aria-labelledby={topicLabelId}
                        className="flex flex-col gap-2"
                    >
                        <span id={topicLabelId} className={labelClassName}>
                            Argomento
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {topics[role].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={option.value === topic}
                                    onClick={() => setTopic(option.value)}
                                    className="chip h-11"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <input type="hidden" name="topic" value={topic} />
                        {errors.topic && (
                            <p className="text-[13px] text-destructive">
                                {errors.topic}
                            </p>
                        )}
                    </div>

                    <FormField
                        label="Messaggio"
                        error={errors.message}
                        labelClassName={labelClassName}
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
                                className="min-h-36 resize-y rounded-[14px] border-input bg-card px-4 py-3.5 text-[17px] leading-5.5 md:min-h-42 md:text-[17px]"
                            />
                        )}
                    </FormField>

                    <div className="text-[15px] leading-5.25 [&_label]:text-[15px]">
                        <ConsentCheckbox
                            name="privacy"
                            required
                            error={errors.privacy}
                            checkboxClassName={darkCheckboxClassName}
                        >
                            Ho letto la{' '}
                            <Link
                                href={privacy()}
                                className="text-brand underline"
                            >
                                privacy policy
                            </Link>{' '}
                            e acconsento a essere ricontattato via email.
                        </ConsentCheckbox>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className={cn(
                            brandFilledClassName,
                            'gap-2 md:self-start md:px-10',
                        )}
                    >
                        {processing && <Spinner />}
                        Invia messaggio
                    </button>
                </>
            )}
        </Form>
    );
}
