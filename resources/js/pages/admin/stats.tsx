import { Head } from '@inertiajs/react';
import AdminPanel from '@/components/admin/admin-panel';
import {
    BarChart,
    BarList,
    CohortTable,
    Delta,
    Funnel,
    KpiTile,
    LineChart,
    formatDay,
    formatMonth,
    formatNumber,
    formatPercent,
} from '@/components/admin/stats-charts';
import { formatPrice } from '@/lib/format';

type Count = { source: string; count: number };
type Step = { label: string; count: number };

/** The props of App\Support\AdminStats::all(). */
type Stats = {
    /** First day of the visits history (Y-m-d), null before any visit. */
    since: string | null;
    kpis: {
        key: string;
        label: string;
        value: number;
        previous: number | null;
        format: 'number' | 'cents';
    }[];
    daily: {
        day: string;
        visitors: number;
        visits: number;
        signups: number;
        requests: number;
    }[];
    monthly: {
        month: string;
        visitors: number;
        clients: number;
        trainers: number;
        activeClients: number;
        activeTrainers: number;
        requests: number;
        sessions: number;
        gmvCents: number;
    }[];
    channels: { visits: Count[]; signups: Count[] };
    funnel: Step[];
    cohorts: { month: string; size: number; retention: (number | null)[] }[];
    churn: {
        month: string;
        clients: number | null;
        trainers: number | null;
        clientsBase: number;
        trainersBase: number;
    }[];
    marketplace: {
        trainers: Step[];
        responseHoursMedian: number | null;
        acceptanceRate: number | null;
        viewToRequestRate: number | null;
        repeatRate: number | null;
        clientsWithSession: number;
        cities: Count[];
    };
    demand: {
        searches: number;
        emptyRate: number | null;
        empty: Count[];
        cities: Count[];
    };
    gyms: {
        supply: Step[];
        /** Gym profiles opened, last 30 days. */
        views: number;
        searches: number;
        emptyRate: number | null;
        searchCities: Count[];
        /** Published gyms by city. */
        cities: Count[];
        acceptedLinks: number;
        pendingLinks: number;
        topViewed: Count[];
    };
};

/** Channels as people say them. */
const channelNames: Record<string, string> = {
    direct: 'Diretto (link salvato, scritto a mano, app)',
    google: 'Google',
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    whatsapp: 'WhatsApp',
    linkedin: 'LinkedIn',
    x: 'X (Twitter)',
    sconosciuto: 'Non registrato (prima del 6 novembre 2026)',
};

const channel = (rows: Count[]) =>
    rows.map((row) => ({
        ...row,
        source: channelNames[row.source] ?? row.source,
    }));

const euros = (cents: number) => formatPrice(cents);

/**
 * "Statistiche" (AdminStatsController): growth, traffic and channels,
 * funnel, retention and churn, marketplace and demand. Visits and activity
 * are collected since `since`: the earlier months show 0 for them.
 */
