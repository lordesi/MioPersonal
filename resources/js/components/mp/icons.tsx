import type { SVGProps } from 'react';

/**
 * Icons of the MioPersonal design system that lucide draws differently:
 * same 24px grid and stroke as lucide, so they sit next to its icons.
 */
type IconProps = SVGProps<SVGSVGElement> & { strokeWidth?: number };

function StrokeIcon({ children, strokeWidth = 2, ...props }: IconProps) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {children}
        </svg>
    );
}

/** A straight barbell seen from the side ("Sono un personal trainer"). */
export function DumbbellIcon(props: IconProps) {
    return (
        <StrokeIcon {...props}>
            <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
        </StrokeIcon>
    );
}

/** A building with windows and a door ("Ho una palestra", gyms without a photo). */
export function BuildingIcon(props: IconProps) {
    return (
        <StrokeIcon {...props}>
            <rect x={5} y={2.5} width={14} height={19} rx={1.5} />
            <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10.5 21.5v-3h3v3" />
        </StrokeIcon>
    );
}
