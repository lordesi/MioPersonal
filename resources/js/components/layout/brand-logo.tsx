import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { home } from '@/routes';

const MARK_PATH =
    'M41.1 253.3C3.5 246.1 -12.8 200.2 11.8 171.3C42.3 135.5 100.5 156.7 100.7 203.5C100.8 235.3 72.1 259.2 41.1 253.3ZM206 253.5C190.2 252.1 175.5 243 167.3 229.7C164.2 224.5 153.4 205.9 147.3 195C141.5 184.9 129.3 163.6 121.3 150C119.6 147.1 113.6 136.8 108 127C102.4 117.2 96.4 106.7 94.5 103.5C74.4 69 72.4 64.7 71.7 53.2C69.5 19.5 101.3 -6.9 133.8 1.7C150.2 6.1 159.9 15.3 172.7 39.2C174.1 41.7 175.8 44.7 176.5 45.8C177.2 46.8 179.6 50.9 181.8 54.8C184 58.6 188.9 67.2 192.7 73.8C196.5 80.3 201.4 88.8 203.5 92.5C205.6 96.2 208.3 100.7 209.3 102.5C210.4 104.3 214.9 111.9 219.3 119.5C223.6 127.1 229.1 136.6 231.5 140.8C233.9 144.9 237.6 151.3 239.8 155C246 165.8 245.7 165.8 251 154.8C257.3 141.8 261 128.4 261 118.6C261 115.3 260.9 115.1 256.7 107.8C254.3 103.6 250.7 97.3 248.6 93.8C246.6 90.2 243.8 85.4 242.5 83.2C235.7 72 232.9 64.7 231.9 56.6C226.6 9.7 281.9 -17.7 316.2 15C320.9 19.5 322 21 330.5 35.8C334.1 42.1 338.2 49.1 339.5 51.2C340.8 53.4 344.2 59.3 347 64.2C349.8 69.2 354 76.4 356.3 80.2C358.5 84.1 363.3 92.4 367 98.8C370.6 105.1 374.7 112.1 376 114.2C377.3 116.4 382.5 125.4 387.5 134.2C392.5 143.1 398.1 152.6 399.8 155.5C417.7 185.6 420 191.2 420 204.2C420 239.8 383.1 264.2 350.6 250.1C338.2 244.7 331.5 237.7 321.3 219.9C317.7 213.5 311.3 202.5 307.3 195.5C303.2 188.5 298.7 180.7 297.3 178.2C291.9 168.9 292.1 168.9 288.4 178C272.4 217.7 244.3 247.9 218.7 253C213.6 254.1 212.8 254.1 206 253.5Z';

export function BrandMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 420 254"
            aria-hidden="true"
            className={cn('h-5 w-8.25 shrink-0 fill-current', className)}
        >
            <path d={MARK_PATH} />
        </svg>
    );
}

type BrandLogoProps = {
    /** Wrap the logo in a link to the home page. */
    linkToHome?: boolean;
    /** Show only the mark on small screens (trainer area header). */
    hideNameOnMobile?: boolean;
    className?: string;
};

export default function BrandLogo({
    linkToHome = true,
    hideNameOnMobile = false,
    className,
}: BrandLogoProps) {
    const content = (
        <>
            <BrandMark />
            <span
                className={cn(
                    'text-lg leading-7 font-semibold tracking-tight',
                    hideNameOnMobile && 'hidden md:inline',
                )}
            >
                MioPersonal
            </span>
        </>
    );

    const classes = cn('flex items-center gap-2.5 text-foreground', className);

    if (!linkToHome) {
        return <span className={classes}>{content}</span>;
    }

    return (
        <Link
            href={home()}
            aria-label="MioPersonal, torna alla home"
            className={classes}
        >
            {content}
        </Link>
    );
}
