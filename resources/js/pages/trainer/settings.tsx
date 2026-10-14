import { Head, Link } from '@inertiajs/react';
import AccessSection from '@/components/account/access-section';
import DeleteAccountSection from '@/components/account/delete-account-section';
import PersonalDataSection from '@/components/account/personal-data-section';
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
    TrainerContacts,
    TrainerVisibility,
} from '@/types';

type TrainerSettingsProps = {
    account: AccountSettings;
    /** Null until the registration is sent: the section is hidden. */
    contacts: TrainerContacts | null;
    visibility: TrainerVisibility | null;
    upcoming: { sessions: number; requests: number };
};

/** Order of the design "Impostazioni account · trainer". */
const sections = [
    { id: 'dati', title: 'Dati personali' },
    { id: 'contatti', title: 'Contatti per i clienti' },
    { id: 'accesso', title: 'Accesso e sicurezza' },
    { id: 'visibilita', title: 'Visibilità del profilo' },
    { id: 'regole', title: 'Orari e regole' },
    { id: 'chiudi', title: 'Chiudi il profilo' },
    { id: 'elimina', title: 'Elimina account' },
];

export default function TrainerSettings({
    account,
    contacts,
    visibility,
    upcoming,
}: TrainerSettingsProps) {
    return (
        <>
            <Head title="Impostazioni account" />

            <PageHeading
                title="Impostazioni account"
                description="Profilo e visibilità del tuo account da trainer."
            />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-8">
                <SettingsNav sections={sections} columnFrom="xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
                    <PersonalDataSection
                        firstName={account.firstName}
                        lastName={account.lastName}
                        phone={account.phone}
                        description="Nome e cognome compaiono sul tuo profilo pubblico."
                        phoneHint="I clienti lo vedono solo dopo che hai confermato la prenotazione."
                    />
                    {contacts && <ClientContactsSection {...contacts} />}
                    <AccessSection
                        email={account.email}
                        hasPassword={account.hasPassword}
                        passwordChangedAt={account.passwordChangedAt}
                        providers={account.providers}
                    />
                    {visibility && <ProfileVisibilitySection {...visibility} />}
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
                    <CloseTrainerProfileSection upcoming={upcoming} />
                    <DeleteAccountSection />
                </div>
            </div>
        </>
    );
}
