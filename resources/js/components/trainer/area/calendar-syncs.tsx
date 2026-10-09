import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalendarSync } from '@/types';

type CalendarSyncsProps = {
    syncs: CalendarSync[];
    onToggle: (id: CalendarSync['id']) => void;
    className?: string;
};

/** Google and Apple calendars: their appointments block the free slots. */
export default function CalendarSyncs({
    syncs,
    onToggle,
    className,
}: CalendarSyncsProps) {
    return (
        <section
            aria-label="Calendari collegati"
            className={cn(
                'grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-2.5',
                className,
            )}
        >
            {syncs.map((sync) => (
                <div
                    key={sync.id}
                    className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3"
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'size-2.5 flex-none rounded-full',
                            sync.connected
                                ? 'bg-foreground'
                                : 'border-[1.5px] border-muted-foreground',
                        )}
                    />
                    <span className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold">
                            {sync.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {sync.connected ? sync.status : 'Non collegato'}
                        </span>
                    </span>
                    {/* TODO: real OAuth / iCloud link once the sync exists. */}
                    <Button
                        type="button"
                        variant={sync.connected ? 'outline' : 'default'}
                        aria-pressed={sync.connected}
                        className="ml-auto"
                        onClick={() => onToggle(sync.id)}
                    >
                        {sync.connected ? 'Scollega' : 'Collega'}
                    </Button>
                </div>
            ))}
        </section>
    );
}
