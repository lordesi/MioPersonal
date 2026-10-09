export type StatCard = {
    label: string;
    value: string;
    detail: string;
};

/** Row of key numbers at the top of the trainer dashboard. */
export default function StatCards({ stats }: { stats: StatCard[] }) {
    return (
        <div className="grid grid-cols-3 gap-1.5 md:grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] md:gap-3">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="flex flex-col gap-0.5 rounded-xl border bg-card p-3 md:gap-1 md:p-4"
                >
                    <span className="text-xs text-muted-foreground md:text-[13px] md:leading-4.5">
                        {stat.label}
                    </span>
                    <span className="text-2xl font-bold tracking-tight tabular-nums md:text-3xl">
                        {stat.value}
                    </span>
                    <span className="text-[11px] leading-3.5 text-muted-foreground tabular-nums md:text-xs">
                        {stat.detail}
                    </span>
                </div>
            ))}
        </div>
    );
}
