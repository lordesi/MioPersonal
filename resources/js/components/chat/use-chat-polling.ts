import { useEffect, useRef } from 'react';
import { fetchNewMessages, POLL_MS } from '@/lib/chat';
import type { ChatMessage } from '@/types';

/**
 * Asks for the new messages of the open conversation every few seconds.
 * Paused while the tab is hidden, and right away again when it comes back.
 * A failed request is simply tried again at the next tick.
 */
export function useChatPolling(
    recordId: number,
    lastId: number,
    onMessages: (messages: ChatMessage[], otherReadAt: string | null) => void,
): void {
    const last = useRef(lastId);
    const handler = useRef(onMessages);

    useEffect(() => {
        last.current = lastId;
        handler.current = onMessages;
    });

    useEffect(() => {
        let busy = false;
        let stopped = false;

        const tick = async () => {
            if (busy || document.hidden) {
                return;
            }

            busy = true;

            try {
                const { messages, otherReadAt } = await fetchNewMessages(
                    recordId,
                    last.current,
                );

                // Also without new messages: "Visto" can change on its own.
                if (!stopped) {
                    handler.current(messages, otherReadAt);
                }
            } catch {
                // Offline for a moment: the next tick tries again.
            } finally {
                busy = false;
            }
        };

        const timer = window.setInterval(tick, POLL_MS);
        const onVisible = () => {
            if (!document.hidden) {
                void tick();
            }
        };

        document.addEventListener('visibilitychange', onVisible);

        return () => {
            stopped = true;
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [recordId]);
}
