import { Head, Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import FavoriteTrainerCard from '@/components/client/favorite-trainer-card';
import { Button } from '@/components/ui/button';
import { saveFavorite } from '@/hooks/use-favorite';
import { searchUrl } from '@/lib/search';
import type { TrainerSummary } from '@/types';

type FavoritesProps = {
    trainers: TrainerSummary[];
};

export default function Favorites({ trainers }: FavoritesProps) {
    // Removed on this page: the card offers "Annulla" until the next visit.
    const [removed, setRemoved] = useState<string[]>([]);

    const kept = trainers.length - removed.length;
    const allRemoved = kept === 0;
    const countLabel =
        kept === 1 ? '1 trainer salvato' : `${kept} trainer salvati`;

    const markRemoved = (slug: string, isRemoved: boolean) =>
        setRemoved((current) =>
            isRemoved
                ? [...current, slug]
                : current.filter((item) => item !== slug),
        );

    const setRemovedFor = (slug: string, isRemoved: boolean) => {
        markRemoved(slug, isRemoved);
        // Removing deletes it on the server, "Annulla" saves it again.
        saveFavorite(slug, !isRemoved, () => markRemoved(slug, !isRemoved));
    };

    return (
        <>
            <Head title="Preferiti" />

            <div className="flex flex-col gap-1">
                <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-4xl md:leading-10">
                    Preferiti
                </h1>
                <p className="text-muted-foreground tabular-nums">
                    {countLabel}
                </p>
            </div>

            {allRemoved ? (
                <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-input px-4 py-12 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <Heart aria-hidden="true" className="size-5" />
                    </span>
                    <strong className="text-lg">Nessun trainer salvato</strong>
                    <span className="max-w-90 text-sm text-muted-foreground">
                        Tocca il cuore su un profilo o nei risultati della
                        ricerca per ritrovarlo qui.
                    </span>
                    <Button asChild className="h-11 rounded-lg px-4.5">
                        <Link href={searchUrl()}>Cerca un trainer</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
                    {trainers.map((trainer) => (
                        <FavoriteTrainerCard
                            key={trainer.slug}
                            trainer={trainer}
                            removed={removed.includes(trainer.slug)}
                            onRemovedChange={(isRemoved) =>
                                setRemovedFor(trainer.slug, isRemoved)
                            }
                        />
                    ))}
                </div>
            )}
        </>
    );
}

Favorites.layout = { section: 'favorites', wide: true };
