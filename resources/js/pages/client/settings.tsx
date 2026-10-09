import { Head, Link } from '@inertiajs/react';
import AccessSection from '@/components/account/access-section';
import DeleteAccountSection from '@/components/account/delete-account-section';
import NotificationsSection from '@/components/account/notifications-section';
import PersonalDataSection from '@/components/account/personal-data-section';
import PrivacySection from '@/components/account/privacy-section';
import SettingsNav from '@/components/account/settings-nav';
import { completeProfile } from '@/routes/client';
import type { AccountSettings, NotificationSetting } from '@/types';

type SettingsProps = {
    account: AccountSettings;
    pendingBookingTrainers: string[];
};

const sections = [
    { id: 'dati', title: 'Dati personali' },
    { id: 'accesso', title: 'Accesso e sicurezza' },
    { id: 'notifiche', title: 'Notifiche' },
    { id: 'privacy', title: 'Privacy e dati' },
    { id: 'elimina', title: 'Elimina account' },
];

const notifications: NotificationSetting[] = [
    {
        key: 'reminder',
        label: 'Promemoria il giorno prima',
        hint: 'Email per ogni seduta confermata',
        defaultOn: true,
    },
    {
        key: 'push',
        label: 'Notifiche sul telefono',
        hint: 'Conferme e cambi di orario in tempo reale',
        defaultOn: false,
    },
    {
        key: 'favorites',
        label: 'Orari liberi dei preferiti',
        hint: 'Quando un trainer salvato ha nuovi slot',
        defaultOn: true,
    },
    {
        key: 'news',
        label: 'Novità e consigli',
        hint: 'Al massimo una email al mese',
        defaultOn: false,
    },
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
                        />
                        <AccessSection
                            email={account.email}
                            providers={account.providers}
                            devices={account.devices}
                        />
                        <NotificationsSection settings={notifications} />
                        <PrivacySection />
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
