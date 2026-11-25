import { Head, Link } from '@inertiajs/react';
import {
    Bell,
    ChevronLeft,
    ChevronRight,
    LockKeyhole,
    Mail,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import AccessSection from '@/components/account/access-section';
import DeleteAccountSection from '@/components/account/delete-account-section';
import NotificationsSection from '@/components/account/notifications-section';
import PersonalDataSection from '@/components/account/personal-data-section';
import { BareSettingsSection } from '@/components/account/settings-section';
import {
    SettingsSubpage,
    useSettingsView,
} from '@/components/account/settings-views';
import {
    AreaRow,
    AreaRowGroup,
    areaButtonClassName,
    areaTitleClassName,
} from '@/components/mp/area-bits';
import { openCookieSettings } from '@/lib/cookie-consent';
import { cn } from '@/lib/utils';
import { profile } from '@/routes/client';
import { cookies, privacy, terms } from '@/routes/legal';
import type { AccountSettings } from '@/types';

type SettingsProps = {
    account: AccountSettings;
    pendingBookingTrainers: string[];
};

/** The pages of "Impostazioni", opened with "#dati", "#notifiche"… */
const VIEWS = {
    dati: 'Dati personali',
    email: 'Email',
    password: 'Password',
    notifiche: 'Notifiche',
    privacy: 'Privacy e dati',
    elimina: 'Elimina account',
} as const;

type View = keyof typeof VIEWS;

/**
 * "Impostazioni" of the client (design "Impostazioni cliente · V1"): the
 * list ACCOUNT, PREFERENZE, ALTRO and "Elimina account"; each row opens its
 * page ("‹ Impostazioni"), kept in the address ("#notifiche") so the back
 * button of the phone goes back to the list.
 */
export default function Settings({
    account,
    pendingBookingTrainers,
}: SettingsProps) {
    const [view, open] = useSettingsView<View>(Object.keys(VIEWS) as View[], {
        // Older links: "#accesso" was email and password together.
        accesso: 'password',
    });

    const activeNotifications =
        account.notifications.push.filter((item) => item.enabled).length +
        (account.notifications.reminders ? 1 : 0);

    if (view !== null) {
        return (
            <>
                <Head title={`${VIEWS[view]} · Impostazioni`} />
                <SettingsSubpage title={VIEWS[view]} onBack={() => open(null)}>
                    <BareSettingsSection.Provider value>
                        {view === 'dati' && (
                            <PersonalDataSection
                                firstName={account.firstName}
                                lastName={account.lastName}
                                phone={account.phone}
                            />
                        )}
                        {(view === 'email' || view === 'password') && (
                            <AccessSection
                                part={view}
                                email={account.email}
                                hasPassword={account.hasPassword}
                                passwordChangedAt={account.passwordChangedAt}
                                providers={account.providers}
                            />
                        )}
                        {view === 'notifiche' && (
                            <NotificationsSection
                                role="client"
                                reminders={account.notifications.reminders}
                                push={account.notifications.push}
                            />
                        )}
                        {view === 'privacy' && <PrivacyPage />}
                        {view === 'elimina' && (
                            <DeleteAccountSection
                                description="Eliminando il profilo, accetti di perdere tutti i tuoi dati. Hai 30 giorni per ripensarci, poi sarà impossibile recuperarlo."
                                hasPassword={account.hasPassword}
                                pendingBookingTrainers={pendingBookingTrainers}
                            />
                        )}
                    </BareSettingsSection.Provider>
                </SettingsSubpage>
            </>
        );
    }

    return (
        <>
            <Head title="Impostazioni" />

            <div className="flex flex-col gap-1">
                <Link
                    href={profile()}
                    className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-base font-semibold text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-ring md:hidden"
                >
                    <ChevronLeft aria-hidden="true" className="size-5" />
                    Profilo
                </Link>
                <h1 className={areaTitleClassName}>Impostazioni</h1>
            </div>

            <div className="flex max-w-170 flex-col gap-8">
                <AreaRowGroup title="Account">
                    <AreaRow
                        title="Dati personali"
                        icon={UserRound}
                        value={`${account.firstName} ${account.lastName}`.trim()}
                        onClick={() => open('dati')}
                    />
                    <AreaRow
                        title="Email"
                        icon={Mail}
                        value="Verificata"
                        onClick={() => open('email')}
                    />
                    <AreaRow
                        title="Password"
                        icon={LockKeyhole}
                        onClick={() => open('password')}
                    />
                </AreaRowGroup>

                <AreaRowGroup title="Preferenze">
                    <AreaRow
                        title="Notifiche"
                        icon={Bell}
                        value={
                            activeNotifications === 1
                                ? '1 attiva'
                                : `${activeNotifications} attive`
                        }
                        onClick={() => open('notifiche')}
                    />
                </AreaRowGroup>

                <AreaRowGroup title="Altro">
                    <AreaRow
                        title="Privacy e dati"
                        icon={ShieldCheck}
                        onClick={() => open('privacy')}
                    />
                </AreaRowGroup>

                <button
                    type="button"
                    onClick={() => open('elimina')}
                    className="flex min-h-16 w-full items-center gap-3.5 border-b border-separator py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                    <span className="min-w-0 flex-1 text-[17px] leading-5.5 font-semibold text-[#ff7a7a]">
                        Elimina account
                    </span>
                    <ChevronRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                    />
                </button>
            </div>
        </>
    );
}

/** "Privacy e dati": the statistics (the cookie choices) and the documents. */
function PrivacyPage() {
    const documents = [
        { title: 'Informativa privacy', href: privacy.url() },
        { title: 'Cookie policy', href: cookies.url() },
        { title: 'Termini e condizioni', href: terms.url() },
    ];

    return (
        <div className="flex flex-col gap-8">
            <AreaRowGroup title="I tuoi dati">
                <div className="flex min-h-16 items-center gap-3.5 border-b border-separator py-2.5">
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <b className="text-[17px] leading-5.5 font-semibold">
                            Statistiche anonime
                        </b>
                        <span className="text-[15px] leading-5 text-muted-foreground">
                            Ci aiutano a migliorare MioPersonal
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={openCookieSettings}
                        className={areaButtonClassName('outline', 'sm')}
                    >
                        Gestisci
                    </button>
                </div>
            </AreaRowGroup>

            <AreaRowGroup title="Documenti">
                {documents.map((document) => (
                    <a
                        key={document.href}
                        href={document.href}
                        className={cn(
                            'flex min-h-16 items-center gap-3.5 border-b border-separator py-2.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                        )}
                    >
                        <span className="min-w-0 flex-1 text-[17px] leading-5.5 font-semibold">
                            {document.title}
                        </span>
                        <ChevronRight
                            aria-hidden="true"
                            className="size-5 shrink-0 text-muted-foreground"
                        />
                    </a>
                ))}
            </AreaRowGroup>
        </div>
    );
}

Settings.layout = { section: 'settings' };
