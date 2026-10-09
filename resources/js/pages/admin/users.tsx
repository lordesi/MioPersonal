import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import AdminNotice from '@/components/admin/admin-notice';
import SegmentedControl from '@/components/shared/segmented-control';
import { Button } from '@/components/ui/button';
import { formatDateShortYear, formatRating } from '@/lib/format';
import type { AdminClient, AdminTrainer } from '@/types';

type UsersProps = {
    clients: AdminClient[];
    trainers: AdminTrainer[];
};

type Tab = 'clients' | 'trainers';

/** One table row, the same for clients and trainers. */
type UserRow = {
    key: string;
    name: string;
    email: string;
    kind: string;
    joinedAt: string;
    activity: string;
    suspended: boolean;
};

function clientRow(client: AdminClient): UserRow {
    return {
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
    };
}

function trainerRow(trainer: AdminTrainer): UserRow {
    return {
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
    };
}

const headCell = 'px-3 py-3 font-semibold first:pl-4 last:pr-4';
const bodyCell = 'px-3 py-3 first:pl-4 last:pr-4';

export default function Users({ clients, trainers }: UsersProps) {
    const [tab, setTab] = useState<Tab>('clients');
    // TODO: suspension and deletion only live in the page until the backend exists.
    const [suspended, setSuspended] = useState<Record<string, boolean>>({});
    const [deleted, setDeleted] = useState<string[]>([]);
    const [toDelete, setToDelete] = useState<UserRow | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const rows = (
        tab === 'clients' ? clients.map(clientRow) : trainers.map(trainerRow)
    ).filter((row) => !deleted.includes(row.key));

    const isSuspended = (row: UserRow) => suspended[row.key] ?? row.suspended;

    const toggleSuspension = (row: UserRow) => {
        const next = !isSuspended(row);
        setSuspended({ ...suspended, [row.key]: next });
        setNotice(
            `${next ? 'Account sospeso' : 'Account riattivato'}: ${row.name}`,
        );
    };

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        setDeleted([...deleted, toDelete.key]);
        setNotice(
            `Dati di ${toDelete.name} cancellati. Registrato nel registro attività.`,
        );
        setToDelete(null);
    };

    return (
        <>
            <Head title="Admin · Utenti" />

            <AdminNotice message={notice} onClose={() => setNotice(null)} />

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
                        <strong>
                            Cancellare definitivamente i dati di {toDelete.name}
                            ?
                        </strong>{' '}
                        Prenotazioni e recensioni restano in forma anonima.
                        L’operazione finisce nel registro attività.
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
                className="overflow-x-auto rounded-[14px] border bg-card"
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
                                    {isSuspended(row) ? (
                                        <AdminBadge variant="muted">
                                            Sospeso
                                        </AdminBadge>
                                    ) : (
                                        <AdminBadge>Attivo</AdminBadge>
                                    )}
                                </td>
                                <td className={bodyCell}>
                                    <span className="flex justify-end gap-1.5">
                                        {/* TODO: export the user's data (GDPR) once the tables exist. */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                        >
                                            Esporta dati
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                toggleSuspension(row)
                                            }
                                        >
                                            {isSuspended(row)
                                                ? 'Riattiva'
                                                : 'Sospendi'}
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => setToDelete(row)}
                                            className="h-8 px-2.5 text-[13px] underline"
                                        >
                                            Cancella dati
                                        </button>
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

Users.layout = { section: 'users' };
