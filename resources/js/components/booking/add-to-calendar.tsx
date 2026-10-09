import { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

const calendars = [
    { id: 'google', label: 'Google Calendar' },
    { id: 'apple', label: 'Calendario Apple' },
    { id: 'ics', label: 'Scarica .ics' },
];

type AddToCalendarProps = {
    trainerFirstName: string;
    className?: string;
};

/** "Aggiungi al tuo calendario": Google, Apple or an .ics file. */
export default function AddToCalendar({
    trainerFirstName,
    className,
}: AddToCalendarProps) {
    // TODO: generate the calendar links and the .ics file; today it only marks the choice.
    const [chosen, setChosen] = useState<string | null>(null);

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
                        onPressedChange={() => setChosen(calendar.id)}
                        className="h-11 rounded-[10px] bg-background px-3 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                        {chosen === calendar.id && '✓ '}
                        {calendar.label}
                    </Toggle>
                ))}
            </div>
            {chosen && (
                <p
                    role="status"
                    className="text-[13px] leading-[18px] text-muted-foreground"
                >
                    Aggiunta. Se {trainerFirstName} sposta o annulla,
                    aggiorniamo l'evento noi.
                </p>
            )}
        </section>
    );
}
