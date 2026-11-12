import { Link } from '@inertiajs/react';
import { MessageSquareQuote } from 'lucide-react';
import { formatAgo } from '@/lib/format';
import type { TrainerNote } from '@/types';

/**
 * "Nota per il cliente": what the client's trainers wrote for them, on top
 * of "Panoramica", the most recent first. One way only: no chat.
 */
export default function TrainerNotes({
    notes,
    now,
}: {
    notes: TrainerNote[];
    now: Date;
}) {
    return (
        <section
            aria-label="Note dei tuoi trainer"
            className="flex flex-col gap-3"
        >
            {notes.map((note) => (
                <figure
                    key={note.id}
                    className="flex gap-3.5 rounded-[20px] border bg-card p-5"
                >
                    <span className="flex size-10 flex-none items-center justify-center rounded-full bg-secondary">
                        <MessageSquareQuote
                            aria-hidden="true"
                            className="size-4.5"
                        />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                        <figcaption className="text-[13px] leading-4.5 text-muted-foreground">
                            Da{' '}
                            <Link
                                href={note.trainerHref}
                                className="font-semibold text-foreground hover:underline"
                            >
                                {note.trainerName}
                            </Link>{' '}
                            · {formatAgo(note.at, now)}
                        </figcaption>
                        <blockquote className="text-[15px] leading-5.5 whitespace-pre-line">
                            {note.note}
                        </blockquote>
                    </div>
                </figure>
            ))}
        </section>
    );
}
