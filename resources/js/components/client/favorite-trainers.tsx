import { Link } from '@inertiajs/react';
import UserAvatar from '@/components/shared/user-avatar';
import { formatRelativeSlot } from '@/lib/format';
import type { FavoriteTrainer } from '@/types';

type FavoriteTrainersProps = {
    trainers: FavoriteTrainer[];
};

/** Horizontal row of favorite trainers with their first free slot. */
export default function FavoriteTrainers({ trainers }: FavoriteTrainersProps) {
    return (
        <div className="flex gap-2 overflow-x-auto">
            {trainers.map((trainer) => (
                <Link
                    key={trainer.href}
                    href={trainer.href}
                    className="flex flex-none items-center gap-2.5 rounded-full border bg-card py-2.5 pr-3.5 pl-2.5 hover:bg-accent"
                >
                    <UserAvatar name={trainer.name} />
                    <span className="flex flex-col">
                        <span className="text-sm font-semibold">
                            {trainer.name}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            Primo slot:{' '}
                            {formatRelativeSlot(trainer.nextSlotStart)}
                        </span>
                    </span>
                </Link>
            ))}
        </div>
    );
}
