import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

const sizes = {
    sm: 'size-8 text-xs font-semibold',
    md: 'size-9 text-xs font-semibold',
    lg: 'size-12 text-base font-bold',
    xl: 'size-13 text-base font-bold',
} as const;

type UserAvatarProps = {
    name: string;
    src?: string | null;
    size?: keyof typeof sizes;
    /** 'rounded' is the square-ish trainer photo used in compact cards. */
    shape?: 'circle' | 'rounded';
    /**
     * Accessible name, e.g. "Account di Luca Moretti". Leave it out when the
     * person's name is already written next to the avatar.
     */
    label?: string;
    className?: string;
};

export default function UserAvatar({
    name,
    src,
    size = 'sm',
    shape = 'circle',
    label,
    className,
}: UserAvatarProps) {
    const getInitials = useInitials();
    const radius = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

    return (
        <Avatar
            className={cn(sizes[size], radius, className)}
            {...(label
                ? { role: 'img', 'aria-label': label }
                : { 'aria-hidden': true })}
        >
            {src && <AvatarImage src={src} alt="" />}
            <AvatarFallback className={radius}>
                {getInitials(name)}
            </AvatarFallback>
        </Avatar>
    );
}
