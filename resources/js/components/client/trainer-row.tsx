import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import UserAvatar from '@/components/shared/user-avatar';

type TrainerRowProps = {
    name: string;
    href: string;
    /** e.g. "Gio 8 ott · 18:00–19:00 · Seduta singola" */
    detail: string;
    /** Usually a status badge, shown on the right. */
    aside?: ReactNode;
};

/** Top row of the client's booking cards: avatar, trainer name and details. */
export default function TrainerRow({
    name,
    href,
    detail,
    aside,
}: TrainerRowProps) {
    return (
        <div className="flex items-center gap-3">
            <UserAvatar
                name={name}
                size="lg"
                className="size-11 text-sm text-muted-foreground"
            />
            <span className="flex min-w-0 flex-1 flex-col">
                <Link
                    href={href}
                    className="text-base font-semibold hover:underline"
                >
                    {name}
                </Link>
                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                    {detail}
                </span>
            </span>
            {aside}
        </div>
    );
}
