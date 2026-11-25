import { ArrowRight, Info, KeyRound, PanelLeft } from 'lucide-react';
import type { ComponentProps } from 'react';
import StepAccountFields, {
    TermsCard,
} from '@/components/onboarding/account-step';
import type { AccountStepCopy } from '@/components/onboarding/account-step';
import { Section } from '@/components/onboarding/dark-fields';
import { useInitials } from '@/hooks/use-initials';

/** The words of "Diventa trainer" (design "1 · Account"). */
export const trainerAccountCopy: AccountStepCopy = {
    whoTitle: 'Chi sei',
    terms: {
        before: 'Accetto i ',
        terms: 'Termini per i trainer',
        middle: ' e l’',
        privacy: 'Informativa privacy',
    },
    usernameLater: true,
};

type StepAccountProps = {
    /** A logged-in client keeps the account; null for a guest, who creates one. */
    account: { name: string; email: string } | null;
    /** The account fields of a guest. */
    fields: Omit<ComponentProps<typeof StepAccountFields>, 'copy'>;
};

/** What changes when a client becomes a trainer. */
const changes = [
    {
        icon: KeyRound,
        title: 'Stesse credenziali',
        text: 'Accedi con la stessa email e la stessa password.',
    },
    {
        icon: PanelLeft,
        title: 'La tua area trainer',
        text: 'Richieste, calendario, clienti e prezzi in un unico posto.',
    },
    {
        icon: Info,
        title: 'Addio pagine cliente',
        text: 'Alcune funzionalità non saranno più disponibili.',
    },
];

/**
 * Step 1: a guest creates the account (the same fields of the gym
 * sign-up); a logged-in client keeps theirs and only accepts the terms.
 */
export default function StepAccount({ account, fields }: StepAccountProps) {
    if (!account) {
        return <StepAccountFields {...fields} copy={trainerAccountCopy} />;
    }

    return (
        <div className="flex flex-col gap-8">
            <Section
                title="Il tuo account"
                description="Diventa un account trainer: non ne serve uno nuovo."
            >
                <CurrentAccount {...account} />
                <ul className="flex flex-col gap-2">
                    {changes.map((item) => (
                        <li
                            key={item.title}
                            className="flex items-start gap-3 rounded-[20px] bg-card p-4"
                        >
                            <item.icon
                                aria-hidden="true"
                                className="mt-0.5 size-5 shrink-0 text-brand"
                            />
                            <span className="flex flex-col gap-0.5">
                                <span className="text-[15px] leading-5 font-semibold">
                                    {item.title}
                                </span>
                                <span className="text-[13px] leading-4.5 text-muted-foreground">
                                    {item.text}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </Section>
            <TermsCard
                label={trainerAccountCopy.terms}
                accepted={fields.acceptedTerms}
                onChange={fields.onTermsChange}
                error={fields.errors.terms}
            />
        </div>
    );
}

/** A client's account: the same one, from "Cliente" to "Trainer". */
function CurrentAccount({ name, email }: { name: string; email: string }) {
    const getInitials = useInitials();

    return (
        <div className="flex flex-wrap items-center gap-4 rounded-[26px] bg-card p-4 md:rounded-[20px] md:p-5">
            <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-[19px] font-bold text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]"
            >
                {getInitials(name)}
            </span>
            <span className="flex min-w-45 flex-1 flex-col gap-0.5">
                <span className="text-[17px] leading-5.5 font-semibold">
                    {name}
                </span>
                <span className="truncate text-[13px] leading-4.5 text-muted-foreground">
                    {email}
                </span>
            </span>
            <span className="flex items-center gap-2 text-[13px] font-semibold">
                <span className="inline-flex h-8 items-center rounded-full px-3 text-muted-foreground shadow-[inset_0_0_0_1px_var(--field)]">
                    Cliente
                </span>
                <ArrowRight
                    aria-label="diventa"
                    className="size-4 text-muted-foreground"
                />
                <span className="inline-flex h-8 items-center rounded-full px-3 text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]">
                    Trainer
                </span>
            </span>
        </div>
    );
}
