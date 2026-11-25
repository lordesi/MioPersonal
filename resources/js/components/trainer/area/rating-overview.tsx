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
 * The average of "Recensioni" (design "Trainer · Recensioni · nuovo"): the
 * big number with the stars and how many reviews, and on the right how many
 * of each star.
 */
export default function RatingOverview({
    average,
    count,
    ratings,
    allFromSession,
}: RatingOverviewProps) {
    const rows = [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: ratings.filter((rating) => rating === stars).length,
    }));
    const total = Math.max(1, ratings.length);
    const rounded = Math.round(average);

    return (
        <section aria-label="La tua media" className="flex items-center gap-6">
            <div className="flex shrink-0 flex-col gap-0.5">
                <b className="text-[56px] leading-none font-bold tracking-[-0.04em] tabular-nums">
                    {formatRating(average)}
                </b>
                <span
                    role="img"
                    aria-label={`${formatRating(average)} su 5`}
                    className="text-lg tracking-[0.05em] text-brand"
                >
                    {'★'.repeat(rounded)}
                    <span className="text-[#2e3135]">
                        {'★'.repeat(5 - rounded)}
                    </span>
                </span>
                <span className="text-[13px] text-muted-foreground tabular-nums">
                    {count === 1 ? '1 recensione' : `${count} recensioni`}
                    {allFromSession && ', da sedute svolte'}
                </span>
            </div>

            <div
                role="img"
                aria-label={`Distribuzione: ${rows.map((row) => `${row.stars} ${row.stars === 1 ? 'stella' : 'stelle'} ${row.count}`).join(', ')}`}
                className="flex min-w-0 flex-1 flex-col gap-1.5"
            >
                {rows.map((row) => (
                    <div
                        key={row.stars}
                        className="flex items-center gap-2 text-[13px] text-muted-foreground tabular-nums"
                    >
                        <span className="w-2.5">{row.stars}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1c1e21]">
                            <span
                                className="block h-full rounded-full bg-brand"
                                style={{
                                    width: `${(row.count / total) * 100}%`,
                                }}
                            />
                        </span>
                        <span className="w-4.5 text-right">{row.count}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
