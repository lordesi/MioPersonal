import type { ReactNode } from 'react';

export type StatCard = {
    label: string;
    value: string;
    /** The line under the number, e.g. "Tutto in ordine". */
    detail?: ReactNode;
};

/** The key numbers next to "Prossima seduta", one card above the other. */
export default function StatCards({ stats }: { stats: StatCard[] }) {
    return (
        <div className="grid flex-[1_1_240px] grid-cols-2 gap-3 md:flex md:flex-col md:gap-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="flex flex-1 flex-col justify-between gap-3 rounded-[20px] border bg-card p-4 md:p-5.5"
                >
                    <span className="text-[13px] leading-4.5 font-medium text-muted-foreground md:text-sm">
                        {stat.label}
                    </span>
                    <span className="text-3xl font-bold tracking-[-0.03em] tabular-nums md:text-[40px] md:leading-11">
                        {stat.value}
                    </span>
                    {stat.detail && (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums md:text-[13px] md:leading-4.5">
                            {stat.detail}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
