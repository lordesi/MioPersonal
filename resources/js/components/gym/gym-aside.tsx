import { Navigation, Phone, Ticket } from 'lucide-react';
import {
    ContactLinks,
    GymHours,
    contactRows,
} from '@/components/gym/gym-sections';
import { formatPrice } from '@/lib/format';
import type { GymProfileData } from '@/types';

/** "tel:+39…" from the phone the gym wrote, or null. */
export function phoneHref(phone: string | null): string | null {
    return phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : null;
}

/** The round icon buttons of the bar and of the aside: call, directions. */
const roundAction =
    'flex size-11 shrink-0 items-center justify-center rounded-full text-brand shadow-[inset_0_0_0_1px_var(--brand)] outline-none hover:bg-brand/10 focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * Desktop, on the right of the gym's page (as the booking of the trainer
 * profile): from how much a month, "Vedi abbonamenti", call and directions,
 * then the hours and the contacts.
 */
export function GymAside({ gym }: { gym: GymProfileData }) {
    const call = phoneHref(gym.contacts.phone);
    const rows = contactRows(gym.contacts);

    return (
        <aside
            aria-label={`Contatta ${gym.name}`}
            className="sticky top-6 hidden flex-col gap-5 rounded-[26px] bg-background p-6 shadow-[inset_0_0_0_1px_var(--border),0_24px_64px_-12px_rgba(0,0,0,0.8)] md:flex"
        >
            <div className="flex items-center gap-3.5">
                <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-card text-brand"
                >
                    <Ticket className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                    {gym.monthlyFromCents !== null ? (
                        <span className="text-[28px] leading-8.5 font-bold tabular-nums">
                            da {formatPrice(gym.monthlyFromCents)}{' '}
                            <span className="text-[15px] font-normal text-muted-foreground">
                                / mese
                            </span>
                        </span>
                    ) : (
                        <span className="text-[17px] font-semibold">
                            Chiedi in palestra
                        </span>
                    )}
                    <span className="text-[15px] text-muted-foreground">
                        {gym.address}
                    </span>
                </span>
            </div>

            <div className="flex gap-2.5">
                {gym.plans.length > 0 ? (
                    <a
                        href="#abbonamenti"
                        className="btn-brand h-12.5 flex-1 text-[17px]"
                    >
                        Vedi abbonamenti
                    </a>
                ) : (
                    <a
                        href={gym.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-brand h-12.5 flex-1 text-[17px]"
                    >
                        Indicazioni
                    </a>
                )}
                {call && (
                    <a
                        href={call}
                        aria-label={`Chiama ${gym.name}`}
                        className={`${roundAction} size-12.5`}
                    >
                        <Phone aria-hidden="true" className="size-5" />
                    </a>
                )}
                {gym.plans.length > 0 && (
                    <a
                        href={gym.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Indicazioni su Google Maps"
                        className={`${roundAction} size-12.5`}
                    >
                        <Navigation aria-hidden="true" className="size-5" />
                    </a>
                )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
                <h2 className="text-[15px] font-semibold">Orari di apertura</h2>
                <GymHours
                    hours={gym.hours}
                    openNow={gym.openNow}
                    notes={gym.openingNotes}
                />
            </div>

            {rows.length > 0 && (
                <ContactLinks
                    rows={rows}
                    className="border-t border-border pt-3"
                />
            )}

            <p className="text-[13px] leading-4.5 text-muted-foreground">
                Gli abbonamenti si acquistano in palestra · Nessun pagamento
                online
            </p>
        </aside>
    );
}

/**
 * Phones (as the "Barra 5" of the trainer profile): the bar fixed at the
 * bottom, round, on black. The price, call, directions and "Abbonamenti".
 */
export function GymBar({ gym }: { gym: GymProfileData }) {
    const call = phoneHref(gym.contacts.phone);

    return (
        <div className="fixed inset-x-3 bottom-4 z-40 flex items-center gap-2 rounded-[26px] bg-background p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[inset_0_0_0_1px_var(--border),0_16px_48px_-8px_rgba(0,0,0,0.75)] md:hidden">
            <span className="flex min-w-0 flex-1 flex-col pl-2">
                {gym.monthlyFromCents !== null ? (
                    <>
                        <span className="text-[17px] leading-5.5 font-bold whitespace-nowrap tabular-nums">
                            da {formatPrice(gym.monthlyFromCents)}
                        </span>
                        <span className="truncate text-[13px] text-muted-foreground">
                            al mese
                        </span>
                    </>
                ) : (
                    <>
                        <span className="truncate text-[15px] font-semibold">
                            {gym.name}
                        </span>
                        <span className="truncate text-[13px] text-muted-foreground">
                            {gym.city.name}
                        </span>
                    </>
                )}
            </span>

            {call && (
                <a
                    href={call}
                    aria-label={`Chiama ${gym.name}`}
                    className={roundAction}
                >
                    <Phone aria-hidden="true" className="size-5" />
                </a>
            )}
            <a
                href={gym.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Indicazioni su Google Maps"
                className={roundAction}
            >
                <Navigation aria-hidden="true" className="size-5" />
            </a>
            {gym.plans.length > 0 && (
                <a
                    href="#abbonamenti"
                    className="btn-brand h-11 shrink-0 px-5 text-[17px]"
                >
                    Abbonamenti
                </a>
            )}
        </div>
    );
}
