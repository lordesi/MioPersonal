import { Check, Globe, Instagram, Mail, Phone } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import type { GymDraft } from '@/components/onboarding/gym/draft';
import {
    Field,
    pillBoxClassName,
    pillInnerClassName,
    Section,
} from '@/components/onboarding/dark-fields';
import { gymSteps } from '@/components/onboarding/gym/draft';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type StepSendProps = {
    draft: GymDraft;
    update: (changes: Partial<GymDraft>) => void;
    errors: Partial<Record<string, string>>;
    /** The steps to check, e.g. [1, 2, 3, 4] or [2, 3, 4] when fixing the profile. */
    steps: number[];
    /** Is the step filled in (the same check of "Continua")? */
    complete: (step: number) => boolean;
    onEdit: (step: number) => void;
};

/** Step 5, "Contatti e invio": the public contacts and a look back at the steps. */
export default function StepSend({
    draft,
    update,
    errors,
    steps,
    complete,
    onEdit,
}: StepSendProps) {
    return (
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-14">
            <Section
                title="Contatti pubblici"
                description={
                    <>
                        <span className="md:hidden">
                            Compaiono nel profilo. Tutti facoltativi: puoi
                            saltarli.
                        </span>
                        <span className="hidden md:inline">
                            Compaiono nel profilo della palestra. Tutti
                            facoltativi.
                        </span>
                    </>
                }
            >
                <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-x-3 md:gap-y-4">
                    <ContactField
                        label="Telefono"
                        icon={<Phone />}
                        example="02 1234567"
                        error={errors.contact_phone}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={draft.contactPhone}
                        onChange={(event) =>
                            update({ contactPhone: event.target.value })
                        }
                    />
                    <ContactField
                        label="Email"
                        icon={<Mail />}
                        example="info@fitlab.it"
                        error={errors.contact_email}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={draft.contactEmail}
                        onChange={(event) =>
                            update({ contactEmail: event.target.value })
                        }
                    />
                    <ContactField
                        label="Sito web"
                        shortLabel="Sito"
                        icon={<Globe />}
                        example="www.fitlab.it"
                        error={errors.website}
                        inputMode="url"
                        autoComplete="url"
                        autoCapitalize="none"
                        value={draft.website}
                        onChange={(event) =>
                            update({ website: event.target.value })
                        }
                    />
                    <ContactField
                        label="Instagram"
                        icon={<Instagram />}
                        example="@fitlab.milano"
                        error={errors.instagram}
                        autoComplete="off"
                        autoCapitalize="none"
                        value={draft.instagram}
                        onChange={(event) =>
                            update({ instagram: event.target.value })
                        }
                    />
                </div>
            </Section>

            <Section
                title="Controlla prima di inviare"
                className="gap-3 md:gap-1"
            >
                <ul className="overflow-hidden rounded-[26px] bg-card md:rounded-none md:bg-transparent">
                    {steps.map((step, index) => {
                        const done = complete(step);

                        return (
                            <li
                                key={step}
                                className={cn(
                                    index > 0 &&
                                        'border-t border-separator md:border-border',
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => onEdit(step)}
                                    className="flex min-h-14 w-full items-center gap-3 px-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset md:min-h-15 md:px-0"
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'flex size-7 shrink-0 items-center justify-center rounded-full border',
                                            done
                                                ? 'border-brand text-brand'
                                                : 'border-dashed border-field text-transparent',
                                        )}
                                    >
                                        <Check
                                            strokeWidth={3}
                                            className="size-3.5"
                                        />
                                    </span>
                                    <span className="flex flex-1 flex-col text-[17px] md:text-[15px] md:font-semibold">
                                        {gymSteps[step - 1]}
                                        {!done && (
                                            <span className="text-[13px] font-normal text-destructive">
                                                Da completare
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-[15px] font-semibold text-brand">
                                        Modifica
                                        <span className="sr-only">
                                            {' '}
                                            {gymSteps[step - 1]}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <p className="text-[13px] leading-4.5 text-muted-foreground md:mt-3">
                    Con “Invia per approvazione” il nostro team controlla il
                    profilo. Dopo l’approvazione la palestra compare nella
                    ricerca e puoi aggiungere abbonamenti, promozioni e i tuoi
                    trainer.
                </p>
            </Section>
        </div>
    );
}

/**
 * A public contact: on phones the label is said inside the field
 * ("Telefono · 02 1234567"), on desktop it sits above.
 */
function ContactField({
    label,
    shortLabel,
    icon,
    example,
    error,
    ...props
}: {
    label: string;
    /** In the example on phones, e.g. "Sito" for "Sito web". */
    shortLabel?: string;
    icon: ReactNode;
    example: string;
    error?: string;
} & Omit<ComponentProps<'input'>, 'className' | 'placeholder'>) {
    const isMobile = useIsMobile();

    return (
        <Field
            label={label}
            error={error}
            labelClassName="sr-only md:not-sr-only"
        >
            {({ id, describedBy }) => (
                <div className={pillBoxClassName}>
                    <span
                        aria-hidden="true"
                        className="flex shrink-0 [&_svg]:size-5"
                    >
                        {icon}
                    </span>
                    <input
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={!!error}
                        placeholder={
                            isMobile
                                ? `${shortLabel ?? label} · ${example}`
                                : example
                        }
                        className={pillInnerClassName}
                        {...props}
                    />
                </div>
            )}
        </Field>
    );
}
