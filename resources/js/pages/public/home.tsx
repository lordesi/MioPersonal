import { Head } from '@inertiajs/react';
import HomeHero from '@/components/home/home-hero';
import HomeShelf from '@/components/home/home-shelf';
import ProCards from '@/components/home/pro-cards';
import { eventCard, gymCard } from '@/components/mp/cards';
import ProfileCard from '@/components/mp/profile-card';
import SaveableCard from '@/components/mp/saveable-card';
import TrainerCard from '@/components/mp/trainer-card';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { search as eventsSearch } from '@/routes/events';
import type {
    GroupSessionSummary,
    GymSummary,
    SeoData,
    TrainerSummary,
} from '@/types';

/** "In tendenza", or "in evidenza" while too few are trending (HomeController). */
type Shelf<T> = {
    key: 'trending' | 'featured';
    title: string;
    items: T[];
};

type HomeProps = {
    trainers: Shelf<TrainerSummary>;
    /** Hidden when empty. */
    gyms: Shelf<GymSummary>;
    /** "Prossimi eventi": hidden when empty. */
    events: GroupSessionSummary[];
    seo: SeoData;
};

/**
 * The home (design "Home F"): the photo with "Cerca un trainer", then the
 * trainers, the gyms and the events switched on, and the sign-ups for
 * professionals.
 */
export default function Home({ trainers, gyms, events, seo }: HomeProps) {
    return (
        <>
            <Head title={seo.title} />
            <HomeHero />
            <HomeShelf
                id={`${trainers.key}-trainers`}
                title={trainers.title}
                link={{ label: 'Vedi tutti', href: searchUrl() }}
                items={trainers.items}
                itemKey={(trainer) => trainer.slug}
            >
                {(trainer) => <TrainerCard trainer={trainer} />}
            </HomeShelf>
            <HomeShelf
                id={`${gyms.key}-gyms`}
                title={gyms.title}
                link={{ label: 'Vedi tutte', href: gymSearchUrl() }}
                items={gyms.items}
                itemKey={(gym) => gym.slug}
            >
                {(gym) => (
                    <SaveableCard
                        {...gymCard(gym)}
                        slug={gym.slug}
                        favoriteKind="gym"
                        saved={gym.favorite}
                    />
                )}
            </HomeShelf>
            <HomeShelf
                id="events-title"
                title="Prossimi eventi"
                link={{ label: 'Tutti gli eventi', href: eventsSearch.url() }}
                items={events}
                itemKey={(event) => event.slug}
            >
                {(event) => <ProfileCard {...eventCard(event)} />}
            </HomeShelf>
            <ProCards />
        </>
    );
}
