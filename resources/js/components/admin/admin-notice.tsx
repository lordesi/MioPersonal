import { CircleCheck } from 'lucide-react';

/**
 * Dark bar at the top of an admin page after an action,
 * e.g. "Profilo di Marco Ferri approvato e pubblicato. Email inviata."
 */
export default function AdminNotice({
    message,
    onClose,
}: {
    message: string | null;
    onClose: () => void;
}) {
    if (!message) {
        return null;
    }

    return (
        <div
            role="status"
            className="flex items-center gap-3 rounded-[10px] bg-primary px-3.5 py-3 text-sm text-primary-foreground"
        >
            <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
            <span className="flex-1">{message}</span>
            <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi avviso"
                className="h-7 px-2 text-[13px] underline"
            >
                Chiudi
            </button>
        </div>
    );
}
