import type { ReactNode } from 'react';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

/**
 * Small pieces of the new trainer area, shared by the desktop and the phone
 * pages: the number next to a title, the initials, the empty box, the chip
 * of a session.
 */

/** The number next to a title: turquoise when it asks for attention. */
export function CountChip({
    count,
    label,
    tone = 'neutral',
}: {
    count: number;
    /** Read by screen readers instead of the bare number. */
    label?: string;
    tone?: 'brand' | 'neutral';
}) {
    return (
        <span
            aria-label={label}
            className={cn(
                'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2.25 text-[15px] font-bold tabular-nums',
                tone === 'brand'
                    ? 'bg-brand text-[#0a0a0a]'
                    : 'bg-secondary text-foreground',
            )}
        >
            {count}
        </span>
    );
}

/** The four colours of the initials: chosen by the name, always the same for a person. */
const HUES = [
    'bg-brand-soft text-brand',
    'bg-secondary text-foreground',
    'bg-[#1f2d3a] text-[#9cc8f0]',
    'bg-[#33291c] text-[#f0c98a]',
] as const;

function hueOf(name: string): string {
    let sum = 0;

    for (const char of name) {
        sum += char.charCodeAt(0);
    }

    return HUES[sum % HUES.length];
}

/** A round avatar: the photo, or the initials on a colour of the name. */
export function Initials({
    name,
    src,
    size = 40,
    tone,
    className,
}: {
    name: string;
    src?: string | null;
    /** In px: 36, 40, 44, 48, 72. */
    size?: number;
    /** 'muted': over or inactive; 'next': the next session; 'outline': never written. */
    tone?: 'muted' | 'next' | 'outline';
    className?: string;
}) {
    const getInitials = useInitials();
    const style = {
        width: size,
        height: size,
        fontSize: Math.round(size * 0.32),
    };

    if (src) {
        return (
            <img
                src={src}
                alt=""
                style={style}
                className={cn(
                    'shrink-0 rounded-full object-cover',
                    tone === 'muted' && 'opacity-55',
                    className,
                )}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            style={style}
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full font-bold',
                tone === 'next'
                    ? 'bg-brand-soft text-brand'
                    : tone === 'outline'
                      ? 'bg-transparent text-muted-foreground shadow-[inset_0_0_0_1.5px_#3a3a3a]'
                      : hueOf(name),
                tone === 'muted' && 'opacity-55',
                className,
            )}
        >
            {getInitials(name)}
        </span>
    );
}

/** The dashed box of an empty list. */
export function EmptyBox({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-[22px] border border-dashed border-[#3a3a3a] px-4 py-5 text-center text-[15px] text-muted-foreground',
                className,
            )}
        >
            {children}
        </div>
    );
}

/** The chip on the right of a session: "Tra 1 h 30", "Stasera", "Fatta". */
export function StatusChip({
    children,
    tone = 'neutral',
}: {
    children: ReactNode;
    tone?: 'brand' | 'neutral' | 'done' | 'waiting';
}) {
    return (
        <span
            className={cn(
                'inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-bold whitespace-nowrap tabular-nums',
                tone === 'brand' && 'bg-brand text-[#0a0a0a]',
                tone === 'neutral' && 'bg-secondary text-foreground',
                tone === 'done' &&
                    'text-[#8a8a8a] shadow-[inset_0_0_0_1px_#3a3a3a]',
                tone === 'waiting' && 'bg-secondary text-muted-foreground',
            )}
        >
            {children}
        </span>
    );
}

/** The ring of "Pacchetti attivi": the sessions left in the middle. */
export function PackageRing({
    done,
    total,
    size = 44,
    tone = 'brand',
}: {
    done: number;
    total: number;
    size?: number;
    /** 'dark': on the turquoise card; 'light': the last session. */
    tone?: 'brand' | 'dark' | 'light';
}) {
    const stroke = size > 48 ? 5 : 4;
    const radius = size / 2 - stroke;
    const circumference = 2 * Math.PI * radius;
    const ratio = total > 0 ? Math.min(done / total, 1) : 0;
    const colours = {
        brand: { ring: '#42d7d9', track: '#2a2a2a' },
        light: { ring: '#f5f5f5', track: '#2a2a2a' },
        dark: { ring: '#0a0a0a', track: 'rgba(10,10,10,0.18)' },
    }[tone];

    return (
        <span
            className="relative shrink-0"
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                aria-hidden="true"
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colours.track}
                    strokeWidth={stroke}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colours.ring}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${(circumference * ratio).toFixed(1)} ${circumference.toFixed(1)}`}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold tabular-nums">
                {total - done}
            </span>
        </span>
    );
}
