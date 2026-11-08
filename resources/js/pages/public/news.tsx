import { Head, Link, router } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { EventGrid } from '@/components/events/event-card';
import { SaveableGymCard } from '@/components/gym/gym-card';
import { NewBadge, NewsTrainerCard } from '@/components/news/news-strip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { news } from '@/routes';
import type {
    GroupSessionSummary,
    GymSummary,
    SeoData,
    TrainerSummary,
} from '@/types';

type NewsProps = {
    seo: SeoData;
    city: { slug: string; name: string } | null;
    trainers: TrainerSummary[];
    gyms: GymSummary[];
    /** The events published lately, still to come. */
    events: GroupSessionSummary[];
    cities: { value: string; label: string }[];
    /** "Nuovo" for this many days. */
    days: number;
};

const ITALY = 'italia';

/** "Novità": the trainers and gyms that joined in the last days, in Italy or a city. */
export default function News({
    seo,
    city,
    trainers,
    gyms,
    events,
    cities,
    days,
}: NewsProps) {
    const place = city ? `a ${city.name}` : 'in Italia';

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 pb-12 md:gap-10 md:px-8 md:pt-12 md:pb-20">
            <Head title={seo.title} />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Sparkles aria-hidden="true" className="size-4" />
                        Ultimi {days} giorni
                    </span>
                    <h1 className="text-[32px] leading-9.5 font-bold tracking-tighter md:text-5xl md:leading-13">
                        Novità {place}
                    </h1>
                    <p className="max-w-150 text-muted-foreground">
                        I personal trainer e le palestre appena arrivati su
                        MioPersonal, verificati dal nostro team, e i nuovi
                        eventi in programma.
                    </p>
                </div>
                <Select
                    value={city?.slug ?? ITALY}
                    onValueChange={(value) =>
                        router.visit(
                            news.url(value === ITALY ? {} : { city: value }),
                        )
                    }
                >
                    <SelectTrigger aria-label="Città" className="h-11 w-56">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ITALY}>Tutta Italia</SelectItem>
                        {cities.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {trainers.length === 0 &&
                gyms.length === 0 &&
                events.length === 0 && (
                    <p className="rounded-2xl bg-muted px-4 py-3 text-sm">
                        Nessuna novità {place} negli ultimi {days} giorni.{' '}
                        <Link
                            href={searchUrl({}, city?.slug)}
                            className="font-medium underline underline-offset-4"
                        >
                            Cerca tra tutti i trainer
                        </Link>{' '}
                        o{' '}
                        <Link
                            href={gymSearchUrl({}, city?.slug)}
                            className="font-medium underline underline-offset-4"
                        >
                            le palestre
                        </Link>
                        .
                    </p>
                )}

            {trainers.length > 0 && (
                <section
                    aria-labelledby="new-trainers"
                    className="flex flex-col gap-4"
                >
                    <h2
                        id="new-trainers"
                        className="text-2xl font-semibold tracking-tight"
                    >
                        Nuovi trainer
                    </h2>
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 sm:gap-5">
                        {trainers.map((trainer) => (
                            <li key={trainer.slug} className="relative flex">
                                <NewBadge />
                                <NewsTrainerCard trainer={trainer} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {gyms.length > 0 && (
                <section
                    aria-labelledby="new-gyms"
                    className="flex flex-col gap-4"
                >
                    <h2
                        id="new-gyms"
                        className="text-2xl font-semibold tracking-tight"
                    >
                        Nuove palestre
                    </h2>
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 sm:gap-5">
                        {gyms.map((gym) => (
                            <li key={gym.slug} className="relative flex">
                                <NewBadge />
                                <SaveableGymCard gym={gym} className="flex-1" />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {events.length > 0 && (
                <section
                    aria-labelledby="new-events"
                    className="flex flex-col gap-4"
                >
                    <h2
                        id="new-events"
                        className="text-2xl font-semibold tracking-tight"
                    >
                        Nuovi eventi
                    </h2>
                    <EventGrid events={events} />
                </section>
            )}
        </div>
    );
}
