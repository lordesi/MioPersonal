import { toast } from 'sonner';
import { useClipboard } from '@/hooks/use-clipboard';

/**
 * Phones and tablets (a finger, not a mouse) that have the share sheet of
 * the system. Desktop browsers may have one too, but there copying the link
 * is what people expect.
 */
function hasShareSheet(): boolean {
    return (
        typeof navigator.share === 'function' &&
        window.matchMedia('(pointer: coarse)').matches
    );
}

/**
 * "Condividi" on the trainer and gym profiles and in the trainer
 * "Profilo": the share sheet of the phone (the one of iOS on the iPhone),
 * or the link copied on desktop. Without `url`, the page itself.
 */
export function useShare(title: string, url?: string): () => Promise<void> {
    const [, copy] = useClipboard();

    return async () => {
        const link = url ?? window.location.href;

        if (hasShareSheet()) {
            try {
                await navigator.share({ title, url: link });
            } catch {
                // The visitor closed the share sheet: nothing to do.
            }

            return;
        }

        if (await copy(link)) {
            toast('Link copiato');
        } else {
            toast.error('Non siamo riusciti a copiare il link.');
        }
    };
}
