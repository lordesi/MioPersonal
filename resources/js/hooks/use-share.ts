import { toast } from 'sonner';
import { useClipboard } from '@/hooks/use-clipboard';

/**
 * "Condividi" on the trainer and gym profiles: the share sheet of the
 * phone, or the link copied where there is none (desktop browsers).
 */
export function useShare(title: string): () => Promise<void> {
    const [, copy] = useClipboard();

    return async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // The visitor closed the share sheet: nothing to do.
            }

            return;
        }

        if (await copy(url)) {
            toast('Link copiato');
        }
    };
}
