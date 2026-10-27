import { Head } from '@inertiajs/react';
import { Eye, LockKeyhole, Mail, Power, Trash2, UserRound } from 'lucide-react';
import AccessSection from '@/components/account/access-section';
import DeleteAccountSection from '@/components/account/delete-account-section';
import PersonalDataSection from '@/components/account/personal-data-section';
import SettingsNav from '@/components/account/settings-nav';
import type { SettingsNavSection } from '@/components/account/settings-nav';
import ClientContactsSection from '@/components/account/trainer/client-contacts-section';
import CloseTrainerProfileSection from '@/components/account/trainer/close-trainer-profile-section';
import ProfileVisibilitySection from '@/components/account/trainer/profile-visibility-section';
import PageHeading from '@/components/trainer/area/page-heading';
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
};

/** Order of the design "Area trainer · Impostazioni account". */
const allSections: SettingsNavSection[] = [
    { id: 'dati', title: 'Dati personali', icon: UserRound },
    { id: 'contatti', title: 'Contatti per i clienti', icon: Mail },
    { id: 'accesso', title: 'Accesso e sicurezza', icon: LockKeyhole },
    { id: 'visibilita', title: 'Visibilità del profilo', icon: Eye },
    { id: 'chiudi', title: 'Chiudi il profilo', icon: Power },
    { id: 'elimina', title: 'Elimina account', icon: Trash2 },
];

/** Before the registration is sent there are no contacts and no visibility. */
const sectionsWithoutProfile = allSections.filter(
    (section) => section.id !== 'contatti' && section.id !== 'visibilita',
);

export default function TrainerSettings({
    account,
    contacts,
    visibility,
}: TrainerSettingsProps) {
    return (
        <>
            <Head title="Impostazioni account" />

            <PageHeading title="Impostazioni account" />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-5">
                <SettingsNav
                    sections={visibility ? allSections : sectionsWithoutProfile}
                    columnFrom="xl"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <PersonalDataSection
                        firstName={account.firstName}
                        lastName={account.lastName}
                        phone={account.phone}
                    />
                    {contacts && <ClientContactsSection {...contacts} />}
                    <AccessSection
                        email={account.email}
                        hasPassword={account.hasPassword}
                        passwordChangedAt={account.passwordChangedAt}
                        providers={account.providers}
                    />
                    {visibility && <ProfileVisibilitySection {...visibility} />}
                    <CloseTrainerProfileSection
                        canPause={visibility !== null}
                    />
                    <DeleteAccountSection
                        description="Cancelliamo account, profilo, preferiti e recensioni."
                        hasPassword={account.hasPassword}
                    />
                </div>
            </div>
        </>
    );
}
