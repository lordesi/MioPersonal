import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import { initialDraft } from '@/components/onboarding/trainer/draft';

/**
 * "Salva e continua dopo": the answers of steps 2–6 are kept in this
 * browser (localStorage), so the trainer finds them when opening "Diventa
 * trainer" again on the same device.
 *
 * Never saved: the account of step 1 (and so never the password), the photo
 * and the certificate files (files don't fit in the browser storage).
 * Every access is in try/catch: in a private window the storage may be off.
 */
type SavedDraft = {
    version: 1;
    /** When it was saved, ISO UTC. */
    savedAt: string;
    /** The last step reached. */
    step: number;
    /** Without files: photo and certificates come back empty. */
    draft: TrainerDraft;
};

/** One draft per account; "ospite" before the account exists. */
function storageKey(userId: number | null): string {
    return `miopersonal:trainer-draft:${userId ?? 'ospite'}`;
}

export function saveDraft(
    userId: number | null,
    draft: TrainerDraft,
    step: number,
): boolean {
    const saved: SavedDraft = {
        version: 1,
        savedAt: new Date().toISOString(),
        step,
        draft,
    };

    try {
        window.localStorage.setItem(
            storageKey(userId),
            // The chosen files (photo, certificates) are left out.
            JSON.stringify(saved, (_key, value: unknown) =>
                value instanceof File ? undefined : value,
            ),
        );

        return true;
    } catch {
        return false;
    }
}

/** The saved draft, merged over the starting values; null when there is none. */
export function loadDraft(
    userId: number | null,
): { draft: TrainerDraft; step: number } | null {
    try {
        const raw = window.localStorage.getItem(storageKey(userId));

        if (raw === null) {
            return null;
        }

        const saved = JSON.parse(raw) as SavedDraft;

        if (saved.version !== 1) {
            return null;
        }

        return {
            // Fields added to the form later get their starting value.
            draft: { ...initialDraft, ...saved.draft, photo: null },
            step: saved.step,
        };
    } catch {
        return null;
    }
}

export function clearDraft(userId: number | null): void {
    try {
        window.localStorage.removeItem(storageKey(userId));
    } catch {
        // Nothing to clear.
    }
}
