import {
    ArrowUpRight,
    CalendarDays,
    Check,
    ChevronDown,
    Layers,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { DumbbellIcon } from '@/components/mp/icons';
import MonthCalendar, {
    monthsBetween,
    romeToday,
} from '@/components/mp/month-calendar';
import { Spinner } from '@/components/ui/spinner';
import type { TrainerBooking } from '@/hooks/use-trainer-booking';
import {
    freeStarts,
    perPersonLabel,
    servicePriceLabel,
    totalPriceCents,
    totalPriceLabel,
} from '@/lib/booking';
import { shiftYearMonth } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayShort,
    formatDuration,
    formatPrice,
    formatTimeRange,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AvailabilityDay, TrainerService, TrainingPlace } from '@/types';

/** "Pacchetto 10 sedute" or a bought package: the stacked icon. */
const isPackage = (service: TrainerService) =>
    service.packageId !== null || (service.sessions ?? null) !== null;

/** Under the name: "Da 1 a 2 ore", "31,50 € a seduta". */
function serviceMeta(service: TrainerService): string {
    const sessions = service.sessions ?? null;

    if (sessions !== null && service.packageId === null) {
        return `${formatPrice(Math.round(service.priceCents / sessions))} a seduta`;
    }

    return (
        service.durationLabel.charAt(0).toUpperCase() +
        service.durationLabel.slice(1)
    );
}

/** "/ seduta", "10 sedute", nothing for a bought package. */
function priceUnit(service: TrainerService): string {
    if (service.packageId !== null) {
        return '';
    }

    const sessions = service.sessions ?? null;

    return sessions !== null ? `${sessions} sedute` : '/ seduta';
}

/** "Dove" in a word: the gym's name, or what the place is. */
export const placeLabel = (place: TrainingPlace) =>
    ({
        studio: 'In studio',
        gym: place.title,
        home: 'A domicilio',
        park: "All'aperto",
        online: 'Online',
    })[place.type];

/** A choice of the page: grey outline, filled turquoise when chosen. */
function Choice({
    pressed,
    onClick,
    className,
    children,
}: {
    pressed: boolean;
    onClick: () => void;
    className?: string;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                'flex h-11 items-center justify-center rounded-full px-4 text-[15px] font-semibold whitespace-nowrap tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                pressed
                    ? 'border-[1.5px] border-brand bg-brand text-black'
                    : 'border border-field text-foreground hover:bg-foreground/6',
                className,
            )}
        >
            {children}
        </button>
    );
}

const sectionTitle =
    'text-[22px] leading-7 font-bold md:text-[28px] md:leading-8.5';

/**
 * "Servizi": one card each, the chosen one outlined turquoise, with its
 * description and "Cosa otterrai".
 */
