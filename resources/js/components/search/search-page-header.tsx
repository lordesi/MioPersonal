import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import {
    SearchKindLinks,
    searchKindUrl,
    searchKinds,
} from '@/components/search/search-kind-toggle';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { home } from '@/routes';

/** Light links on the dark block. */
const crumbLink = 'text-primary-foreground/60 hover:text-primary-foreground';

type SearchPageHeaderProps = {
    kind: SearchKind;
    city: { slug: string; name: string } | null;
    /** "Personal trainer a Milano" */
    title: string;
    /** "12 trainer disponibili" */
    count: string;
    /** A few lines under the count (the indexed pages). */
    intro?: string | null;
    /** The search bar or the main filters. */
    children?: ReactNode;
};

/**
 * The dark block on top of the four searches (trainer, palestre, corsi,
 * eventi): breadcrumb, "Cosa cerchi" in the same city, title and count.
 */
export default function SearchPageHeader({
    kind,
    city,
    title,
    count,
    intro,
    children,
}: SearchPageHeaderProps) {
    const label = searchKinds.find((item) => item.value === kind)?.label;

    return (
        <section
            aria-labelledby="search-title"
            className="bg-primary text-primary-foreground"
        >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pt-5 pb-8 md:gap-5.5 md:px-8 md:pt-6 md:pb-10">
                <Breadcrumb aria-label="Percorso" className="hidden sm:block">
                    <BreadcrumbList className="gap-2 text-[13px] leading-[18px] text-primary-foreground/60 sm:gap-2">
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild className={crumbLink}>
                                <Link href={home()}>Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        {city ? (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        asChild
                                        className={crumbLink}
                                    >
                                        <Link href={searchKindUrl(kind)}>
                                            {label}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-primary-foreground">
                                        {city.name}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </>
                        ) : (
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-primary-foreground">
                                    {label}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        )}
                    </BreadcrumbList>
                </Breadcrumb>

                <SearchKindLinks current={kind} city={city?.slug ?? null} />

                <div className="flex flex-col gap-1.5">
                    <h1
                        id="search-title"
                        className="text-[30px] leading-9 font-bold tracking-[-0.03em] md:text-[44px] md:leading-12"
                    >
                        {title}
                    </h1>
                    <p
                        aria-live="polite"
                        className="text-base text-primary-foreground/60 tabular-nums"
                    >
                        {count}
                    </p>
                    {intro && (
                        <p className="mt-1 max-w-3xl text-[15px] leading-6 text-primary-foreground/75">
                            {intro}
                        </p>
                    )}
                </div>

                {children}
            </div>
        </section>
    );
}
