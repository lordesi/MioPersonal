import { Head } from '@inertiajs/react';
import { LockKeyhole, Trash2, UserRound } from 'lucide-react';
import AccessSection from '@/components/account/access-section';
import DeleteAccountSection from '@/components/account/delete-account-section';
import PersonalDataSection from '@/components/account/personal-data-section';
import SettingsNav from '@/components/account/settings-nav';
import type { SettingsNavSection } from '@/components/account/settings-nav';
import PageHeading from '@/components/trainer/area/page-heading';
import type { AccountSettings } from '@/types';

type SettingsProps = {
    account: AccountSettings;
    pendingBookingTrainers: string[];
};

/** The sections of the trainer design that are not only for trainers. */
const sections: SettingsNavSection[] = [
    { id: 'dati', title: 'Dati personali', icon: UserRound },
    { id: 'accesso', title: 'Accesso e sicurezza', icon: LockKeyhole },
    { id: 'elimina', title: 'Elimina account', icon: Trash2 },
];

export default function Settings({
    account,
    pendingBookingTrainers,
}: SettingsProps) {
    return (
        <>
            <Head title="Impostazioni account" />

            <div className="flex w-full flex-col gap-4 md:gap-6">
                <PageHeading title="Impostazioni account" />

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
                    <SettingsNav sections={sections} />
                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                        <PersonalDataSection
                            firstName={account.firstName}
                            lastName={account.lastName}
                            phone={account.phone}
                        />
                        <AccessSection
                            email={account.email}
                            hasPassword={account.hasPassword}
                            passwordChangedAt={account.passwordChangedAt}
                            providers={account.providers}
                        />
                        <DeleteAccountSection
                            description="Eliminando il profilo, accetti di perdere tutti i tuoi dati. Una volta eliminato sarà impossibile recuperarlo"
                            hasPassword={account.hasPassword}
                            pendingBookingTrainers={pendingBookingTrainers}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
