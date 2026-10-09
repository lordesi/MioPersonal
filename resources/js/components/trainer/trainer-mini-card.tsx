import { Link } from '@inertiajs/react';
import UserAvatar from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';

type TrainerMiniCardProps = {
    name: string;
    href: string;
    /** e.g. "Lambrate · Calisthenics, Pesi" or "Primo slot: oggi, 19:00" */
    subtitle: string;
    /** Bold extra line on the card variant, e.g. "da 40 € · primo slot oggi 19:00" */
    detail?: string;
    photoUrl?: string | null;
    /** 'card' = "Trainer simili", 'pill' = "Trainer preferiti". */
    variant?: 'card' | 'pill';
    className?: string;
};

export default function TrainerMiniCard({
    name,
    href,
    subtitle,
    detail,
    photoUrl,
    variant = 'card',
    className,
}: TrainerMiniCardProps) {
    const isPill = variant === 'pill';

    return (
        <Link
            href={href}
            className={cn(
                'flex items-center border bg-card text-foreground',
                isPill
                    ? 'shrink-0 gap-2.5 rounded-full py-2.5 pr-3.5 pl-2.5'
                    : 'gap-3 rounded-xl p-3',
                className,
            )}
        >
            <UserAvatar
                name={name}
                src={photoUrl}
                size={isPill ? 'sm' : 'xl'}
                shape={isPill ? 'circle' : 'rounded'}
                className={cn('font-bold', !isPill && 'text-muted-foreground')}
            />
            <span className="flex min-w-0 flex-col">
                <span
                    className={cn(
                        'font-semibold',
                        isPill ? 'text-sm' : 'text-[15px]',
                    )}
                >
                    {name}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {subtitle}
                </span>
                {detail && (
                    <span className="text-xs font-semibold tabular-nums">
                        {detail}
                    </span>
                )}
            </span>
        </Link>
    );
}
