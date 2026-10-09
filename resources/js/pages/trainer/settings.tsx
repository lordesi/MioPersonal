import { Head, Link } from '@inertiajs/react';
import AccessSection from '@/components/account/access-section';
import DeleteAccountSection from '@/components/account/delete-account-section';
import NotificationsSection from '@/components/account/notifications-section';
import PersonalDataSection from '@/components/account/personal-data-section';
import PrivacySection from '@/components/account/privacy-section';
import SettingsNav from '@/components/account/settings-nav';
import SettingsSection from '@/components/account/settings-section';
import ClientContactsSection from '@/components/account/trainer/client-contacts-section';
import CloseTrainerProfileSection from '@/components/account/trainer/close-trainer-profile-section';
import ProfileVisibilitySection from '@/components/account/trainer/profile-visibility-section';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
import { availability } from '@/routes/trainer';
import type {
    AccountSettings,
    NotificationSetting,
    TrainerContacts,
} from '@/types';

type TrainerSettingsProps = {
    account: AccountSettings;
    contacts: TrainerContacts;
    upcoming: { sessions: number; requests: number };
};

/** Order of the design "Impostazioni account · trainer". */
const sections = [
    { id: 'dati', title: 'Dati personali' },
    { id: 'contatti', title: 'Contatti per i clienti' },
    { id: 'accesso', title: 'Accesso e sicurezza' },
    { id: 'visibilita', title: 'Visibilità del profilo' },
    { id: 'regole', title: 'Orari e regole' },
    { id: 'notifiche', title: 'Notifiche' },
    { id: 'privacy', title: 'Privacy e dati' },
    { id: 'chiudi', title: 'Chiudi il profilo' },
    { id: 'elimina', title: 'Elimina account' },
];

const notifications: NotificationSetting[] = [
    {
        key: 'push',
        label: 'Nuove prenotazioni sul telefono',
        hint: 'Notifica immediata, oltre all’email',
        defaultOn: true,
    },
    {
        key: 'expiry',
        label: 'Prenotazioni in scadenza',
        hint: 'Avviso 2 ore prima che una prenotazione decada',
        defaultOn: true,
    },
    {
        key: 'day',
        label: 'Riepilogo della giornata',
        hint: 'Ogni mattina alle 7 con le sedute di oggi',
        defaultOn: true,
    },
    {
        key: 'reviews',
        label: 'Nuove recensioni',
        hint: 'Per rispondere subito',
        defaultOn: true,
    },
    {
        key: 'tips',
        label: 'Consigli per il profilo',
        hint: 'Al massimo una email al mese',
        defaultOn: false,
    },
];

export default function TrainerSettings({
    account,
    contacts,
    upcoming,
}: TrainerSettingsProps) {
    return (
        <>
            <Head title="Impostazioni account" />

            <PageHeading
                title="Impostazioni account"
                description="Profilo, visibilità e notifiche del tuo account da trainer."
            />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-8">
                <SettingsNav sections={sections} columnFrom="xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
                    <PersonalDataSection
                        firstName={account.firstName}
                        lastName={account.lastName}
                    />
                    <ClientContactsSection {...contacts} />
                    <AccessSection
                        email={account.email}
                        providers={account.providers}
                        devices={account.devices}
                    />
                    <ProfileVisibilitySection />
                    {/* No design of its own: the rules live in "Disponibilità". */}
                    <SettingsSection
                        id="regole"
                        title="Orari e regole di prenotazione"
                        description="Giorni e orari di lavoro, preavviso minimo e cancellazione gratuita."
                    >
                        <div>
                            <Button asChild variant="outline" className="h-10">
                                <Link href={availability()}>
                                    Vai a Disponibilità
                                </Link>
                            </Button>
                        </div>
                    </SettingsSection>
                    <NotificationsSection settings={notifications} />
                    <PrivacySection />
                    <CloseTrainerProfileSection upcoming={upcoming} />
                    <DeleteAccountSection />
                </div>
            </div>
        </>
    );
}
