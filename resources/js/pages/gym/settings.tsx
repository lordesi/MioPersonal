import { Head, router } from '@inertiajs/react';
import { Bell, Eye, LockKeyhole, Trash2, UserRound } from 'lucide-react';
import AccessSection from '@/components/account/access-section';
import DeleteAccountSection from '@/components/account/delete-account-section';
import NotificationsSection from '@/components/account/notifications-section';
import PersonalDataSection from '@/components/account/personal-data-section';
import SettingSwitch from '@/components/account/setting-switch';
import SettingsNav from '@/components/account/settings-nav';
import type { SettingsNavSection } from '@/components/account/settings-nav';
import SettingsSection from '@/components/account/settings-section';
import PageHeading from '@/components/trainer/area/page-heading';
import { update as updateVisibility } from '@/routes/gym/visibility';
import type { AccountSettings } from '@/types';

type GymSettingsProps = {
    account: AccountSettings;
    /** Null until the registration is sent. */
    visibleInSearch: boolean | null;
};

const allSections: SettingsNavSection[] = [
    { id: 'dati', title: 'Dati del referente', icon: UserRound },
    { id: 'accesso', title: 'Accesso e sicurezza', icon: LockKeyhole },
    { id: 'notifiche', title: 'Notifiche', icon: Bell },
    { id: 'visibilita', title: 'Visibilità della palestra', icon: Eye },
    { id: 'elimina', title: 'Elimina account', icon: Trash2 },
];

/** "Impostazioni account" of the gym. */
export default function GymSettings({
    account,
    visibleInSearch,
}: GymSettingsProps) {
    const sections =
        visibleInSearch === null
            ? allSections.filter((section) => section.id !== 'visibilita')
            : allSections;

    return (
        <>
            <Head title="Impostazioni account" />

            <PageHeading title="Impostazioni account" />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-5">
                <SettingsNav sections={sections} columnFrom="xl" />
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
                    <NotificationsSection
                        role="gym"
                        reminders={account.notifications.reminders}
                        push={account.notifications.push}
                    />
                    {visibleInSearch !== null && (
                        <SettingsSection
                            id="visibilita"
                            title="Visibilità della palestra"
                            icon={Eye}
                            description="Spenta, la palestra non compare nella ricerca; il link al profilo funziona ancora."
                        >
                            <SettingSwitch
                                label="Visibile nella ricerca"
                                description={
                                    visibleInSearch
                                        ? 'I clienti trovano la palestra cercando nella sua città.'
                                        : 'Nascosta dalla ricerca.'
                                }
                                checked={visibleInSearch}
                                highlightOn
                                onCheckedChange={(checked) =>
                                    router.patch(
                                        updateVisibility.url(),
                                        { visible_in_search: checked },
                                        { preserveScroll: true },
                                    )
                                }
                            />
                        </SettingsSection>
                    )}
                    <DeleteAccountSection
                        description="Cancelliamo account, profilo, foto, abbonamenti e promozioni dopo 30 giorni, il tempo per ripensarci. I trainer collegati non vedranno più la palestra nel loro profilo."
                        hasPassword={account.hasPassword}
                    />
                </div>
            </div>
        </>
    );
}

GymSettings.layout = { section: 'settings' };