export default function AdminStats({ stats }: { stats: Stats }) {
    const daily = (key: 'visitors' | 'visits' | 'signups' | 'requests') =>
        stats.daily.map((day) => ({
            label: formatDay(day.day),
            value: day[key],
        }));
    const monthly = (key: keyof Omit<Stats['monthly'][number], 'month'>) =>
        stats.monthly.map((month) => ({
            label: formatMonth(month.month),
            value: month[key],
        }));
    const hours = stats.marketplace.responseHoursMedian;

    return (
        <>
            <Head title="Admin · Statistiche" />

            <p className="text-sm text-muted-foreground">
                Ultimi 30 giorni, confrontati con i 30 prima. Visite, utenti
                attivi, ricerche e provenienza si raccolgono{' '}
                {stats.since
                    ? `dal ${formatDay(stats.since)} ${stats.since.slice(0, 4)}`
                    : 'da quando arriva la prima visita'}
                : prima di allora valgono 0.
            </p>

            <section
                aria-label="Numeri principali"
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
            >
                {stats.kpis.map((kpi) => (
                    <KpiTile
                        key={kpi.key}
                        label={kpi.label}
                        value={
                            kpi.format === 'cents'
                                ? euros(kpi.value)
                                : formatNumber(kpi.value)
                        }
                        detail={
                            <Delta value={kpi.value} previous={kpi.previous} />
                        }
                    />
                ))}
            </section>

            <h2 className="mt-3 text-lg font-bold tracking-tight">Traffico</h2>
            <div className="grid gap-3 lg:grid-cols-2">
                <AdminPanel
                    title="Visitatori unici al giorno"
                    aside="Ultimi 30 giorni"
                >
                    <LineChart points={daily('visitors')} unit="Visitatori" />
                </AdminPanel>
                <AdminPanel
                    title="Nuovi iscritti al giorno"
                    aside="Clienti e trainer"
                >
                    <BarChart points={daily('signups')} unit="Iscritti" />
                </AdminPanel>
                <AdminPanel
                    title="Da dove arrivano le visite"
                    aside="Ultimi 30 giorni"
                >
                    <BarList rows={channel(stats.channels.visits)} />
                </AdminPanel>
                <AdminPanel
                    title="Da dove arrivano gli iscritti"
                    aside="Ultimi 30 giorni"
                >
                    <BarList rows={channel(stats.channels.signups)} />
                </AdminPanel>
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight">Crescita</h2>
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                <AdminPanel
                    title="Visitatori unici al mese"
                    aside="Ognuno contato una volta nel mese"
                >
                    <BarChart points={monthly('visitors')} unit="Visitatori" />
                </AdminPanel>
                <AdminPanel
                    title="Nuovi clienti al mese"
                    aside="Ultimi 12 mesi"
                >
                    <BarChart points={monthly('clients')} unit="Clienti" />
                </AdminPanel>
                <AdminPanel
                    title="Nuovi trainer al mese"
                    aside="Ultimi 12 mesi"
                >
                    <BarChart points={monthly('trainers')} unit="Trainer" />
                </AdminPanel>
                <AdminPanel
                    title="Clienti attivi al mese"
                    aside="Hanno usato l’app nel mese"
                >
                    <BarChart
                        points={monthly('activeClients')}
                        unit="Clienti attivi"
                    />
                </AdminPanel>
                <AdminPanel
                    title="Trainer attivi al mese"
                    aside="Hanno usato l’app nel mese"
                >
                    <BarChart
                        points={monthly('activeTrainers')}
                        unit="Trainer attivi"
                    />
                </AdminPanel>
                <AdminPanel
                    title="Sedute svolte al mese"
                    aside="Confermate e non saltate"
                >
                    <BarChart points={monthly('sessions')} unit="Sedute" />
                </AdminPanel>
                <AdminPanel
                    title="Valore delle sedute svolte"
                    aside="Prezzi indicati dai trainer"
                >
                    <BarChart
                        points={monthly('gmvCents')}
                        unit="Valore"
                        format={euros}
                    />
                </AdminPanel>
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight">
                Conversione e fidelizzazione
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
                <AdminPanel
                    title="Dalla visita alla seduta"
                    aside="Ultimi 30 giorni"
                >
                    <Funnel steps={stats.funnel} />
                </AdminPanel>
                <AdminPanel title="Churn mensile" aside="Mesi completi">
                    <ChurnTable rows={stats.churn} />
                </AdminPanel>
                <AdminPanel
                    title="Retention dei clienti per mese di iscrizione"
                    className="lg:col-span-2"
                >
                    <CohortTable cohorts={stats.cohorts} />
                </AdminPanel>
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight">
                Marketplace
            </h2>
            <section
                aria-label="Indicatori del marketplace"
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
                <KpiTile
                    label="Tempo di risposta dei trainer"
                    value={
                        hours === null
                            ? '—'
                            : `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(hours)} h`
                    }
                    detail={
                        <span className="text-xs text-muted-foreground">
                            Mediana, ultimi 30 giorni
                        </span>
                    }
                />
                <KpiTile
                    label="Richieste accettate"
                    value={formatPercent(stats.marketplace.acceptanceRate)}
                    detail={
                        <span className="text-xs text-muted-foreground">
                            Sulle richieste con un esito
                        </span>
                    }
                />
                <KpiTile
                    label="Da visita al profilo a richiesta"
                    value={formatPercent(stats.marketplace.viewToRequestRate)}
                    detail={
                        <span className="text-xs text-muted-foreground">
                            Richieste ogni visita, 30 giorni
                        </span>
                    }
                />
                <KpiTile
                    label="Clienti che tornano"
                    value={formatPercent(stats.marketplace.repeatRate)}
                    detail={
                        <span className="text-xs text-muted-foreground">
                            Almeno 2 sedute, su{' '}
                            {formatNumber(stats.marketplace.clientsWithSession)}{' '}
                            con una seduta
                        </span>
                    }
                />
            </section>
            <div className="grid gap-3 lg:grid-cols-2">
                <AdminPanel title="Trainer" aside="Oggi">
                    <Funnel steps={stats.marketplace.trainers} rates={false} />
                </AdminPanel>
                <AdminPanel
                    title="Trainer visibili per città"
                    aside="Città principale e altre"
                >
                    <BarList rows={stats.marketplace.cities} />
                </AdminPanel>
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight">
                Domanda di trainer
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
                <AdminPanel
                    title="Ricerche senza risultati"
                    aside={`${formatPercent(stats.demand.emptyRate)} di ${formatNumber(stats.demand.searches)} ricerche`}
                >
                    <BarList
                        rows={stats.demand.empty}
                        empty="Nessuna ricerca senza risultati negli ultimi 30 giorni."
                    />
                </AdminPanel>
                <AdminPanel title="Città più cercate" aside="Ultimi 30 giorni">
                    <BarList rows={stats.demand.cities} />
                </AdminPanel>
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight">Palestre</h2>
            <section
                aria-label="Indicatori delle palestre"
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
                <KpiTile
                    label="Visite ai profili delle palestre"
                    value={formatNumber(stats.gyms.views)}
                    detail={
                        <span className="text-xs text-muted-foreground">
                            Ultimi 30 giorni
                        </span>
                    }
                />
                <KpiTile
                    label="Ricerche di palestre"
                    value={formatNumber(stats.gyms.searches)}
                    detail={
                        <span className="text-xs text-muted-foreground">
                            Ultimi 30 giorni
                        </span>
                    }
                />
                <KpiTile
                    label="Ricerche senza risultati"
                    value={formatPercent(stats.gyms.emptyRate)}
                    detail={
                        <span className="text-xs text-muted-foreground">
                            Sulle ricerche di palestre
                        </span>
                    }
                />
                <KpiTile
                    label="Trainer collegati"
                    value={formatNumber(stats.gyms.acceptedLinks)}
                    detail={
                        <span className="text-xs text-muted-foreground">
                            {formatNumber(stats.gyms.pendingLinks)} richieste in
                            attesa
                        </span>
                    }
                />
            </section>
            <div className="grid gap-3 lg:grid-cols-2">
                <AdminPanel title="Palestre" aside="Oggi">
                    <Funnel steps={stats.gyms.supply} rates={false} />
                </AdminPanel>
                <AdminPanel title="Palestre visibili per città" aside="Oggi">
                    <BarList
                        rows={stats.gyms.cities}
                        empty="Nessuna palestra visibile."
                    />
                </AdminPanel>
                <AdminPanel
                    title="Palestre più visitate"
                    aside="Ultimi 30 giorni"
                >
                    <BarList
                        rows={stats.gyms.topViewed}
                        empty="Nessuna visita negli ultimi 30 giorni."
                    />
                </AdminPanel>
                <AdminPanel
                    title="Città più cercate (palestre)"
                    aside="Ultimi 30 giorni"
                >
                    <BarList
                        rows={stats.gyms.searchCities}
                        empty="Nessuna ricerca negli ultimi 30 giorni."
                    />
                </AdminPanel>
            </div>
        </>
    );
}

