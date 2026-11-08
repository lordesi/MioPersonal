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
import { reactivate, suspend, trainerProfile } from '@/routes/admin/users';
import deletion from '@/routes/admin/users/deletion';
import type { AdminClient, AdminGym, AdminTrainer } from '@/types';

type UsersProps = {
    clients: AdminClient[];
    trainers: AdminTrainer[];
    gyms: AdminGym[];
    /** The text of the search box at the top, if any. */
    search: string | null;
};

type Tab = 'clients' | 'trainers' | 'gyms';

/** One table row, the same for clients, trainers and gyms. */
type UserRow = {
    id: number;
    key: string;
    name: string;
    email: string;
    kind: string;
    joinedAt: string;
    activity: string;
    /** A trainer: "Elimina profilo" too. */
    trainer?: boolean;
    /** The public profile (gyms): the name opens it. */
    href?: string | null;
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
        trainer: true,
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

const gymStatusLabels: Record<AdminGym['profileStatus'], string> = {
    approved: 'Palestra · approvata',
    review: 'Palestra · in revisione',
    changes: 'Palestra · modifiche richieste',
    rejected: 'Palestra · respinta',
};

function gymRow(gym: AdminGym): UserRow {
    return {
        id: gym.id,
        key: `gym-${gym.id}`,
        name: gym.name,
        // The contact person next to the email: the name is the gym's.
        email:
            gym.name === gym.contact
                ? gym.email
                : `${gym.contact} · ${gym.email}`,
        kind: gymStatusLabels[gym.profileStatus],
        joinedAt: gym.joinedAt,
        activity: [
            gym.city,
            gym.trainerCount === 1
                ? '1 trainer'
                : `${gym.trainerCount} trainer`,
        ]
            .filter(Boolean)
            .join(' · '),
        href: gym.profileHref,
        suspended: gym.suspended,
        deletionAt: gym.deletionAt,
        deletionByUser: gym.deletionByUser,
    };
}

const headCell = 'px-3 py-3 font-semibold first:pl-4 last:pr-4';
const bodyCell = 'px-3 py-3 first:pl-4 last:pr-4';

/**
 * "Sospendi" / "Riattiva" and "Cancella dati" / "Annulla cancellazione"
 * (AdminUserStatusController): saved on the server, the user is logged out
 * at once. The data goes 30 days after "Cancella dati".
 */
export default function Users({ clients, trainers, gyms, search }: UsersProps) {
    const [tab, setTab] = useState<Tab>('clients');
    const [toDelete, setToDelete] = useState<UserRow | null>(null);
    const [profileToDelete, setProfileToDelete] = useState<UserRow | null>(
        null,
    );
    const [busy, setBusy] = useState<string | null>(null);

    const rows = {
        clients: () => clients.map(clientRow),
        trainers: () => trainers.map(trainerRow),
        gyms: () => gyms.map(gymRow),
    }[tab]();

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
                    { value: 'gyms', label: `Palestre · ${gyms.length}` },
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

            {profileToDelete && (
                <div
                    role="alertdialog"
                    aria-label="Conferma eliminazione del profilo"
                    className="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-foreground bg-card px-4 py-3.5 text-sm"
                >
                    <span className="flex-1">
                        <strong>
                            Eliminare il profilo trainer di{' '}
                            {profileToDelete.name}?
                        </strong>{' '}
                        Profilo, servizi, orari, foto, attestati, prenotazioni e
                        recensioni vengono cancellati subito e non si possono
                        recuperare. L’account resta, come cliente.
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setProfileToDelete(null)}
                    >
                        Annulla
                    </Button>
                    <Button
                        type="button"
                        className="font-semibold"
                        onClick={() => {
                            send(
                                profileToDelete,
                                trainerProfile(profileToDelete.id),
                            );
                            setProfileToDelete(null);
                        }}
                    >
                        Elimina profilo
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
                                    {row.href ? (
                                        <a
                                            href={row.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline-offset-2 hover:underline"
                                        >
                                            {row.name}
                                            <span className="sr-only">
                                                {' '}
                                                (profilo, si apre in una nuova
                                                scheda)
                                            </span>
                                        </a>
                                    ) : (
                                        row.name
                                    )}
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
                                        {row.trainer &&
                                            row.deletionAt === null && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setProfileToDelete(row)
                                                    }
                                                    className="h-8 px-2.5 text-[13px] whitespace-nowrap underline"
                                                >
                                                    Elimina profilo
                                                </button>
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
