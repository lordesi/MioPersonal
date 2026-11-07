import type { LucideProps } from 'lucide-react';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import type { SocialProvider } from '@/types';

/** lucide has no TikTok: the note, drawn like the lucide icons. */
function TikTok(props: LucideProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M9 12a4 4 0 1 0 4 4V3c.6 2.6 2.6 4.6 5 5" />
        </svg>
    );
}

const icons = {
    instagram: Instagram,
    tiktok: TikTok,
    facebook: Facebook,
    youtube: Youtube,
} satisfies Record<SocialProvider, (props: LucideProps) => React.ReactNode>;

export const socialLabels: Record<SocialProvider, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    youtube: 'YouTube',
};

/** The icon of a social; decorative: the name goes in the label next to it. */
export default function SocialIcon({
    provider,
    ...props
}: LucideProps & { provider: SocialProvider }) {
    const Icon = icons[provider];

    return <Icon aria-hidden="true" {...props} />;
}