export function ServicesSection({
    services,
    booking,
}: {
    services: TrainerService[];
    booking: TrainerBooking;
}) {
    if (services.length === 0) {
        return null;
    }

    return (
        <section
            id="servizi"
            aria-labelledby="services-title"
            className="flex scroll-mt-6 flex-col gap-3 md:gap-4"
        >
            <h2 id="services-title" className={sectionTitle}>
                Servizi
            </h2>
            <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] md:gap-4">
                {services.map((service) => {
                    const selected = service.id === booking.service?.id;
                    const Icon = isPackage(service) ? Layers : DumbbellIcon;

                    return (
                        <div
                            key={service.id}
                            className={cn(
                                'flex flex-col gap-3.5 rounded-[20px] p-4',
                                selected
                                    ? 'shadow-[inset_0_0_0_1.5px_var(--brand)]'
                                    : 'shadow-[inset_0_0_0_1px_#26282c]',
                            )}
                        >
                            <button
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                    booking.changeService(service.id)
                                }
                                className="flex min-h-11 w-full items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'flex size-10 shrink-0 items-center justify-center rounded-full border',
                                        selected
                                            ? 'border-brand text-brand'
                                            : 'border-field text-muted-foreground',
                                    )}
                                >
                                    <Icon className="size-5" />
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-[17px] font-semibold">
                                            {service.name}
                                        </span>
                                        {service.mostBooked && (
                                            <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-black">
                                                Il più prenotato
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-[13px] text-muted-foreground md:text-sm">
                                        {serviceMeta(service)}
                                    </span>
                                </span>
                                <span className="text-[15px] font-semibold whitespace-nowrap tabular-nums md:text-base">
                                    {servicePriceLabel(service)}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'flex size-5.5 shrink-0 items-center justify-center rounded-full border-2',
                                        selected
                                            ? 'border-brand'
                                            : 'border-field',
                                    )}
                                >
                                    {selected && (
                                        <span className="size-2.5 rounded-full bg-brand" />
                                    )}
                                </span>
                            </button>
                            {service.note && (
                                <p className="text-[15px] leading-5.5">
                                    {service.note.charAt(0).toUpperCase() +
                                        service.note.slice(1)}
                                </p>
                            )}
                            {service.included.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[13px] font-semibold tracking-[0.6px] text-muted-foreground uppercase">
                                        Cosa otterrai
                                    </span>
                                    <ul className="flex flex-col gap-2">
                                        {service.included.map((line) => (
                                            <li
                                                key={line}
                                                className="flex items-start gap-2.5 text-[15px] leading-5.25"
                                            >
                                                <Check
                                                    aria-hidden="true"
                                                    className="mt-0.5 size-4 shrink-0 text-brand"
                                                    strokeWidth={2.5}
                                                />
                                                {line}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

/**
 * "Giorno e ora": the duration, the month (the days with free times bright,
 * the full ones grey, the past ones faded, the closed ones crossed out), the
 * free times of the chosen day; then where and how many people when they
 * apply.
 */
export function DayTimeSection({
    booking,
    availability,
    waitlistDays,
    trainerFirstName,
}: {
    booking: TrainerBooking;
    /** The next weeks of the trainer (Rome days). */
    availability: AvailabilityDay[];
    /** The full days where the client asked "Avvisami se si libera". */
    waitlistDays: string[];
    trainerFirstName: string;
}) {
    const { minutes, date, start, service, people } = booking;
    const today = romeToday();
    const days = new Map(availability.map((day) => [day.date, day]));
    const first = availability[0]?.date ?? today;
    const last = availability[availability.length - 1]?.date ?? today;

    // The months from today to the last day the trainer can be booked.
    const [todayYear, todayMonth] = today.split('-').map(Number);
    const maxOffset = Math.max(0, monthsBetween(today, last));
    const [offset, setOffset] = useState(() =>
        Math.min(maxOffset, Math.max(0, monthsBetween(today, date ?? first))),
    );
    const { year, month } = shiftYearMonth(todayYear, todayMonth, offset);

    const chosenDay = date ? days.get(date) : undefined;
    const starts = chosenDay ? freeStarts(chosenDay, minutes) : [];
    // A day open but with nothing long enough: full, with "Avvisami".
    const full =
        chosenDay !== undefined && !chosenDay.closed && starts.length === 0;
    const waiting = date !== null && waitlistDays.includes(date);
    const hours = minutes / 60;

    return (
        <section
            id="giorno"
            aria-labelledby="day-title"
            className="flex scroll-mt-6 flex-col gap-5 md:gap-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <h2 id="day-title" className={sectionTitle}>
                    Giorno e ora
                </h2>
                {booking.durations.length > 1 && (
                    <label className="flex items-center gap-3 text-[15px] text-muted-foreground">
                        <span className="max-md:sr-only">Durata</span>
                        <span className="relative flex items-center">
                            <select
                                value={minutes}
                                onChange={(event) =>
                                    booking.changeMinutes(
                                        Number(event.target.value),
                                    )
                                }
                                className="h-11 appearance-none rounded-xl bg-card pr-10 pl-3.5 text-[17px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:pl-4 md:text-base"
                            >
                                {booking.durations.map((option) => (
                                    <option key={option} value={option}>
                                        {formatDuration(option)}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                aria-hidden="true"
                                className="pointer-events-none absolute right-3.5 size-4.5 text-muted-foreground"
                            />
                        </span>
                    </label>
                )}
            </div>

            <div className="flex flex-col gap-5 md:gap-7">
                <MonthCalendar
                    fill
                    year={year}
                    month={month}
                    today={today}
                    selected={date}
                    onSelect={booking.changeDate}
                    day={(day) => {
                        const info = days.get(day);

                        // Past days are only faded; the days the trainer
                        // does not work (or not bookable yet) crossed out.
                        if (day < today) {
                            return { disabled: true, past: true };
                        }

                        if (!info || info.closed) {
                            return {
                                disabled: true,
                                unavailable: true,
                                note: ', non disponibile',
                            };
                        }

                        return freeStarts(info, minutes).length > 0
                            ? { disabled: false, note: ', disponibile' }
                            : {
                                  disabled: false,
                                  dim: true,
                                  note: ', al completo',
                              };
                    }}
                    previous={{
                        disabled: offset === 0,
                        onClick: () => setOffset(offset - 1),
                    }}
                    next={{
                        disabled: offset >= maxOffset,
                        onClick: () => setOffset(offset + 1),
                    }}
                />

                <div className="flex flex-col gap-2.5 md:gap-3">
                    {date && (
                        <span className="text-[17px] font-semibold">
                            {formatDayLong(date)}
                        </span>
                    )}
                    {starts.length > 0 ? (
                        <div
                            role="group"
                            aria-label="Orari disponibili"
                            className="grid grid-cols-2 gap-2 md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]"
                        >
                            {starts.map((item) => (
                                <Choice
                                    key={item}
                                    pressed={item === start}
                                    onClick={() =>
                                        booking.setStart(
                                            item === start ? null : item,
                                        )
                                    }
                                    className="px-1.5"
                                >
                                    {formatTimeRange(item, hours)}
                                </Choice>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-start gap-3">
                            <p className="w-full rounded-[14px] bg-card px-4 py-3.5 text-[15px] text-muted-foreground">
                                {full
                                    ? 'Giornata al completo: scegli un altro giorno.'
                                    : `In questo giorno ${trainerFirstName} non è disponibile.`}
                            </p>
                            {full && date && (
                                <Choice
                                    pressed={waiting}
                                    onClick={() =>
                                        booking.toggleWaitlist(date, waiting)
                                    }
                                >
                                    {waiting
                                        ? 'Ti avvisiamo se si libera'
                                        : 'Avvisami se si libera'}
                                </Choice>
                            )}
                        </div>
                    )}
                </div>

                {/* With one place the server copies it: nothing to choose. */}
                {booking.inPersonPlaces.length > 1 && (
                    <fieldset className="flex min-w-0 flex-col gap-2.5">
                        <legend className="mb-2.5 text-[17px] font-semibold">
                            Dove
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {booking.inPersonPlaces.map((place) => (
                                <Choice
                                    key={place.id}
                                    pressed={booking.placeId === place.id}
                                    onClick={() =>
                                        booking.setPlaceId(
                                            booking.placeId === place.id
                                                ? null
                                                : place.id,
                                        )
                                    }
                                >
                                    {placeLabel(place)}
                                </Choice>
                            ))}
                        </div>
                    </fieldset>
                )}

                {service && booking.peopleMax > 1 && (
                    <fieldset className="flex min-w-0 flex-col">
                        <legend className="mb-2.5 text-[17px] font-semibold">
                            Quante persone?
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(
                                { length: booking.peopleMax },
                                (_, index) => index + 1,
                            ).map((count) => (
                                <Choice
                                    key={count}
                                    pressed={people === count}
                                    onClick={() => booking.setPeople(count)}
                                >
                                    {count === 1 ? 'Solo io' : count}
                                </Choice>
                            ))}
                        </div>
                        {people > 1 && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {perPersonLabel(
                                    totalPriceCents(service, minutes, people),
                                    people,
                                )}
                            </p>
                        )}
                    </fieldset>
                )}
            </div>
        </section>
    );
}

/** The price now: the chosen time's total, or the service's price. */
function priceNow(
    booking: TrainerBooking,
): { amount: string; unit: string } | null {
    const { service, start, minutes, people } = booking;

    if (!service) {
        return null;
    }

    return start || people > 1
        ? { amount: totalPriceLabel(service, minutes, people), unit: '' }
        : { amount: servicePriceLabel(service), unit: priceUnit(service) };
}

/** "Lun 23 nov · 07:00–08:00", or the hint. */
const whenLabel = (booking: TrainerBooking) =>
    booking.start
        ? `${formatDayShort(booking.start)} · ${formatTimeRange(booking.start, booking.minutes / 60)}`
        : 'Scegli giorno e ora';

/**
 * Phones: the bar that stays at the bottom (design V1): price, the chosen
 * time, "Scegli un orario" (to the calendar) or "Prenota".
 */
export function BookingBar({ booking }: { booking: TrainerBooking }) {
    const price = priceNow(booking);

    if (!booking.service) {
        return null;
    }

    return (
        <div className="sticky bottom-4 z-30 mx-3 mb-4 flex items-center gap-3 rounded-[22px] bg-background p-2.5 shadow-[inset_0_0_0_1px_#26282c,0_16px_48px_-8px_rgba(0,0,0,0.75)] md:hidden">
            <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-card text-brand"
            >
                <CalendarDays className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-px">
                {price && (
                    <span className="text-[17px] leading-5.5 font-bold whitespace-nowrap tabular-nums">
                        {price.amount}{' '}
                        <span className="text-[13px] font-normal text-muted-foreground">
                            {price.unit}
                        </span>
                    </span>
                )}
                <span
                    className={cn(
                        'truncate text-[13px] leading-4.5',
                        booking.start
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                    )}
                >
                    {whenLabel(booking)}
                </span>
            </span>
            {booking.start ? (
                <button
                    type="button"
                    disabled={booking.booking}
                    onClick={booking.bookSlot}
                    className="flex h-11 shrink-0 items-center gap-3 rounded-full bg-[linear-gradient(180deg,#6fe4e6_0%,#42d7d9_52%,#2fc4c6_100%)] pr-1.5 pl-5 text-[17px] font-semibold text-black shadow-[inset_0_1px_0_0_rgba(237,238,240,0.4),0_8px_24px_0_rgba(66,215,217,0.28)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70"
                >
                    Prenota
                    <span className="flex size-8 items-center justify-center rounded-full bg-black text-brand">
                        {booking.booking ? (
                            <Spinner className="size-4" />
                        ) : (
                            <ArrowUpRight
                                aria-hidden="true"
                                className="size-4.5"
                                strokeWidth={2.4}
                            />
                        )}
                    </span>
                </button>
            ) : (
                <a
                    href="#giorno"
                    className="flex h-11 shrink-0 items-center rounded-full bg-brand px-5 text-[17px] font-semibold whitespace-nowrap text-black outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Scegli un orario
                </a>
            )}
        </div>
    );
}

/**
 * Desktop, on the right (design "Riepilogo laterale"): the price, the
 * service, the day and the place, "Prenota" or "Scegli un orario".
 */
export function BookingAside({
    booking,
    online,
    notes,
    trainerFirstName,
}: {
    booking: TrainerBooking;
    online: 'also' | 'only' | null;
    /** "Risponde in genere entro 1 ora". */
    notes: (string | null)[];
    trainerFirstName: string;
}) {
    const { service } = booking;
    const price = priceNow(booking);

    if (!service) {
        return null;
    }

    const places = booking.inPersonPlaces;
    const chosenPlace = places.find((place) => place.id === booking.placeId);
    const where = chosenPlace
        ? placeLabel(chosenPlace)
        : places.length === 1
          ? placeLabel(places[0])
          : places.length === 0 && online
            ? 'Online'
            : 'Da scegliere';

    const row =
        'flex flex-col gap-0.5 px-4 py-3 outline-none not-last:border-b not-last:border-field hover:bg-foreground/4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';
    const rowTitle = 'text-[11px] font-bold tracking-[0.6px] uppercase';
    const rowValue = 'truncate text-[15px] text-muted-foreground';

    return (
        <aside
            aria-label={`Prenota con ${trainerFirstName}`}
            className="sticky top-6 hidden flex-col gap-4.5 rounded-[22px] bg-background p-6 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] md:flex"
        >
            {price && (
                <span className="text-[28px] leading-8.5 font-bold tabular-nums">
                    {price.amount}{' '}
                    <span className="text-[15px] font-normal text-muted-foreground">
                        {price.unit}
                    </span>
                </span>
            )}
            <div className="flex flex-col overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_var(--field)]">
                <a href="#servizi" className={row}>
                    <span className={rowTitle}>Servizio</span>
                    <span className={rowValue}>
                        {service.name}
                        {service.options.length > 1 &&
                            ` · ${formatDuration(booking.minutes)}`}
                    </span>
                </a>
                <a href="#giorno" className={row}>
                    <span className={rowTitle}>Giorno e ora</span>
                    <span
                        className={cn(
                            rowValue,
                            booking.start && 'text-foreground',
                        )}
                    >
                        {whenLabel(booking)}
                    </span>
                </a>
                <a href="#giorno" className={row}>
                    <span className={rowTitle}>Dove</span>
                    <span className={rowValue}>{where}</span>
                </a>
            </div>
            {booking.start ? (
                <button
                    type="button"
                    disabled={booking.booking}
                    onClick={booking.bookSlot}
                    className="flex h-13 items-center justify-center gap-2 rounded-full bg-brand text-[17px] font-semibold text-black outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70"
                >
                    {booking.booking && <Spinner />}
                    Prenota
                </button>
            ) : (
                <a
                    href="#giorno"
                    className="flex h-13 items-center justify-center rounded-full bg-brand text-[17px] font-semibold text-black outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                    Scegli un orario
                </a>
            )}
            {notes.some(Boolean) && (
                <ul className="flex flex-col gap-1 text-[13px] text-muted-foreground">
                    {notes.filter(Boolean).map((note) => (
                        <li key={note}>{note}</li>
                    ))}
                </ul>
            )}
        </aside>
    );
}
