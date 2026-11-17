import type { GymDraft } from '@/components/onboarding/gym/draft';
import { initialGymDraft } from '@/components/onboarding/gym/draft';

/**
 * "Salva ed esci": the answers of steps 2–5 are kept in this browser
 * (localStorage), so the gym finds them when opening "Registra la palestra"
 * again on the same device. As the trainer's (onboarding/trainer/saved-draft.ts).
 *
 * Never saved: the account of step 1 (and so never the password) and the
 * photos (files don't fit in the browser storage). Every access is in
 * try/catch: in a private window the storage may be off.
 */
type SavedGymDraft = {
    version: 1;
    /** When it was saved, ISO UTC. */
    savedAt: string;
    /** The last step reached. */
    step: number;
    /** Without files: cover and gallery come back empty. */
    draft: GymDraft;
};

/** One draft per account; "ospite" before the account exists. */
function storageKey(userId: number | null): string {
    return `miopersonal:gym-draft:${userId ?? 'ospite'}`;
}

export function saveGymDraft(
    userId: number | null,
    draft: GymDraft,
    step: number,
): boolean {
    const saved: SavedGymDraft = {
        version: 1,
        savedAt: new Date().toISOString(),
        step,
        // The chosen photos are left out.
        draft: { ...draft, cover: null, gallery: [] },
    };

    try {
        window.localStorage.setItem(storageKey(userId), JSON.stringify(saved));

        return true;
    } catch {
        return false;
    }
}

/** The saved draft, merged over the starting values; null when there is none. */
export function loadGymDraft(
    userId: number | null,
): { draft: GymDraft; step: number } | null {
    try {
        const raw = window.localStorage.getItem(storageKey(userId));

        if (raw === null) {
            return null;
        }

        const saved = JSON.parse(raw) as SavedGymDraft;

        if (saved.version !== 1) {
            return null;
        }

        return {
            draft: {
                ...initialGymDraft,
                ...saved.draft,
                cover: null,
                gallery: [],
            },
            step: saved.step,
        };
    } catch {
        return null;
    }
}

export function clearGymDraft(userId: number | null): void {
    try {
        window.localStorage.removeItem(storageKey(userId));
    } catch {
        // Nothing to clear.
    }
}
