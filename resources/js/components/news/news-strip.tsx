import { Link } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import EventCard from '@/components/events/event-card';
import { SaveableGymCard } from '@/components/gym/gym-card';
import TrainerCard from '@/components/trainer/trainer-card';
import { useFavorite } from '@/hooks/use-favorite';
import { cn } from '@/lib/utils';
import { news as newsPage } from '@/routes';
import type { NewsPreview, TrainerSummary } from '@/types';

type NewsStripProps = {
    news: NewsPreview;
    /** home: a section of the home with its own margins; inline: inside a page. */
    variant?: 'home' | 'inline';
    className?: string;
};

/**
 * "Novità": a row of the newest trainers, gyms and events (NewsFeed::preview) with
 * a link to /novita. Hidden when there is nothing new.
 */
export default function NewsStrip({
    news,
    variant = 'inline',
    className,
}: NewsStripProps) {
    const items = news.trainers.length + news.gyms.length + news.events.length;

    if (items === 0) {
        return null;
    }

    const place = news.city ? `a ${news.city.name}` : 'su MioPersonal';
    const href = newsPage.url(news.city ? { city: news.city.slug } : {});

    return (
        <section
            aria-labelledby="news-title"
            className={cn(
                'flex flex-col gap-4',
                variant === 'home' &&
                    'mx-auto w-full max-w-7xl px-4 pb-10 md:gap-6 md:px-8 md:pb-18',
                className,
            )}
        >
            <div className="flex flex-wrap items-end justify-between gap-3">
                <h2
                    id="news-title"
                    className={cn(
                        'flex items-center gap-2 font-semibold tracking-tight',
                        variant === 'home'
                            ? 'text-2xl md:text-3xl'
                            : 'text-lg md:text-xl',
                    )}
                >
                    <Sparkles aria-hidden="true" className="size-5" />
                    Novità {place}
                </h2>
                <Link
                    href={href}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-medium md:min-h-0"
                >
                    Vedi tutte le novità
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </div>

            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 sm:gap-5">
                {news.trainers.map((trainer) => (
                    <li key={`t-${trainer.slug}`} className="relative flex">
                        <NewBadge />
                        <NewsTrainerCard trainer={trainer} />
                    </li>
                ))}
                {news.gyms.map((gym) => (
                    <li key={`g-${gym.slug}`} className="relative flex">
                        <NewBadge />
                        <SaveableGymCard gym={gym} className="flex-1" />
                    </li>
                ))}
                {news.events.map((event) => (
                    <li key={`e-${event.id}`} className="flex">
                        <EventCard event={event} className="flex-1" />
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** "Nuovo" on the corner of a card. */
export function NewBadge() {
    return (
        <span className="pointer-events-none absolute top-3 left-3 z-10 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow">
            Nuovo
        </span>
    );
}

/** A trainer card with its own heart, as in the search. */
export function NewsTrainerCard({ trainer }: { trainer: TrainerSummary }) {
    const favorite = useFavorite(trainer.slug, trainer.favorite ?? false);

    return (
        <TrainerCard
            trainer={trainer}
            favorite={
                favorite.canSave
                    ? {
                          pressed: favorite.pressed,
                          onPressedChange: favorite.change,
                      }
                    : undefined
            }
            className="flex-1"
        />
    );
}