/** Of the users active the month before, the share that didn't come back. */
function ChurnTable({ rows }: { rows: Stats['churn'] }) {
    return (
        <div className="flex flex-col gap-2">
            <table className="w-full text-left text-[13px] tabular-nums">
                <thead className="text-muted-foreground">
                    <tr>
                        <th className="py-1.5 font-medium">Mese</th>
                        <th className="py-1.5 text-right font-medium">
                            Clienti
                        </th>
                        <th className="py-1.5 text-right font-medium">
                            Trainer
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.month} className="border-t">
                            <th className="py-1.5 font-medium capitalize">
                                {formatMonth(row.month, true)}
                            </th>
                            <td className="py-1.5 text-right">
                                {formatPercent(row.clients)}{' '}
                                <span className="text-muted-foreground">
                                    su {formatNumber(row.clientsBase)}
                                </span>
                            </td>
                            <td className="py-1.5 text-right">
                                {formatPercent(row.trainers)}{' '}
                                <span className="text-muted-foreground">
                                    su {formatNumber(row.trainersBase)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="text-xs text-muted-foreground">
                Di chi ha usato MioPersonal nel mese prima, la quota che non è
                tornata nel mese indicato. «—» quando non c’era nessuno.
            </p>
        </div>
    );
}

AdminStats.layout = { section: 'stats' };
