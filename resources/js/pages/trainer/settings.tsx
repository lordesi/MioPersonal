import { Head, Link } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    LockKeyhole,
    Mail,
    MessageCircle,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import AccessSection from '@/components/account/access-section';
import DeleteAccountSection from '@/components/account/delete-account-section';
import NotificationsSection from '@/components/account/notifications-section';
import PersonalDataSection from '@/components/account/personal-data-section';
import { BareSettingsSection } from '@/components/account/settings-section';
import AutoConfirmSwitch from '@/components/account/trainer/auto-confirm-switch';
import {
    SettingsSubpage,
    useSettingsView,
} from '@/components/account/settings-views';
import ClientContactsSection from '@/components/account/trainer/client-contacts-section';
import CloseTrainerProfileSection from '@/components/account/trainer/close-trainer-profile-section';
import GoogleCalendarSection from '@/components/account/trainer/google-calendar-section';
import ProfileVisibilitySection from '@/components/account/trainer/profile-visibility-section';
import {
    AreaRow,
    AreaRowGroup,
    areaTitleClassName,
} from '@/components/mp/area-bits';
import { cookies, privacy, terms } from '@/routes/legal';
import { profile } from '@/routes/trainer';
import type {
    AccountSettings,
    TrainerContacts,
    TrainerGoogleCalendar,
    TrainerVisibility,
} from '@/types';

type TrainerSettingsProps = {
    account: AccountSettings;
    /** Null until the registration is sent: the row is hidden. */
    contacts: TrainerContacts | null;
    /** Null until the registration is sent, or while Google is not set up. */
    googleCalendar: TrainerGoogleCalendar | null;
    visibility: TrainerVisibility | null;
    /** "Conferma automatica"; null until the registration is sent. */
    autoConfirm: boolean | null;
};

const VIEWS = {
    dati: 'Dati personali',
    contatti: 'Contatti per i clienti',
    email: 'Email',
    password: 'Password',
    calendario: 'Google Calendar',
    notifiche: 'Notifiche',
    privacy: 'Privacy e dati',
    chiudi: 'Chiudi il profilo da trainer',
    elimina: 'Elimina account',
} as const;

type View = keyof typeof VIEWS;

/**
 * "Impostazioni" of the trainer (design "Trainer · Impostazioni · nuovo"):
 * ACCOUNT, PREFERENZE, RICHIESTE ("Conferma automatica"), VISIBILITÀ DEL
 * PROFILO with "Metti in pausa" right in the list, ALTRO, then "Chiudi il
 * profilo da trainer". Each row opens
 * its page ("#notifiche"), with "‹ Impostazioni".
 */
export default function TrainerSettings({
    account,
    contacts,
    googleCalendar,
    visibility,
    autoConfirm,
}: TrainerSettingsProps) {
    const [view, open] = useSettingsView<View>(
        Object.keys(VIEWS) as View[],
        // "#accesso" was email and password; "#visibilita" is in the list.
        { accesso: 'password', visibilita: null },
    );

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
                        {view === 'contatti' && contacts && (
                            <ClientContactsSection {...contacts} />
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
                        {view === 'calendario' && googleCalendar && (
                            <GoogleCalendarSection {...googleCalendar} />
                        )}
                        {view === 'notifiche' && (
                            <NotificationsSection
                                role="trainer"
                                reminders={account.notifications.reminders}
                                push={account.notifications.push}
                            />
                        )}
                        {view === 'privacy' && <Documents />}
                        {view === 'chiudi' && (
                            <CloseTrainerProfileSection
                                canPause={visibility !== null}
                            />
                        )}
                        {view === 'elimina' && (
                            <DeleteAccountSection
                                description="Cancelliamo account, profilo, preferiti e recensioni dopo 30 giorni, il tempo per ripensarci. Le sedute future vengono annullate subito."
                                hasPassword={account.hasPassword}
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
                    {contacts && (
                        <AreaRow
                            title="Contatti per i clienti"
                            icon={MessageCircle}
                            onClick={() => open('contatti')}
                        />
                    )}
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
                    {googleCalendar && (
                        <AreaRow
                            title="Google Calendar"
                            icon={CalendarDays}
                            value={
                                googleCalendar.connected
                                    ? 'Collegato'
                                    : undefined
                            }
                            onClick={() => open('calendario')}
                        />
                    )}
                </AreaRowGroup>

                {autoConfirm !== null && (
                    <AreaRowGroup title="Richieste">
                        <AutoConfirmSwitch on={autoConfirm} />
                    </AreaRowGroup>
                )}

                {visibility && (
                    <AreaRowGroup title="Visibilità del profilo">
                        <BareSettingsSection.Provider value>
                            <ProfileVisibilitySection {...visibility} />
                        </BareSettingsSection.Provider>
                    </AreaRowGroup>
                )}

                <AreaRowGroup title="Altro">
                    <AreaRow
                        title="Privacy e dati"
                        icon={ShieldCheck}
                        onClick={() => open('privacy')}
                    />
                </AreaRowGroup>

                <div className="flex flex-col">
                    <DangerRow
                        title="Chiudi il profilo da trainer"
                        hint="Torni cliente senza perdere l’account"
                        onClick={() => open('chiudi')}
                    />
                    <DangerRow
                        title="Elimina account"
                        onClick={() => open('elimina')}
                    />
                </div>
            </div>
        </>
    );
}

function DangerRow({
    title,
    hint,
    onClick,
}: {
    title: string;
    hint?: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-h-16 w-full items-center gap-3.5 border-b border-separator py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[17px] leading-5.5 font-semibold text-[#ff7a7a]">
                    {title}
                </span>
                {hint && (
                    <span className="text-[15px] leading-5 text-muted-foreground">
                        {hint}
                    </span>
                )}
            </span>
            <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
            />
        </button>
    );
}

/** "Privacy e dati": the documents. */
function Documents() {
    const documents = [
        { title: 'Informativa privacy', href: privacy.url() },
        { title: 'Cookie policy', href: cookies.url() },
        { title: 'Termini e condizioni', href: terms.url() },
    ];

    return (
        <AreaRowGroup title="Documenti">
            {documents.map((document) => (
                <a
                    key={document.href}
                    href={document.href}
                    className="flex min-h-16 items-center gap-3.5 border-b border-separator py-2.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
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
    );
}

TrainerSettings.layout = { section: 'settings' };
