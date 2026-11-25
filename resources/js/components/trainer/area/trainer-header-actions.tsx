import { Link, usePage } from '@inertiajs/react';
import InboxBell from '@/components/mp/inbox-bell';
import { Initials } from '@/components/trainer/ui/bits';
import { hoverPrefetch } from '@/lib/prefetch';
import { cn } from '@/lib/utils';
import { messages, profile } from '@/routes/trainer';

/**
 * On the right of the titles of the trainer area (design "Trainer · nuovo"):
 * the bell, which opens the notifications of the Inbox, and the photo,
 * which opens "Profilo" (on phones it is not in the tab bar). The photo
 * only on phones: on desktop it is at the bottom of the side menu.
 */
export default function TrainerHeaderActions({
    bell = true,
    className,
}: {
    bell?: boolean;
    className?: string;
}) {
    const { auth } = usePage().props;

    return (
        <div className={cn('flex shrink-0 items-center gap-1.5', className)}>
            {bell && (
                <InboxBell
                    href={messages.url({ query: { sezione: 'notifiche' } })}
                />
            )}
            <Link
                prefetch={hoverPrefetch}
                href={profile()}
                aria-label="Profilo"
                className="flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
                <Initials
                    name={auth?.user?.name ?? ''}
                    src={auth?.user?.avatar}
                    size={40}
                    className="bg-[#1c1e21] text-sm font-bold text-foreground"
                />
            </Link>
        </div>
    );
}
