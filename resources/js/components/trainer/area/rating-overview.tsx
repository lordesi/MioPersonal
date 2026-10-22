import { useId } from 'react';
import StarRating from '@/components/trainer/star-rating';
import { formatRating } from '@/lib/format';

type RatingOverviewProps = {
    average: number;
    count: number;
    /** The stars of every visible review, to draw the bars 5 → 1. */
    ratings: number[];
    /** Every review was left after a booked session. */
    allFromSession: boolean;
};

/**
 * The black "LA TUA MEDIA" of "Recensioni" (docs/design): the average, how
 * many reviews and how many of each star.
 */
export default function RatingOverview({
    average,
    count,
    ratings,
    allFromSession,
}: RatingOverviewProps) {
    const titleId = useId();
    const rows = [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: ratings.filter((rating) => rating === stars).length,
    }));
    const total = Math.max(1, ratings.length);

    return (
        <aside
            aria-labelledby={titleId}
            className="flex flex-[2_1_300px] flex-col gap-4.5 rounded-3xl bg-sidebar p-5.5 text-sidebar-foreground"
        >
            <div className="flex flex-col gap-1.5">
                <h2
                    id={titleId}
                    className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground"
                >
                    LA TUA MEDIA
                </h2>
                <div className="flex items-baseline gap-2.5">
                    <span className="text-[52px] leading-14 font-bold tracking-[-0.04em] tabular-nums">
                        {formatRating(average)}
                    </span>
                    <span className="text-sm text-sidebar-muted-foreground">
                        su 5
                    </span>
                </div>
                <StarRating value={Math.round(average)} size="lg" />
                <span className="text-sm text-sidebar-foreground/80 tabular-nums">
                    {count === 1 ? '1 recensione' : `${count} recensioni`}
                    {allFromSession && ' · tutte da sedute svolte'}
                </span>
            </div>

            <div
                role="img"
                aria-label={`Distribuzione: ${rows.map((row) => `${row.stars} ${row.stars === 1 ? 'stella' : 'stelle'} ${row.count}`).join(', ')}`}
                className="flex flex-col gap-2"
            >
                {rows.map((row) => (
                    <div key={row.stars} className="flex items-center gap-2.5">
                        <span className="w-3.5 text-[13px] leading-4.5 font-semibold text-sidebar-foreground/80 tabular-nums">
                            {row.stars}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-sidebar-border">
                            <span
                                className="block h-full rounded-full bg-sidebar-primary"
                                style={{
                                    width: `${(row.count / total) * 100}%`,
                                }}
                            />
                        </span>
                        <span className="w-3.5 text-right text-[13px] leading-4.5 text-sidebar-muted-foreground tabular-nums">
                            {row.count}
                        </span>
                    </div>
                ))}
            </div>
        </aside>
    );
}
