import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

/** Length of the circle (2 × π × 28), to draw the arc of the percentage. */
const CIRCUMFERENCE = 175.93;

type MatchRingProps = {
    name: string;
    /** 0–100. */
    percent: number;
    /** On the dark card of the best match. */
    onPrimary?: boolean;
    /** Size and font size, e.g. "size-28 text-[28px]". */
    className?: string;
};

/** The trainer's initials inside a ring that fills up to the compatibility. */
export default function MatchRing({
    name,
    percent,
    onPrimary = false,
    className,
}: MatchRingProps) {
    const getInitials = useInitials();
    const arc = (percent / 100) * CIRCUMFERENCE;

    return (
        <div aria-hidden="true" className={cn('relative flex-none', className)}>
            <span
                className={cn(
                    'absolute inset-[9%] flex items-center justify-center rounded-full font-bold tracking-tight',
                    onPrimary
                        ? 'bg-primary-foreground/20'
                        : 'bg-muted text-muted-foreground',
                )}
            >
                {getInitials(name)}
            </span>
            <svg
                viewBox="0 0 64 64"
                className="absolute inset-0 size-full -rotate-90"
            >
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    strokeWidth="3.5"
                    className={
                        onPrimary
                            ? 'stroke-primary-foreground/30'
                            : 'stroke-muted'
                    }
                />
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
                />
            </svg>
        </div>
    );
}
