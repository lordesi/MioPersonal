import { Head, Link } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import CategoryNav, { categoryOfSoon } from '@/components/mp/category-nav';
import type { ComingSoonKind } from '@/components/mp/category-nav';
import { hoverPrefetch } from '@/lib/prefetch';
import { searchUrl } from '@/lib/search';
import { home } from '@/routes';
import type { SeoData } from '@/types';

type ComingSoonProps = {
    kind: ComingSoonKind;
    seo: SeoData;
};

/**
 * "Palestre arrivano presto" (design "In arrivo"): a category of the search
 * switched off. Phones: the categories and the X on top, the two buttons at
 * the bottom; desktop: the header with the categories, all in the middle.
 */
export default function ComingSoon({ kind, seo }: ComingSoonProps) {
    const category = categoryOfSoon(kind);
    const Icon = category.icon;

    return (
        <>
            <Head title={seo.title} />

            {/* Phones: the categories instead of the header (desktop: in the header). */}
            <div className="md:hidden">
                <div className="flex items-start pt-5 pr-4 pl-2">
                    <CategoryNav current={category.value} className="flex-1" />
                    <Link
                        prefetch={hoverPrefetch}
                        href={home()}
                        aria-label="Chiudi"
                        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-card text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <X aria-hidden="true" className="size-5" />
                    </Link>
                </div>
                <div className="mx-4 h-px bg-separator" />
            </div>

            <div className="flex min-h-[calc(100svh-6.5rem)] flex-col px-4 pb-8.5 md:min-h-0 md:flex-1 md:items-center md:justify-center md:px-6 md:pt-42 md:pb-20">
                <div className="flex flex-col items-center px-2 pt-18 text-center md:max-w-160 md:p-0">
                    <span className="flex size-16 items-center justify-center rounded-[20px] bg-brand-soft text-brand md:size-18 md:rounded-[23px]">
                        <Icon
                            aria-hidden="true"
                            className="size-8 md:size-9"
                            strokeWidth={1.8}
                        />
                    </span>
                    <h1 className="mt-7 text-[40px] leading-[1.05] font-bold tracking-[-0.04em] md:text-[56px]">
                        {category.label} arrivano presto.
                    </h1>
                    <p className="mt-4 max-w-130 text-base leading-normal text-[#b4b8be] md:text-[17px]">
                        Per ora MioPersonal si impegna a portare nell’app più
                        personal trainer possibile.{' '}
                        <span className="mt-2.5 block md:mt-0 md:inline">
                            Stiamo lavorando per lanciare tutte le funzionalità
                            il prima possibile.
                        </span>
                    </p>
                </div>

                <div className="mt-auto flex flex-col gap-2.5 pt-10 md:mt-8 md:flex-row md:flex-wrap md:justify-center md:gap-3 md:pt-0">
                    <Link
                        prefetch={hoverPrefetch}
                        href={searchUrl()}
                        className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-brand px-6.5 text-[17px] font-bold text-black outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:h-13 md:text-base"
                    >
                        <Search
                            aria-hidden="true"
                            className="size-5"
                            strokeWidth={2.4}
                        />
                        Cerca un trainer
                    </Link>
                    <Link
                        prefetch={hoverPrefetch}
                        href={home()}
                        className="flex h-13 items-center justify-center rounded-full border border-white/30 px-6 text-base font-bold text-foreground outline-none hover:bg-foreground/8 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Torna alla home
                    </Link>
                </div>
            </div>
        </>
    );
}

ComingSoon.layout = { hideHeaderOnMobile: true };
