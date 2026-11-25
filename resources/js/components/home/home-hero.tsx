import { Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { hoverPrefetch } from '@/lib/prefetch';
import { searchUrl } from '@/lib/search';

/**
 * The first screen of the home (design "Home F"): the big photo, the
 * headline and one button, "Cerca un trainer", that opens the search.
 */
export default function HomeHero() {
    return (
        <section
            aria-labelledby="hero-title"
            className="relative flex h-160 flex-col md:h-170"
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
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_20%,rgba(0,0,0,0)_48%,rgba(0,0,0,0.75)_78%,#000000_100%)]"
                />
            </div>

            <div className="relative mx-auto mt-auto flex w-full max-w-300 flex-col gap-5 px-4 pb-6 md:gap-8 md:px-8 md:pb-14">
                <h1
                    id="hero-title"
                    className="text-[clamp(2.375rem,1.6rem+3.2vw,3.5rem)] leading-[1.04] font-light tracking-[-0.05em]"
                >
                    <span className="block whitespace-nowrap">Trova il</span>
                    <b className="block font-bold whitespace-nowrap">
                        personal trainer
                    </b>
                    <span className="block whitespace-nowrap">
                        giusto, <b className="font-bold">vicino a te.</b>
                    </span>
                </h1>
                <Link
                    prefetch={hoverPrefetch}
                    href={searchUrl()}
                    className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-brand text-[17px] font-bold text-black shadow-[0_8px_24px_rgba(66,215,217,0.28)] outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:self-start md:px-9"
                >
                    <Search
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={2.4}
                    />
                    Cerca un trainer
                </Link>
            </div>
        </section>
    );
}
