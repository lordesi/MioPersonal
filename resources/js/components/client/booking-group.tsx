import { router } from '@inertiajs/react';
import { Link2, Share2, UserPlus, Users, X } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import BookingInviteController from '@/actions/App/Http/Controllers/BookingInviteController';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { perPersonLabel } from '@/lib/booking';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { BookingGroup as Group } from '@/types';

type BookingGroupProps = {
    bookingId: number;
    group: Group;
    /** "Allenati con me": the text of the share sheet. */
    trainerName: string;
    /** dark: in the black card of the next session. */
    variant?: 'light' | 'dark';
    className?: string;
};

/**
 * "Invita un amico" in a booking card: who comes and the share of each one;
 * the booker shares the link, changes how many people come and takes a
 * friend off; a friend can say they won't come.
 */
export default function BookingGroup({
    bookingId,
    group,
    trainerName,
    variant = 'light',
    className,
}: BookingGroupProps) {
    const peopleLabelId = useId();
    const [, copy] = useClipboard();
    const [busy, setBusy] = useState(false);
    const dark = variant === 'dark';
    const muted = dark
        ? 'text-sidebar-muted-foreground'
        : 'text-muted-foreground';
    const isBooker = group.role === 'booker';

    const options = {
        preserveScroll: true,
        onStart: () => setBusy(true),
        onFinish: () => setBusy(false),
        onError: (errors: Record<string, string>) =>
            toast.error(errors.people ?? errors.invite ?? 'Riprova tra poco.'),
    };

    const share = async () => {
        if (!group.inviteUrl) {
            return;
        }

        const text = `Ti va di allenarti con me con ${trainerName}? Entra con questo link:`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Allenati con me',
                    text,
                    url: group.inviteUrl,
                });
            } catch {
                // The share sheet was closed.
            }

            return;
        }

        if (await copy(group.inviteUrl)) {
            toast('Link copiato: mandalo ai tuoi amici');
        }
    };

    const removeGuest = (guestId: number) =>
        router.delete(
            BookingInviteController.removeGuest.url({
                booking: bookingId,
                guest: guestId,
            }),
            options,
        );

    const changePeople = (people: number) =>
        router.patch(
            BookingInviteController.changePeople.url(bookingId),
            { people },
            options,
        );

    const regenerate = () =>
        router.post(
            BookingInviteController.regenerate.url(bookingId),
            {},
            options,
        );

    const you = group.guests.find((guest) => guest.isYou);

    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-[14px] px-3.5 py-3',
                dark ? 'bg-sidebar-accent' : 'bg-muted',
                className,
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                    <Users aria-hidden="true" className="size-4 flex-none" />
                    {group.people} persone ·{' '}
                    {perPersonLabel(group.priceCents, group.people)}
                </span>
                <span className={cn('text-xs tabular-nums', muted)}>
                    Totale {formatPrice(group.priceCents)}
                </span>
            </div>

            <ul className="flex flex-col gap-1.5 text-sm">
                <li className="flex items-center justify-between gap-2">
                    <span>
                        {isBooker ? 'Tu' : group.bookerName}{' '}
                        <span className={muted}>· ha prenotato</span>
                    </span>
                </li>
                {group.guests.map((guest) => (
                    <li
                        key={guest.id}
                        className="flex items-center justify-between gap-2"
                    >
                        <span>{guest.isYou ? 'Tu' : guest.name}</span>
                        {isBooker && (
                            <button
                                type="button"
                                aria-label={`Togli ${guest.name}`}
                                disabled={busy}
                                onClick={() => removeGuest(guest.id)}
                                className={cn(
                                    'inline-flex size-9 items-center justify-center rounded-full',
                                    dark
                                        ? 'hover:bg-sidebar-border'
                                        : 'hover:bg-background',
                                )}
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        )}
                    </li>
                ))}
                {Array.from({ length: group.freeSeats }, (_, index) => (
                    <li key={`free-${index}`} className={muted}>
                        Posto libero
                    </li>
                ))}
            </ul>

            {isBooker && group.maxPeople !== null && group.maxPeople > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        id={peopleLabelId}
                        className={cn('text-xs font-semibold', muted)}
                    >
                        Quante persone?
                    </span>
                    <div
                        role="radiogroup"
                        aria-labelledby={peopleLabelId}
                        className="flex flex-wrap gap-1.5"
                    >
                        {Array.from(
                            { length: group.maxPeople },
                            (_, index) => index + 1,
                        ).map((people) => (
                            <button
                                key={people}
                                type="button"
                                role="radio"
                                aria-checked={people === group.people}
                                disabled={
                                    busy || people - 1 < group.guests.length
                                }
                                onClick={() => changePeople(people)}
                                className={cn(
                                    'h-9 min-w-10 rounded-lg border px-2.5 text-sm font-semibold tabular-nums disabled:opacity-40',
                                    people === group.people
                                        ? dark
                                            ? 'border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground'
                                            : 'border-primary bg-primary text-primary-foreground'
                                        : dark
                                          ? 'border-sidebar-foreground/25'
                                          : 'bg-background',
                                )}
                            >
                                {people}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isBooker && group.inviteUrl && (
                <div className="flex flex-wrap gap-2">
                    {group.freeSeats > 0 && (
                        <Button
                            type="button"
                            className={cn(
                                'h-10 px-3.5',
                                dark &&
                                    'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90',
                            )}
                            onClick={share}
                        >
                            <Share2 aria-hidden="true" />
                            Invita i tuoi amici
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                            'h-10 px-3',
                            dark &&
                                'text-sidebar-foreground hover:bg-sidebar-border hover:text-sidebar-foreground',
                        )}
                        disabled={busy}
                        onClick={regenerate}
                    >
                        <Link2 aria-hidden="true" />
                        Nuovo link
                    </Button>
                </div>
            )}

            {isBooker && group.inviteUrl && group.freeSeats > 0 && (
                <p className={cn('flex gap-2 text-xs', muted)}>
                    <UserPlus aria-hidden="true" className="size-4 flex-none" />
                    Solo chi ha il link può unirsi: lo slot resta tuo.
                </p>
            )}

            {you && (
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'h-10 self-start px-3.5',
                        dark &&
                            'border-sidebar-foreground/25 bg-transparent text-sidebar-foreground hover:bg-sidebar-border hover:text-sidebar-foreground',
                    )}
                    disabled={busy}
                    onClick={() => removeGuest(you.id)}
                >
                    Non vengo più
                </Button>
            )}
        </div>
    );
}
