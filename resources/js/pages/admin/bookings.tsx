import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import ChoiceChips from '@/components/shared/choice-chips';
import { Button } from '@/components/ui/button';
import { bookingStatuses } from '@/lib/admin';
import { formatHoursShort, formatSlot, hoursUntil } from '@/lib/format';
import type { AdminBooking, AdminBookingStatus } from '@/types';

type BookingsProps = {
    bookings: AdminBooking[];
};

type Filter = 'all' | AdminBookingStatus;

/** The order of the filter chips in the design. */
const filterOrder: AdminBookingStatus[] = [
    'pending',
    'confirmed',
    'completed',
    'expired',
    'cancelled',
    'no_show',
];

const headCell = 'px-3 py-3 font-semibold first:pl-4 last:pr-4';
const bodyCell = 'px-3 py-3 first:pl-4 last:pr-4';

export default function Bookings({ bookings }: BookingsProps) {
    const [filter, setFilter] = useState<Filter>('all');

    const countOf = (status: AdminBookingStatus) =>
        bookings.filter((booking) => booking.status === status).length;

    const filters = [
        { value: 'all' as Filter, label: `Tutte · ${bookings.length}` },
        ...filterOrder.map((status) => ({
            value: status as Filter,
            label: `${bookingStatuses[status].label} · ${countOf(status)}`,
        })),
    ];

    const visible =
        filter === 'all'
            ? bookings
            : bookings.filter((booking) => booking.status === filter);

    return (
        <>
            <Head title="Admin · Prenotazioni" />

            <ChoiceChips
                options={filters}
                value={filter}
                onChange={setFilter}
                aria-label="Filtra per stato"
                className="gap-1.5"
            />

            <section
                aria-label="Elenco prenotazioni"
                className="overflow-x-auto rounded-[14px] border bg-card"
            >
                <table className="w-full min-w-200 text-left text-sm">
                    <thead>
                        <tr className="text-xs text-muted-foreground">
                            <th scope="col" className={headCell}>
                                ID
                            </th>
                            <th scope="col" className={headCell}>
                                Cliente
                            </th>
                            <th scope="col" className={headCell}>
                                Trainer
                            </th>
                            <th scope="col" className={headCell}>
                                Quando
                            </th>
                            <th scope="col" className={headCell}>
                                Servizio
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
                        {visible.map((booking) => {
                            const status = bookingStatuses[booking.status];
                            const note = booking.expiresAt
                                ? `Scade tra ${formatHoursShort(hoursUntil(booking.expiresAt))}`
                                : booking.note;

                            return (
                                <tr key={booking.id} className="border-t">
                                    <td
                                        className={`${bodyCell} font-semibold tabular-nums`}
                                    >
                                        #{booking.id}
                                    </td>
                                    <td className={bodyCell}>
                                        {booking.clientName}
                                    </td>
                                    <td className={bodyCell}>
                                        {booking.trainerName}
                                    </td>
                                    <td className={`${bodyCell} tabular-nums`}>
                                        {formatSlot(
                                            booking.start,
                                            booking.hours,
                                        )}
                                    </td>
                                    <td
                                        className={`${bodyCell} text-muted-foreground`}
                                    >
                                        {booking.serviceName}
                                    </td>
                                    <td className={bodyCell}>
                                        <span className="flex flex-col items-start gap-0.5">
                                            <AdminBadge
                                                variant={status.variant}
                                            >
                                                {status.label}
                                            </AdminBadge>
                                            {note && (
                                                <span className="text-xs text-muted-foreground">
                                                    {note}
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                    <td className={`${bodyCell} text-right`}>
                                        {/* TODO: open the booking detail once bookings are stored. */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                        >
                                            Dettaglio
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {visible.length === 0 && (
                    <p className="p-6 text-center text-muted-foreground">
                        Nessuna prenotazione con questo stato.
                    </p>
                )}
            </section>
        </>
    );
}

Bookings.layout = { section: 'bookings' };
