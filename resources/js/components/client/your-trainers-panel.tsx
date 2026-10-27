import { Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import Panel from '@/components/trainer/area/panel';
import { saveFavorite } from '@/hooks/use-favorite';
import { cn } from '@/lib/utils';
import type { ClientTrainer } from '@/types';

type YourTrainersPanelProps = {
    trainers: ClientTrainer[];
    /** "Cerca altri": the search in the client's city. */
    searchHref: string;
};

/**
 * "I tuoi trainer": the ones already booked (the trainer of the last session
 * first, "Il tuo trainer") and the favorites, each with "Prenota". The heart
 * saves or removes a favorite right here.
 */
export default function YourTrainersPanel({
    trainers,
    searchHref,
}: YourTrainersPanelProps) {
    return (
        <Panel
            title="I tuoi trainer"
            className="gap-1.5 rounded-3xl"
            action={
                <Link
                    href={searchHref}
                    className="text-[13px] leading-4.5 font-semibold hover:underline"
                >
                    Cerca altri
                </Link>
            }
        >
            <ul className="flex flex-col pt-1.5">
                {trainers.map((trainer, index) => (
                    <TrainerItem
                        key={trainer.href}
                        trainer={trainer}
                        mine={index === 0 && trainer.booked}
                    />
                ))}
            </ul>
        </Panel>
    );
}

function TrainerItem({
    trainer,
    mine,
}: {
    trainer: ClientTrainer;
    /** The trainer of the last session: badge, black avatar, no heart. */
    mine: boolean;
}) {
    const [favorite, setFavorite] = useState(trainer.favorite);
    const detail = subtitle(trainer);

    const toggleFavorite = () => {
        const next = !favorite;

        setFavorite(next);
        saveFavorite(trainer.slug, next, () => setFavorite(!next));
    };

    return (
        <li className="flex items-center gap-3 border-t border-border/70 py-3.5">
            <UserAvatar
                name={trainer.name}
                size="lg"
                className={cn(
                    'size-10.5 text-[13px]',
                    mine
                        ? '[&_[data-slot=avatar-fallback]]:bg-primary [&_[data-slot=avatar-fallback]]:text-primary-foreground'
                        : '[&_[data-slot=avatar-fallback]]:bg-secondary',
                )}
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-1.5">
                    <Link
                        href={trainer.href}
                        className="truncate text-[15px] leading-5.5 font-semibold hover:underline"
                    >
                        {trainer.name}
                    </Link>
                    {mine && (
                        <span className="inline-flex h-5 flex-none items-center rounded-full bg-primary px-1.75 text-[10px] leading-3 font-bold text-primary-foreground">
                            Il tuo trainer
                        </span>
                    )}
                </span>
                {detail && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {detail}
                    </span>
                )}
            </span>
            {!mine && (
                <button
                    type="button"
                    aria-pressed={favorite}
                    aria-label={
                        favorite
                            ? `Togli ${trainer.name} dai preferiti`
                            : `Aggiungi ${trainer.name} ai preferiti`
                    }
                    onClick={toggleFavorite}
                    className="flex size-9 flex-none items-center justify-center rounded-full hover:bg-accent"
                >
                    <Heart
                        aria-hidden="true"
                        className={cn('size-4.25', favorite && 'fill-current')}
                    />
                </button>
            )}
            <Link
                href={trainer.href}
                aria-label={`Prenota con ${trainer.name}`}
                className="inline-flex h-9 flex-none items-center rounded-[10px] border border-input bg-card px-3 text-[13px] font-semibold hover:bg-accent"
            >
                Prenota
            </Link>
        </li>
    );
}

/**
 * "Bodybuilding · 5 sedute insieme" for the trainers already met, nothing
 * for the favorites never booked.
 */
function subtitle(trainer: ClientTrainer): string | null {
    if (trainer.booked && trainer.sessionsDone > 0) {
        const together =
            trainer.sessionsDone === 1
                ? '1 seduta insieme'
                : `${trainer.sessionsDone} sedute insieme`;

        return trainer.discipline
            ? `${trainer.discipline} · ${together}`
            : together;
    }

    // Booked, but the first session is still to come.
    return trainer.booked ? trainer.discipline : null;
}
