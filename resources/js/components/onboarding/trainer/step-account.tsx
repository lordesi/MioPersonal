import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    Calendar,
    Camera,
    FileText,
    Info,
    KeyRound,
    Lock,
    PanelLeft,
    PenLine,
    ShieldCheck,
    Tag,
    UserRound,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import AccountFields from '@/components/auth/account-fields';
import {
    CheckRow,
    DarkPanel,
    StepColumns,
} from '@/components/onboarding/trainer/onboarding-shell';
import NumberedSection from '@/components/trainer/area/numbered-section';
import { useInitials } from '@/hooks/use-initials';
import { login } from '@/routes';
import { privacy, terms } from '@/routes/legal';

type StepAccountProps = {
    /** A logged-in client keeps the account; null for a guest, who creates one. */
    account: { name: string; email: string } | null;
    /** The account fields of a guest (see AccountFields). */
    fields: Pick<
        ComponentProps<typeof AccountFields>,
        'errors' | 'bind' | 'onAccountExists'
    >;
    termsAccepted: boolean;
    onTermsChange: (accepted: boolean) => void;
    termsError?: string;
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

/** What the next steps ask for, in "Tieni a portata di mano". */
const needs = [
    { icon: Camera, label: 'Una tua foto' },
    { icon: PenLine, label: 'Qualche riga su di te' },
    { icon: Tag, label: 'Le tue tariffe' },
    { icon: Calendar, label: 'I giorni e gli orari in cui alleni' },
    { icon: Award, label: 'Attestati e certificazioni' },
];

/**
 * Step 1: the account that becomes a trainer one (a client) or the new
 * account (a guest), and the trainer terms.
 */
export default function StepAccount({
    account,
    fields,
    termsAccepted,
    onTermsChange,
    termsError,
}: StepAccountProps) {
    return (
        <StepColumns aside={<BeforeYouStart />}>
            <NumberedSection
                step={<UserRound aria-hidden="true" />}
                title="Il tuo account"
            >
                {account ? (
                    <CurrentAccount {...account} />
                ) : (
                    <>
                        <AccountFields
                            {...fields}
                            emailHint="Qui ricevi le richieste dei clienti. Ti mandiamo un link per verificarla."
                            phoneHint="I clienti lo vedono solo dopo che hai confermato la prenotazione."
                        />
                        <p className="text-sm text-muted-foreground">
                            Hai già un account?{' '}
                            <Link
                                href={login()}
                                className="font-medium text-foreground underline underline-offset-4"
                            >
                                Accedi
                            </Link>{' '}
                            e torna qui.
                        </p>
                    </>
                )}
            </NumberedSection>

            <NumberedSection
                step={<ShieldCheck aria-hidden="true" />}
                title="Termini e privacy"
                className="gap-4"
            >
                <div className="flex flex-wrap gap-2">
                    <DocumentLink href={terms.url()} icon={<FileText />}>
                        Termini per i trainer
                    </DocumentLink>
                    <DocumentLink href={privacy.url()} icon={<Lock />}>
                        Informativa privacy
                    </DocumentLink>
                </div>
                <CheckRow
                    checked={termsAccepted}
                    onCheckedChange={onTermsChange}
                    error={termsError}
                >
                    <span className="text-[15px] leading-5.5 font-semibold">
                        Accetto i Termini per i trainer e l’Informativa privacy
                    </span>
                </CheckRow>
            </NumberedSection>
        </StepColumns>
    );
}

/** A client's account: the same one, from "Cliente" to "Trainer". */
function CurrentAccount({ name, email }: { name: string; email: string }) {
    const getInitials = useInitials();

    return (
        <>
            <div className="flex flex-wrap items-center gap-4 rounded-[18px] border bg-muted/50 p-4">
                <span
                    aria-hidden="true"
                    className="flex size-14 flex-none items-center justify-center rounded-full bg-primary text-[19px] font-bold text-primary-foreground"
                >
                    {getInitials(name)}
                </span>
                <span className="flex min-w-45 flex-1 flex-col gap-0.5">
                    <span className="text-[17px] leading-6 font-bold tracking-[-0.01em]">
                        {name}
                    </span>
                    <span className="truncate text-sm text-foreground/70">
                        {email}
                    </span>
                </span>
                <span className="flex items-center gap-2 text-[13px] font-semibold">
                    <span className="inline-flex h-7.5 items-center rounded-full border border-input bg-card px-3 text-foreground/70">
                        Cliente
                    </span>
                    <ArrowRight
                        aria-label="diventa"
                        className="size-4 text-muted-foreground"
                    />
                    <span className="inline-flex h-7.5 items-center rounded-full bg-primary px-3 text-primary-foreground">
                        Trainer
                    </span>
                </span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-2.5">
                {changes.map((item) => (
                    <li
                        key={item.title}
                        className="flex flex-col gap-2.5 rounded-2xl border p-4"
                    >
                        <span className="flex size-9 items-center justify-center rounded-[10px] bg-secondary">
                            <item.icon
                                aria-hidden="true"
                                className="size-4.5"
                            />
                        </span>
                        <span className="flex flex-col gap-0.5">
                            <span className="text-[15px] leading-5.5 font-semibold">
                                {item.title}
                            </span>
                            <span className="text-[13px] leading-4.5 text-foreground/70">
                                {item.text}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </>
    );
}

/** "Termini per i trainer", "Informativa privacy": they open in a new tab. */
function DocumentLink({
    href,
    icon,
    children,
}: {
    href: string;
    icon: ReactNode;
    children: string;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-secondary [&>svg]:size-4"
        >
            {icon}
            {children}
        </a>
    );
}

/** The black panel of step 1: what the next steps ask for. */
function BeforeYouStart() {
    return (
        <DarkPanel title="Prima di iniziare">
            <span className="-mt-3 text-[30px] leading-9 font-bold tracking-[-0.03em]">
                Tieni a portata di mano
            </span>
            <ul className="flex flex-col gap-2">
                {needs.map((item) => (
                    <li
                        key={item.label}
                        className="flex items-center gap-3 rounded-[14px] bg-sidebar-accent px-3.5 py-3"
                    >
                        <span className="flex size-8 flex-none items-center justify-center rounded-full bg-sidebar-border">
                            <item.icon
                                aria-hidden="true"
                                className="size-3.75"
                            />
                        </span>
                        <span className="min-w-0 flex-1 text-sm text-sidebar-foreground/90">
                            {item.label}
                        </span>
                    </li>
                ))}
            </ul>
        </DarkPanel>
    );
}
