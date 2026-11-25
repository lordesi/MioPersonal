import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import DayItemCard from '@/components/client/home/day-item-card';
import SuggestionCard from '@/components/client/home/suggestion-card';
import {
    AreaSectionHeader,
    areaButtonClassName,
    areaTitleClassName,
    carbCardClassName,
} from '@/components/mp/area-bits';
import InboxBell from '@/components/mp/inbox-bell';
import TrainerCard from '@/components/mp/trainer-card';
import WeekStrip from '@/components/trainer/home/week-strip';
import { formatDayLong } from '@/lib/format';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { bookings, home, messages } from '@/routes/client';
import type {
    ClientDayItem,
    GymSummary,
    TrainerSummary,
    TrainerWeekDay,
} from '@/types';

type HomeProps = {
    firstName: string;
    /** Rome dates "YYYY-MM-DD". */
    today: string;
    day: string;
    minDate: string;
    maxDate: string;
    week: TrainerWeekDay[];
    dayBookings: ClientDayItem[];
    trainers: TrainerSummary[];
    gyms: GymSummary[];
};

/** The props a change of day reloads. */
const DAY_PROPS = ['day', 'week', 'dayBookings'];

/** The card open at first: the first one not over yet, else the first. */
function firstOpen(items: ClientDayItem[], now: Date): string | null {
    return (
        items.find((item) => new Date(item.end) > now)?.key ??
        items[0]?.key ??
        null
    );
}

/**
 * "Home" of the client (design "Home cliente · nuovo"): the greeting with
 * the date and the bell of the Inbox, the week with a dot on the days with
 * sessions, the bookings of the chosen day, then the trainers to try.
 * Desktop: the week and the day side by side, the trainers in a grid.
 */
export default function Home({
    firstName,
    today,
    day,
    minDate,
    maxDate,
    week,
    dayBookings,
    trainers,
    gyms,
}: HomeProps) {
    const [now] = useState(() => new Date());
    const [openKey, setOpenKey] = useState<string | null>(() =>
        firstOpen(dayBookings, now),
    );

    const pickDay = (date: string) => {
        router.get(
            home.url({
                query: date === today ? {} : { giorno: date },
            }),
            {},
            {
                only: DAY_PROPS,
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: (page) => {
                    const items = (page.props as unknown as HomeProps)
                        .dayBookings;
                    setOpenKey(firstOpen(items, now));
                },
            },
        );
    };

    return (
        <>
            <Head title="Home" />

            <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 className={areaTitleClassName}>Ciao, {firstName}</h1>
                    <p className="mt-1.5 text-[15px] leading-5 text-muted-foreground md:text-[17px]">
                        {formatDayLong(today)}
                    </p>
                </div>
                <InboxBell
                    href={messages.url({ query: { sezione: 'notifiche' } })}
                />
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-14">
                <section aria-label="Settimana" className="lg:sticky lg:top-4">
                    <WeekStrip
                        week={week}
                        day={day}
                        today={today}
                        minDate={minDate}
                        maxDate={maxDate}
                        onPick={pickDay}
                    />
                </section>

                <section
                    aria-labelledby="day-title"
                    className="flex flex-col gap-3.5"
                >
                    <AreaSectionHeader
                        id="day-title"
                        title="Prenotazioni"
                        count={dayBookings.length}
                        link={{ label: 'Vedi tutte', href: bookings.url() }}
                    />

                    {dayBookings.length > 0 ? (
                        <div className="flex flex-col gap-2.5">
                            {dayBookings.map((item) => (
                                <DayItemCard
                                    key={item.key}
                                    item={item}
                                    now={now}
                                    open={openKey === item.key}
                                    onToggle={() =>
                                        setOpenKey(
                                            openKey === item.key
                                                ? null
                                                : item.key,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div
                            className={cn(
                                carbCardClassName,
                                'flex flex-col items-center gap-3 p-6 text-center',
                            )}
                        >
                            <span className="flex size-13 items-center justify-center rounded-full bg-[#1c1e21] text-muted-foreground">
                                <CalendarDays
                                    aria-hidden="true"
                                    className="size-6"
                                />
                            </span>
                            <p className="text-[17px] font-semibold">
                                Nessuna prenotazione
                            </p>
                            <p className="text-[15px] leading-5 text-muted-foreground">
                                {day === today ? 'Oggi è' : 'Questo giorno è'}{' '}
                                libero.
                                <br />
                                Trova un trainer vicino a te.
                            </p>
                            <Link
                                href={searchUrl()}
                                className={cn(
                                    areaButtonClassName('primary', 'md'),
                                    'mt-1',
                                )}
                            >
                                Cerca un trainer
                            </Link>
                        </div>
                    )}
                </section>
            </div>

            {trainers.length > 0 && (
                <Suggestions
                    id="trainers-title"
                    title="Trainer consigliati"
                    moreHref={searchUrl()}
                >
                    {trainers.map((trainer) => (
                        <TrainerCard
                            key={trainer.slug}
                            trainer={trainer}
                            className={railItemClassName}
                        />
                    ))}
                </Suggestions>
            )}

            {/* Only while the gyms are switched on (config/features.php). */}
            {gyms.length > 0 && (
                <Suggestions
                    id="gyms-title"
                    title="Palestre consigliate"
                    moreHref={gymSearchUrl()}
                >
                    {gyms.map((gym) => (
                        <SuggestionCard
                            key={gym.slug}
                            kind="gym"
                            gym={gym}
                            className={railItemClassName}
                        />
                    ))}
                </Suggestions>
            )}
        </>
    );
}

/** Phones: a card of 250 px in a row that snaps; from lg up a grid of 4. */
const railItemClassName = 'w-62.5 shrink-0 snap-start lg:w-auto';

function Suggestions({
    id,
    title,
    moreHref,
    children,
}: {
    id: string;
    title: string;
    moreHref: string;
    children: ReactNode;
}) {
    return (
        <section aria-labelledby={id} className="mt-1 flex flex-col gap-3.5">
            <AreaSectionHeader
                id={id}
                title={title}
                link={{ label: 'Vedi tutti', href: moreHref }}
            />
            <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
                {children}
            </div>
        </section>
    );
}

Home.layout = { section: 'home' };
