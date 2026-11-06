import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import SearchNotice from '@/components/admin/search-notice';
import SegmentedControl from '@/components/shared/segmented-control';
import { Button } from '@/components/ui/button';
import {
    formatDateMedium,
    formatDateShortYear,
    formatRating,
} from '@/lib/format';
import { users } from '@/routes/admin';
import { reactivate, suspend } from '@/routes/admin/users';
import deletion from '@/routes/admin/users/deletion';
import type { AdminClient, AdminTrainer } from '@/types';

type UsersProps = {
    clients: AdminClient[];
    trainers: AdminTrainer[];
    /** The text of the search box at the top, if any. */
    search: string | null;
};

type Tab = 'clients' | 'trainers';

/** One table row, the same for clients and trainers. */
type UserRow = {
    id: number;
    key: string;
    name: string;
    email: string;
    kind: string;
    joinedAt: string;
    activity: string;
    suspended: boolean;
    deletionAt: string | null;
    deletionByUser: boolean;
};

function clientRow(client: AdminClient): UserRow {
    return {
        id: client.id,
        key: `client-${client.id}`,
        name: client.name,
        email: client.email,
        kind: 'Cliente',
        joinedAt: client.joinedAt,
        activity:
            client.bookingCount === 1
                ? '1 prenotazione'
                : `${client.bookingCount} prenotazioni`,
        suspended: client.suspended,
        deletionAt: client.deletionAt,
        deletionByUser: client.deletionByUser,
    };
}

function trainerRow(trainer: AdminTrainer): UserRow {
    return {
        id: trainer.id,
        key: `trainer-${trainer.id}`,
        name: trainer.name,
        email: trainer.email,
        kind:
            trainer.profileStatus === 'approved'
                ? 'Trainer · approvato'
                : 'Trainer · in revisione',
        joinedAt: trainer.joinedAt,
        activity:
            trainer.rating === null
                ? '—'
                : `${trainer.reviewCount} recensioni · ${formatRating(trainer.rating)}`,
        suspended: trainer.suspended,
        deletionAt: trainer.deletionAt,
        deletionByUser: trainer.deletionByUser,
    };
}

const headCell = 'px-3 py-3 font-semibold first:pl-4 last:pr-4';
const bodyCell = 'px-3 py-3 first:pl-4 last:pr-4';

/**
 * "Sospendi" / "Riattiva" and "Cancella dati" / "Annulla cancellazione"
 * (AdminUserStatusController): saved on the server, the user is logged out
 * at once. The data goes 30 days after "Cancella dati".
 */
export default function Users({ clients, trainers, search }: UsersProps) {
    const [tab, setTab] = useState<Tab>('clients');
    const [toDelete, setToDelete] = useState<UserRow | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const rows =
        tab === 'clients' ? clients.map(clientRow) : trainers.map(trainerRow);

    const send = (row: UserRow, route: Parameters<typeof router.visit>[0]) =>
        router.visit(route, {
            preserveScroll: true,
            onStart: () => setBusy(row.key),
            onFinish: () => setBusy(null),
        });

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        send(toDelete, deletion.schedule(toDelete.id));
        setToDelete(null);
    };

    return (
        <>
            <Head title="Admin · Utenti" />

            {search && <SearchNotice text={search} clearHref={users()} />}

            <SegmentedControl
                options={[
                    { value: 'clients', label: `Clienti · ${clients.length}` },
                    {
                        value: 'trainers',
                        label: `Trainer · ${trainers.length}`,
                    },
                ]}
                value={tab}
                onChange={setTab}
                aria-label="Tipo di utente"
                className="self-start *:whitespace-nowrap"
            />

            {toDelete && (
                <div
                    role="alertdialog"
                    aria-label="Conferma cancellazione"
                    className="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-foreground bg-card px-4 py-3.5 text-sm"
                >
                    <span className="flex-1">
                        <strong>Cancellare i dati di {toDelete.name}?</strong>{' '}
                        L’account viene bloccato subito e le prenotazioni future
                        annullate; i dati spariscono tra 30 giorni (fino ad
                        allora puoi annullare). Prenotazioni passate e
                        recensioni restano in forma anonima.
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setToDelete(null)}
                    >
                        Annulla
                    </Button>
                    <Button
                        type="button"
                        className="font-semibold"
                        onClick={confirmDelete}
                    >
                        Cancella dati
                    </Button>
                </div>
            )}

            <section
                aria-label="Elenco utenti"
                // relative: the sr-only text of the headers stays inside the scroll, not on the page.
                className="relative overflow-x-auto rounded-[14px] border bg-card"
            >
                <table className="w-full min-w-225 text-left text-sm">
                    <thead>
                        <tr className="text-xs text-muted-foreground">
                            <th scope="col" className={headCell}>
                                Nome
                            </th>
                            <th scope="col" className={headCell}>
                                Email
                            </th>
                            <th scope="col" className={headCell}>
                                Tipo
                            </th>
                            <th scope="col" className={headCell}>
                                Iscritto il
                            </th>
                            <th scope="col" className={headCell}>
                                Attività
                            </th>
                            <th scope="col" className={headCell}>
                                Stato
                            </th>
                            <th scope="col" className={headCell}>
                                <span className="sr-only">Azioni</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key} className="border-t">
                                <td className={`${bodyCell} font-semibold`}>
                                    {row.name}
                                </td>
                                <td
                                    className={`${bodyCell} text-muted-foreground`}
                                >
                                    {row.email}
                                </td>
                                <td className={bodyCell}>{row.kind}</td>
                                <td className={`${bodyCell} tabular-nums`}>
                                    {formatDateShortYear(row.joinedAt)}
                                </td>
                                <td className={`${bodyCell} tabular-nums`}>
                                    {row.activity}
                                </td>
                                <td className={bodyCell}>
                                    <StatusBadge row={row} />
                                </td>
                                <td className={bodyCell}>
                                    <span className="flex justify-end gap-1.5">
                                        {row.deletionAt === null && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={busy === row.key}
                                                onClick={() =>
                                                    send(
                                                        row,
                                                        row.suspended
                                                            ? reactivate(row.id)
                                                            : suspend(row.id),
                                                    )
                                                }
                                            >
                                                {row.suspended
                                                    ? 'Riattiva'
                                                    : 'Sospendi'}
                                            </Button>
                                        )}
                                        {row.deletionAt === null ? (
                                            <button
                                                type="button"
                                                onClick={() => setToDelete(row)}
                                                className="h-8 px-2.5 text-[13px] underline"
                                            >
                                                Cancella dati
                                            </button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={busy === row.key}
                                                onClick={() =>
                                                    send(
                                                        row,
                                                        deletion.cancel(row.id),
                                                    )
                                                }
                                            >
                                                Annulla cancellazione
                                            </Button>
                                        )}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </>
    );
}

function StatusBadge({ row }: { row: UserRow }) {
    if (row.deletionAt !== null) {
        return (
            <AdminBadge variant="muted">
                {row.deletionByUser ? 'Si è cancellato · ' : 'Cancellazione · '}
                {formatDateMedium(row.deletionAt)}
            </AdminBadge>
        );
    }

    if (row.suspended) {
        return <AdminBadge variant="muted">Sospeso</AdminBadge>;
    }

    return <AdminBadge>Attivo</AdminBadge>;
}

Users.layout = { section: 'users' };
