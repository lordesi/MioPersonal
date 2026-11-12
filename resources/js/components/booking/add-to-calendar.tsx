import { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { addHours } from '@/lib/format';
import { cn } from '@/lib/utils';
import { bookings as clientBookings } from '@/routes/client';
import type { SentBooking } from '@/types';

type CalendarId = 'google' | 'apple' | 'ics';

const calendars: { id: CalendarId; label: string }[] = [
    { id: 'google', label: 'Google Calendar' },
    { id: 'apple', label: 'Calendario Apple' },
    { id: 'ics', label: 'Scarica .ics' },
];

type AddToCalendarProps = {
    booking: SentBooking;
    className?: string;
};

/** The event of the session: the same text for Google and the .ics file. */
function calendarEvent(booking: SentBooking) {
    return {
        title: `Seduta con ${booking.trainer.name}`,
        start: booking.start,
        end: addHours(booking.start, booking.hours),
        place: booking.placeLabel,
        details: `${booking.serviceName}. Prenotazione e contatti del trainer: ${window.location.origin}${clientBookings.url()}`,
    };
}

/** ISO UTC → "20261104T170000Z", the format of Google Calendar and .ics files. */
function calendarTime(iso: string): string {
    return new Date(iso)
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d+/, '');
}

function googleUrl(booking: SentBooking): string {
    const event = calendarEvent(booking);
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${calendarTime(event.start)}/${calendarTime(event.end)}`,
        details: event.details,
        location: event.place,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Commas, semicolons, backslashes and new lines are escaped in .ics text. */
function icsText(text: string): string {
    return text.replace(/[\\;,]/g, (char) => `\\${char}`).replace(/\n/g, '\\n');
}

/** A .ics file with the session: the iPhone opens it in Calendario. */
function downloadIcs(booking: SentBooking) {
    const event = calendarEvent(booking);
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MioPersonal//Prenotazioni//IT',
        'BEGIN:VEVENT',
        `UID:prenotazione-${booking.id}@miopersonal.it`,
        `DTSTAMP:${calendarTime(new Date().toISOString())}`,
        `DTSTART:${calendarTime(event.start)}`,
        `DTEND:${calendarTime(event.end)}`,
        `SUMMARY:${icsText(event.title)}`,
        `DESCRIPTION:${icsText(event.details)}`,
        `LOCATION:${icsText(event.place)}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ];
    const url = URL.createObjectURL(
        new Blob([lines.join('\r\n')], { type: 'text/calendar' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'seduta-miopersonal.ics';
    link.click();
    URL.revokeObjectURL(url);
}

/** "Aggiungi al tuo calendario": Google, Apple or an .ics file. */
export default function AddToCalendar({
    booking,
    className,
}: AddToCalendarProps) {
    const [chosen, setChosen] = useState<CalendarId | null>(null);

    const add = (id: CalendarId) => {
        setChosen(id);

        if (id === 'google') {
            window.open(googleUrl(booking), '_blank', 'noopener');
        } else {
            downloadIcs(booking);
        }
    };

    return (
        <section
            aria-labelledby="aggiungi-calendario"
            className={cn(
                'flex flex-col gap-2.5 rounded-[14px] border bg-card p-4',
                className,
            )}
        >
            <h2 id="aggiungi-calendario" className="text-sm font-semibold">
                Aggiungi al tuo calendario
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-2">
                {calendars.map((calendar) => (
                    <Toggle
                        key={calendar.id}
                        variant="outline"
                        pressed={chosen === calendar.id}
                        onPressedChange={() => add(calendar.id)}
                        className="h-11 rounded-[10px] bg-background px-3 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                        {chosen === calendar.id && '✓ '}
                        {calendar.label}
                    </Toggle>
                ))}
            </div>
            {chosen && (
                // The event is a copy: it doesn't follow later changes.
                <p
                    role="status"
                    className="text-[13px] leading-[18px] text-muted-foreground"
                >
                    Evento creato. Se {booking.trainer.firstName} sposta o
                    annulla, lo vedi in «Le mie prenotazioni».
                </p>
            )}
        </section>
    );
}
