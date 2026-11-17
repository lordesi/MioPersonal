import { router } from '@inertiajs/react';
import { useState } from 'react';
import SegmentedControl from '@/components/mp/segmented-control';
import WhatWhereSearch from '@/components/mp/what-where-search';
import type { WhatWhereResult } from '@/components/mp/what-where-search';
import { searchKinds } from '@/components/search/search-kind-toggle';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import { courseSearchUrl } from '@/lib/course';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { search as eventsSearch } from '@/routes/events';
import type { CatalogOption, CityWithCoordinates } from '@/types';

type HomeHeroProps = {
    disciplines: CatalogOption[];
    cities: CityWithCoordinates[];
    /** "Cosa" of the gyms: the services. */
    amenities: CatalogOption[];
    /** "Cosa" of the events: the type. */
    eventTypes: CatalogOption[];
};

const kindOptions = searchKinds.map((kind) => ({
    value: kind.value,
    label: kind.shortLabel,
}));

const hints: Record<SearchKind, string> = {
    trainer: 'Per consultare i profili non occorre registrarsi',
    gym: 'Orari, abbonamenti, promozioni e i trainer che allenano lì',
    course: 'Gli orari della settimana delle palestre, con istruttori e posti',
    event: 'Prenoti il posto qui, paghi sul posto',
};

/**
 * The first screen of the home: the photo, the headline and the search of
 * the four kinds. Each kind sends to its own search page, "Cosa" filling
 * its own filter (discipline or name, service or name, discipline, type).
 */
export default function HomeHero({
    disciplines,
    cities,
    amenities,
    eventTypes,
}: HomeHeroProps) {
    const [kind, setKind] = useState<SearchKind>('trainer');

    const searches: Record<
        SearchKind,
        {
            placeholder: string;
            options: CatalogOption[];
            submitLabel: string;
            url: (result: WhatWhereResult) => string;
        }
    > = {
        trainer: {
            placeholder: 'Disciplina',
            options: disciplines,
            submitLabel: 'Cerca trainer',
            url: ({ what, words, city }) =>
                searchUrl(
                    { disciplina: what ? [what] : null, nome: words },
                    city,
                ),
        },
        gym: {
            placeholder: 'Servizio o nome della palestra',
            options: amenities,
            submitLabel: 'Cerca palestre',
            url: ({ what, words, city }) =>
                gymSearchUrl(
                    { servizi: what ? [what] : null, nome: words },
                    city,
                ),
        },
        course: {
            placeholder: 'Disciplina del corso',
            options: disciplines,
            submitLabel: 'Cerca corsi',
            url: ({ what, city }) =>
                courseSearchUrl({ disciplina: what }, city),
        },
        event: {
            placeholder: 'Tipo di evento',
            options: eventTypes,
            submitLabel: 'Cerca eventi',
            url: ({ what, city }) =>
                eventsSearch.url(city ? { city } : undefined, {
                    query: what ? { tipo: what } : {},
                }),
        },
    };
    const search = searches[kind];

    return (
        <section
            aria-labelledby="hero-title"
            className="relative h-205 md:h-200"
        >
            {/*
             * Only the photo is cut to the hero: the suggestions of "Cosa" and
             * "Dove" open under the fields, past the bottom of the hero.
             */}
            <div className="absolute inset-0 overflow-hidden">
                <picture>
                    <source
                        media="(min-width: 768px)"
                        srcSet="/images/design/home-hero-desktop.webp"
                    />
                    <img
                        src="/images/design/home-hero-mobile.webp"
                        alt="Atleta che spinge una slitta in palestra"
                        fetchPriority="high"
                        className="absolute -top-15 left-0 h-175 w-full object-cover object-[45%_0%] md:inset-0 md:h-full md:object-[50%_35%]"
                    />
                </picture>
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.55)_0%,rgba(10,10,10,0)_14%,rgba(10,10,10,0)_44%,rgba(10,10,10,0.85)_62%,#0a0a0a_76%)] md:bg-[linear-gradient(180deg,rgba(10,10,10,0.6)_0%,rgba(10,10,10,0.2)_25%,rgba(10,10,10,0.25)_50%,rgba(10,10,10,0.92)_82%)]"
                />
            </div>

            <div className="absolute inset-x-0 bottom-7 z-10 md:bottom-14">
                <div className="mx-auto flex max-w-300 flex-col gap-4 px-4 md:px-8">
                    <h1
                        id="hero-title"
                        className="text-[34px] leading-[1.12] font-light tracking-[-0.035em] text-balance md:mx-auto md:mb-17 md:max-w-187.5 md:text-center md:text-7xl md:leading-[1.05]"
                    >
                        Trova il{' '}
                        <strong className="font-bold">personal trainer</strong>{' '}
                        giusto,{' '}
                        <strong className="font-bold">vicino a te</strong>.
                    </h1>

                    <div className="flex flex-col gap-4 md:grid md:grid-cols-[400px_minmax(0,1fr)] md:items-center md:gap-3 md:border-t md:border-white/20 md:pt-7">
                        <SegmentedControl
                            label="Cosa cerchi"
                            options={kindOptions}
                            value={kind}
                            onValueChange={setKind}
                        />
                        <WhatWhereSearch
                            // A new kind starts with empty fields.
                            key={kind}
                            what={{
                                placeholder: search.placeholder,
                                options: search.options,
                            }}
                            cities={cities}
                            submitLabel={search.submitLabel}
                            layout="row"
                            onSearch={(result) =>
                                router.get(search.url(result))
                            }
                        />
                    </div>
                    <p className="-mt-1 text-center text-[13px] leading-4.5 text-muted-foreground md:mt-0.5">
                        {hints[kind]}
                    </p>
                </div>
            </div>
        </section>
    );
}
