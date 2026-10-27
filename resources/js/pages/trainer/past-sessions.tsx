import { Head } from '@inertiajs/react';
import { History } from 'lucide-react';
import SearchPagination from '@/components/search/search-pagination';
import EmptyState from '@/components/states/empty-state';
import PageHeading from '@/components/trainer/area/page-heading';
import PastSessionList from '@/components/trainer/dashboard/past-session-list';
import OutcomeFilters, {
    filterUrl,
} from '@/components/trainer/past-sessions/outcome-filters';
import PastWeekSummary from '@/components/trainer/past-sessions/past-week-summary';
import type {
    PastSessionCounts,
    PastSessionFilter,
    PastWeekSummary as Summary,
    TrainerPastSession,
} from '@/types';

type PastSessionsProps = {
    /** This page of the finished sessions of the filter, the most recent first. */
    sessions: TrainerPastSession[];
    pagination: { currentPage: number; lastPage: number };
    filter: PastSessionFilter;
    /** Of every session over, for the numbers next to the filters. */
    counts: PastSessionCounts;
    lastWeek: Summary;
};

/**
 * "Sedute passate", the "Vedi tutte" of "Ultimi 7 giorni": every finished
 * session, filtered by "Tutte", "Effettuate" or "Saltate", with the summary of
 * the last 7 days on the side. "Saltata" can be changed only in the first 7 days.
 */
export default function PastSessions({
    sessions,
    pagination,
    filter,
    counts,
    lastWeek,
}: PastSessionsProps) {
    return (
        <>
            <Head title="Sedute passate" />

            <PageHeading title="Sedute passate" />

            {counts.all === 0 ? (
                <EmptyState
                    bordered
                    icon={History}
                    title="Nessuna seduta passata"
                    description="Qui trovi le sedute confermate, una volta finite."
                />
            ) : (
                <div className="flex flex-wrap items-start gap-5">
                    <div className="flex min-w-0 flex-[3_1_560px] flex-col gap-4">
                        <OutcomeFilters current={filter} counts={counts} />

                        {sessions.length === 0 ? (
                            <div className="rounded-[20px] border border-dashed border-input bg-card px-6 py-10 text-center text-sm text-muted-foreground">
                                Nessuna seduta con questo esito.
                            </div>
                        ) : (
                            <>
                                <PastSessionList sessions={sessions} />
                                <SearchPagination
                                    {...pagination}
                                    label="Pagine delle sedute passate"
                                    moreLabel="Sedute più vecchie"
                                    pageUrl={(pagina) =>
                                        filterUrl(filter, pagina)
                                    }
                                />
                            </>
                        )}
                    </div>

                    <PastWeekSummary summary={lastWeek} />
                </div>
            )}
        </>
    );
}

// Part of "Le tue prenotazioni" in the menu.
PastSessions.layout = { section: 'today' };
