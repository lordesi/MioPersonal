import { Head } from '@inertiajs/react';
import { History } from 'lucide-react';
import SearchPagination from '@/components/search/search-pagination';
import EmptyState from '@/components/states/empty-state';
import PageHeading from '@/components/trainer/area/page-heading';
import PastSessionList from '@/components/trainer/dashboard/past-session-list';
import { pastSessions } from '@/routes/trainer';
import type { TrainerPastSession } from '@/types';

type PastSessionsProps = {
    /** This page of the finished sessions, the most recent first. */
    sessions: TrainerPastSession[];
    pagination: { currentPage: number; lastPage: number };
};

/**
 * "Sedute passate", the "Vedi tutte" of "Ultimi 7 giorni": every finished
 * session. "Saltata" can be changed only in the first 7 days.
 */
export default function PastSessions({
    sessions,
    pagination,
}: PastSessionsProps) {
    return (
        <>
            <Head title="Sedute passate" />

            <PageHeading
                title="Sedute passate"
                description="Risultano effettuate: entro 7 giorni puoi segnarle «Saltata»."
            />

            {sessions.length === 0 ? (
                <EmptyState
                    bordered
                    icon={History}
                    title="Nessuna seduta passata"
                    description="Qui trovi le sedute confermate, una volta finite."
                />
            ) : (
                <div className="flex flex-col gap-3">
                    <PastSessionList sessions={sessions} />
                    <SearchPagination
                        {...pagination}
                        label="Pagine delle sedute passate"
                        moreLabel="Sedute più vecchie"
                        pageUrl={(pagina) =>
                            pastSessions.url({ query: { pagina } })
                        }
                    />
                </div>
            )}
        </>
    );
}

// Part of "Le tue prenotazioni" in the menu.
PastSessions.layout = { section: 'today' };
