import { Head, Link } from '@inertiajs/react';
import AccessSection from '@/components/account/access-section';
import DeleteAccountSection from '@/components/account/delete-account-section';
import PersonalDataSection from '@/components/account/personal-data-section';
import SettingsNav from '@/components/account/settings-nav';
import { completeProfile } from '@/routes/client';
import type { AccountSettings } from '@/types';

type SettingsProps = {
    account: AccountSettings;
    pendingBookingTrainers: string[];
};

const sections = [
    { id: 'dati', title: 'Dati personali' },
    { id: 'accesso', title: 'Accesso e sicurezza' },
    { id: 'elimina', title: 'Elimina account' },
];

export default function Settings({
    account,
    pendingBookingTrainers,
}: SettingsProps) {
    return (
        <>
            <Head title="Impostazioni account" />

            <div className="mx-auto flex w-full max-w-264 flex-col gap-4 md:gap-7">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-4xl md:leading-10">
                        Impostazioni account
                    </h1>
                    <p className="text-sm text-muted-foreground md:text-base">
                        Le preferenze per trovare trainer (zona, obiettivi,
                        orari) sono nel{' '}
                        <Link
                            href={completeProfile()}
                            className="text-foreground underline"
                        >
                            tuo profilo
                        </Link>
                        .
                    </p>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-10">
                    <SettingsNav sections={sections} />
                    <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
                        <PersonalDataSection
                            firstName={account.firstName}
                            lastName={account.lastName}
                            phone={account.phone}
                            description="Il trainer vede nome e cognome quando gli invii una richiesta; il telefono solo dopo che l’ha confermata."
                            phoneHint="Il trainer lo vede solo dopo aver confermato la tua prenotazione."
                        />
                        <AccessSection
                            email={account.email}
                            hasPassword={account.hasPassword}
                            passwordChangedAt={account.passwordChangedAt}
                            providers={account.providers}
                        />
                        <DeleteAccountSection
                            pendingBookingTrainers={pendingBookingTrainers}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

Settings.layout = { section: 'account', wide: true };
