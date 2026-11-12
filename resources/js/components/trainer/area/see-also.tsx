import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { availability, services } from '@/routes/trainer';
import { edit as editProfile } from '@/routes/trainer/profile';

type Page = 'profile' | 'services' | 'availability';

const pages: { page: Page; label: string; href: () => string }[] = [
    { page: 'profile', label: 'Modifica profilo', href: editProfile.url },
    { page: 'services', label: 'Servizi e prezzi', href: services.url },
    { page: 'availability', label: 'Disponibilità', href: availability.url },
];

/**
 * "Vedi anche": the three pages that make the public profile (what you are,
 * what you offer, when), linked to each other.
 */
export default function SeeAlso({ current }: { current: Page }) {
    return (
        <nav
            aria-label="Vedi anche"
            className="-mt-2 flex flex-wrap items-center gap-2 text-sm"
        >
            <span className="text-muted-foreground">Vedi anche:</span>
            {pages
                .filter((item) => item.page !== current)
                .map((item) => (
                    <Link
                        key={item.page}
                        href={item.href()}
                        className="inline-flex h-9 items-center gap-1 rounded-full border bg-card px-3.5 font-medium hover:bg-accent"
                    >
                        {item.label}
                        <ArrowRight aria-hidden="true" className="size-3.5" />
                    </Link>
                ))}
        </nav>
    );
}
