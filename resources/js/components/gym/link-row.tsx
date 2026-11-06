import { Link } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import type { ReactNode } from 'react';
import UserAvatar from '@/components/shared/user-avatar';

type LinkRowProps = {
    name: string;
    href: string;
    /** "Milano · Pilates, Yoga". */
    detail: string;
    /** The trainer's photo or the gym's cover. */
    imageUrl: string | null | undefined;
    /** A gym: square picture, a building without cover. */
    kind: 'trainer' | 'gym';
    message?: string | null;
    actions?: ReactNode;
};

/** A trainer or a gym in the lists of "Trainer" and "Palestre", with its buttons. */
export default function LinkRow({
    name,
    href,
    detail,
    imageUrl,
    kind,
    message,
    actions,
}: LinkRowProps) {
    return (
        <li className="flex flex-wrap items-center gap-3 py-3">
            <Link
                href={href}
                className="flex min-w-0 flex-[1_1_240px] items-center gap-3 hover:underline"
            >
                {kind === 'trainer' ? (
                    <UserAvatar
                        name={name}
                        src={imageUrl ?? undefined}
                        size="md"
                        className="size-11"
                    />
                ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt=""
                                className="size-full object-cover"
                            />
                        ) : (
                            <Building2 aria-hidden="true" className="size-5" />
                        )}
                    </span>
                )}
                <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{name}</span>
                    <span className="truncate text-sm text-muted-foreground">
                        {detail}
                    </span>
                    {message && (
                        <span className="mt-1 text-sm text-foreground/80 italic">
                            “{message}”
                        </span>
                    )}
                </span>
            </Link>
            {actions && <div className="flex gap-2">{actions}</div>}
        </li>
    );
}
