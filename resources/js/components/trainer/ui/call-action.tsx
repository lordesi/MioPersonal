import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useClipboard } from '@/hooks/use-clipboard';
import { useIsMobile } from '@/hooks/use-mobile';

type CallActionProps = {
    phone: string;
    /** The person called: "Chiama Marco Verdi". */
    name: string;
    className?: string;
    /** What the button shows: "Chiama" on phones, "Copia numero" on desktop. */
    children: (label: string) => ReactNode;
};

/**
 * "Chiama": on phones a `tel:` link that starts the call. On desktop a call
 * link works only with a calling app set up, so the button copies the
 * number and shows it instead.
 */
export default function CallAction({
    phone,
    name,
    className,
    children,
}: CallActionProps) {
    const isMobile = useIsMobile();
    const [, copy] = useClipboard();

    if (isMobile) {
        return (
            <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                aria-label={`Chiama ${name}`}
                title="Chiama"
                className={className}
            >
                {children('Chiama')}
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={async () => {
                if (await copy(phone)) {
                    toast.success(`Numero copiato: ${phone}`);
                } else {
                    toast(`Numero di ${name}: ${phone}`);
                }
            }}
            aria-label={`Copia il numero di ${name}: ${phone}`}
            title={phone}
            className={className}
        >
            {children('Copia numero')}
        </button>
    );
}
