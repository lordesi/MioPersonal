import { Link } from '@inertiajs/react';
import type { RouteDefinition } from '@/wayfinder';

type SearchNoticeProps = {
    /** What was searched in the box at the top: "anna", "#1048". */
    text: string;
    /** The same page without the search. */
    clearHref: RouteDefinition<'get'>;
};

/** "Risultati per «anna» · Mostra tutti", above a list filtered by the admin search box. */
export default function SearchNotice({ text, clearHref }: SearchNoticeProps) {
    return (
        <p className="text-sm text-muted-foreground">
            Risultati per «
            <span className="font-semibold text-foreground">{text}</span>» ·{' '}
            <Link
                href={clearHref}
                className="font-semibold text-foreground underline underline-offset-2"
            >
                Mostra tutti
            </Link>
        </p>
    );
}
