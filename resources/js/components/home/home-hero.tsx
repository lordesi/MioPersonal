import { Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { Fragment } from 'react';
import { hoverPrefetch } from '@/lib/prefetch';
import { searchUrl } from '@/lib/search';

/** The parts of the desktop search bar: each one opens the search. */
const searchParts = [
    { label: 'COSA', hint: 'Disciplina o obiettivo' },
    { label: 'DOVE', hint: 'Città, zona' },
    { label: 'MODALITÀ', hint: 'Dal vivo o online' },
];

/**
 * The first screen of the home (design "Home F"): the big photo and the
 * headline; on phones one button, "Cerca un trainer", on desktop the bar
 * "Cosa · Dove · Modalità · Cerca" (design "Home · desktop"). Both open the
 * search.
 */
export default function HomeHero() {
    return (
        <section
            aria-labelledby="hero-title"
            className="relative flex h-160 flex-col md:h-195"
        >
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
                        className="size-full object-cover object-[45%_40%] md:object-[50%_35%]"
                    />
                </picture>
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_20%,rgba(0,0,0,0)_48%,rgba(0,0,0,0.75)_78%,#000000_100%)] md:bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0)_22%,rgba(0,0,0,0.1)_45%,rgba(0,0,0,0.8)_80%,#000000_100%),linear-gradient(90deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_55%)]"
                />
            </div>

            <div className="relative mx-auto mt-auto w-full max-w-300 px-4 pb-6 md:px-8 md:pb-16">
                <div className="flex flex-col gap-5 md:w-max md:max-w-full md:gap-8">
                    <h1
                        id="hero-title"
                        className="text-[clamp(2.375rem,1.6rem+3.2vw,3.5rem)] leading-[1.04] font-light tracking-[-0.05em] md:text-[clamp(3.5rem,1rem+4.4vw,4.75rem)] md:leading-none"
                    >
                        {/* Phones: three lines; desktop: two ("Trova il personal / trainer giusto…"). */}
                        <span className="block whitespace-nowrap md:inline">
                            Trova il{' '}
                        </span>
                        <b className="block font-bold whitespace-nowrap md:inline">
                            personal
                            <br className="max-md:hidden" /> trainer
                        </b>
                        <span className="block whitespace-nowrap md:inline">
                            {' '}
                            giusto, <b className="font-bold">vicino a te.</b>
                        </span>
                    </h1>
                    <div
                        role="search"
                        className="hidden items-center rounded-full bg-[rgba(18,19,21,0.86)] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl md:flex"
                    >
                        {searchParts.map((part, index) => (
                            <Fragment key={part.label}>
                                {index > 0 && (
                                    <span
                                        aria-hidden="true"
                                        className="h-8 w-px shrink-0 bg-foreground/12"
                                    />
                                )}
                                <Link
                                    prefetch={hoverPrefetch}
                                    href={searchUrl()}
                                    className="flex min-w-0 flex-1 flex-col gap-0.75 rounded-full px-6 py-3 text-foreground outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <span className="text-xs font-bold tracking-[0.08em]">
                                        {part.label}
                                    </span>
                                    <span className="truncate text-base text-muted-foreground">
                                        {part.hint}
                                    </span>
                                </Link>
                            </Fragment>
                        ))}
                        <Link
                            prefetch={hoverPrefetch}
                            href={searchUrl()}
                            className="flex h-15 shrink-0 items-center gap-2.5 rounded-full bg-brand px-7 text-[17px] font-bold text-black shadow-[0_8px_24px_rgba(66,215,217,0.28)] outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            <Search
                                aria-hidden="true"
                                className="size-5"
                                strokeWidth={2.4}
                            />
                            Cerca
                        </Link>
                    </div>
                    <Link
                        prefetch={hoverPrefetch}
                        href={searchUrl()}
                        className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-brand text-[17px] font-bold text-black shadow-[0_8px_24px_rgba(66,215,217,0.28)] outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
                    >
                        <Search
                            aria-hidden="true"
                            className="size-5"
                            strokeWidth={2.4}
                        />
                        Cerca un trainer
                    </Link>
                </div>
            </div>
        </section>
    );
}
