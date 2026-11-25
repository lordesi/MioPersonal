import { Head, Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import GymCard from '@/components/gym/gym-card';
import {
    areaButtonClassName,
    areaTitleClassName,
    carbCardClassName,
} from '@/components/mp/area-bits';
import TrainerCard from '@/components/mp/trainer-card';
import SegmentedTabs from '@/components/trainer/area/segmented-tabs';
import { Button } from '@/components/ui/button';
import type { FavoriteKind } from '@/hooks/use-favorite';
import { saveFavorite } from '@/hooks/use-favorite';
import { useFeatures } from '@/lib/features';
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

    // Without the gyms (switched off, lib/features.ts): the trainers only, no tabs.
    const withGyms = useFeatures().gyms;
    const countLabel = [
        kept.trainers === 1 ? '1 trainer' : `${kept.trainers} trainer`,
        ...(withGyms
            ? [kept.gyms === 1 ? '1 palestra' : `${kept.gyms} palestre`]
            : []),
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

            <header className="flex flex-col gap-1">
                <h1 className={areaTitleClassName}>Preferiti</h1>
                <p className="text-[15px] leading-5 text-muted-foreground md:text-[17px]">
                    {countLabel}{' '}
                    {kept.trainers + kept.gyms === 1 ? 'salvato' : 'salvati'}
                </p>
            </header>

            {withGyms && (
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
            )}

            <div id="favorites-list" role={withGyms ? 'tabpanel' : undefined}>
                {tab === 'trainers' ? (
                    kept.trainers === 0 ? (
                        <EmptyState
                            title="Nessun trainer salvato"
                            href={searchUrl()}
                            action="Cerca un trainer"
                        />
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-7">
                                {trainers.map((trainer) => (
                                    <TrainerCard
                                        key={trainer.slug}
                                        trainer={{ ...trainer, favorite: true }}
                                        size="sm"
                                    />
                                ))}
                            </div>
                            <p className="text-[13px] leading-4.5 text-muted-foreground">
                                Tocca il cuore su un profilo o nei risultati
                                della ricerca per salvarlo qui.
                            </p>
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
        <div
            className={`${carbCardClassName} flex flex-col items-center gap-3 p-6 text-center`}
        >
            <span className="flex size-13 items-center justify-center rounded-full bg-[#1c1e21] text-muted-foreground">
                <Heart aria-hidden="true" className="size-6" />
            </span>
            <strong className="text-[17px] font-semibold">{title}</strong>
            <span className="max-w-90 text-[15px] leading-5 text-muted-foreground">
                Tocca il cuore su un profilo o nei risultati della ricerca per
                ritrovarlo qui.
            </span>
            <Link
                href={href}
                className={`${areaButtonClassName('primary', 'md')} mt-1`}
            >
                {action}
            </Link>
        </div>
    );
}

Favorites.layout = { section: 'favorites' };
