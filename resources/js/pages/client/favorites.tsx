import { Head, Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import FavoriteTrainerCard from '@/components/client/favorite-trainer-card';
import GymCard from '@/components/gym/gym-card';
import PageHeading from '@/components/trainer/area/page-heading';
import SegmentedTabs from '@/components/trainer/area/segmented-tabs';
import { Button } from '@/components/ui/button';
import type { FavoriteKind } from '@/hooks/use-favorite';
import { saveFavorite } from '@/hooks/use-favorite';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import type { GymSummary, TrainerSummary } from '@/types';

type Tab = 'trainers' | 'gyms';

type FavoritesProps = {
    trainers: TrainerSummary[];
    gyms: GymSummary[];
    /** Chosen by the server: ?tipo=palestre, or the tab with something in it. */
    tab: Tab;
};

const kindOf: Record<Tab, FavoriteKind> = { trainers: 'trainer', gyms: 'gym' };

export default function Favorites({
    trainers,
    gyms,
    tab: initialTab,
}: FavoritesProps) {
    const [tab, setTab] = useState<Tab>(initialTab);
    // Removed on this page: the card offers "Annulla" until the next visit.
    const [removed, setRemoved] = useState<Record<Tab, string[]>>({
        trainers: [],
        gyms: [],
    });

    const kept = {
        trainers: trainers.length - removed.trainers.length,
        gyms: gyms.length - removed.gyms.length,
    };

    const countLabel = [
        kept.trainers === 1 ? '1 trainer' : `${kept.trainers} trainer`,
        kept.gyms === 1 ? '1 palestra' : `${kept.gyms} palestre`,
    ].join(' e ');

    const markRemoved = (list: Tab, slug: string, isRemoved: boolean) =>
        setRemoved((current) => ({
            ...current,
            [list]: isRemoved
                ? [...current[list], slug]
                : current[list].filter((item) => item !== slug),
        }));

    const setRemovedFor = (list: Tab, slug: string, isRemoved: boolean) => {
        markRemoved(list, slug, isRemoved);
        // Removing deletes it on the server, "Annulla" saves it again.
        saveFavorite(
            slug,
            !isRemoved,
            () => markRemoved(list, slug, !isRemoved),
            kindOf[list],
        );
    };

    return (
        <>
            <Head title="Preferiti" />

            <PageHeading
                title="Preferiti"
                description={`Hai salvato ${countLabel}`}
            />

            <SegmentedTabs
                label="Tipo di preferiti"
                tabs={[
                    {
                        value: 'trainers',
                        label: 'Trainer',
                        count: kept.trainers,
                    },
                    { value: 'gyms', label: 'Palestre', count: kept.gyms },
                ]}
                value={tab}
                onChange={setTab}
                controls="favorites-list"
            />

            <div id="favorites-list" role="tabpanel">
                {tab === 'trainers' ? (
                    kept.trainers === 0 ? (
                        <EmptyState
                            title="Nessun trainer salvato"
                            href={searchUrl()}
                            action="Cerca un trainer"
                        />
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
                            {trainers.map((trainer) => (
                                <FavoriteTrainerCard
                                    key={trainer.slug}
                                    trainer={trainer}
                                    removed={removed.trainers.includes(
                                        trainer.slug,
                                    )}
                                    onRemovedChange={(isRemoved) =>
                                        setRemovedFor(
                                            'trainers',
                                            trainer.slug,
                                            isRemoved,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )
                ) : kept.gyms === 0 ? (
                    <EmptyState
                        title="Nessuna palestra salvata"
                        href={gymSearchUrl()}
                        action="Cerca una palestra"
                    />
                ) : (
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
                        {gyms.map((gym) => (
                            <li key={gym.slug} className="flex">
                                {removed.gyms.includes(gym.slug) ? (
                                    <div
                                        role="status"
                                        className="flex flex-1 items-center justify-between gap-2 self-start rounded-[20px] border bg-card p-4 text-sm"
                                    >
                                        <span>
                                            <strong>{gym.name}</strong> tolta
                                            dai preferiti
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-9"
                                            onClick={() =>
                                                setRemovedFor(
                                                    'gyms',
                                                    gym.slug,
                                                    false,
                                                )
                                            }
                                        >
                                            Annulla
                                        </Button>
                                    </div>
                                ) : (
                                    <GymCard
                                        gym={gym}
                                        className="flex-1"
                                        favorite={{
                                            pressed: true,
                                            onPressedChange: () =>
                                                setRemovedFor(
                                                    'gyms',
                                                    gym.slug,
                                                    true,
                                                ),
                                        }}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

type EmptyStateProps = {
    title: string;
    href: string;
    action: string;
};

function EmptyState({ title, href, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center gap-2.5 rounded-[20px] border border-dashed border-input bg-card px-4 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Heart aria-hidden="true" className="size-5" />
            </span>
            <strong className="text-lg">{title}</strong>
            <span className="max-w-90 text-sm text-muted-foreground">
                Tocca il cuore su un profilo o nei risultati della ricerca per
                ritrovarlo qui.
            </span>
            <Button asChild className="h-11 rounded-lg px-4.5">
                <Link href={href}>{action}</Link>
            </Button>
        </div>
    );
}

Favorites.layout = { section: 'favorites' };
