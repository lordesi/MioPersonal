import { Head } from '@inertiajs/react';
import { History } from 'lucide-react';
import SearchPagination from '@/components/search/search-pagination';
import ProfilePage from '@/components/trainer/profile-pages/profile-page';
import { today } from '@/routes/trainer';
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

            <ProfilePage
                title={
                    <>
                        Sedute <strong>passate</strong>
                    </>
                }
                intro="Le sedute confermate, una volta finite. Una seduta saltata si può segnare nei primi 7 giorni."
                back={{ href: today.url(), label: 'Home' }}
            >
                {counts.all === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-[26px] bg-card px-6 py-12 text-center">
                        <span className="flex size-13 items-center justify-center rounded-full bg-brand-soft text-brand">
                            <History aria-hidden="true" className="size-6" />
                        </span>
                        <span className="text-lg font-semibold">
                            Nessuna seduta passata
                        </span>
                        <span className="text-[15px] text-muted-foreground">
                            Qui trovi le sedute confermate, una volta finite.
                        </span>
                    </div>
                ) : (
                    <>
                        <PastWeekSummary summary={lastWeek} />
                        <div className="flex min-w-0 flex-col gap-4">
                            <OutcomeFilters current={filter} counts={counts} />

                            {sessions.length === 0 ? (
                                <div className="rounded-[26px] border border-dashed border-field px-6 py-10 text-center text-[15px] text-muted-foreground">
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
                    </>
                )}
            </ProfilePage>
        </>
    );
}

// Part of "Le tue prenotazioni" in the menu.
PastSessions.layout = { section: 'today' };
