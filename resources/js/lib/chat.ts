import { xsrfToken } from '@/lib/notifications';
import { older, poll, store } from '@/routes/messages';
import type { ChatMessage } from '@/types';

/** How often the open conversation asks for new messages. */
export const POLL_MS = 3000;

/** How often the list on the left is refreshed. */
export const LIST_POLL_MS = 20000;

/** As in Message::BODY_MAX, ATTACHMENT_MAX_KB, PHOTO_MAX_KB and ATTACHMENT_DAYS. */
export const BODY_MAX = 2000;
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_DAYS = 10;

/** Photos chosen at once, at most: each one is sent as its own message. */
export const PHOTOS_AT_ONCE = 6;

/** Same sender within these minutes: one group of bubbles. */
const GROUP_MS = 5 * 60 * 1000;

const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
};

/** The first validation message of a 422, or a generic one. */
export class ChatError extends Error {}

async function json<T>(response: Response): Promise<T> {
    if (response.ok) {
        return response.json();
    }

    if (response.status === 422) {
        const data = (await response.json()) as {
            errors?: Record<string, string[]>;
        };
        const first = Object.values(data.errors ?? {})[0]?.[0];

        throw new ChatError(first ?? 'Controlla il messaggio e riprova.');
    }

    if (response.status === 429) {
        throw new ChatError(
            'Stai scrivendo troppo in fretta: riprova tra poco.',
        );
    }

    throw new ChatError('Non siamo riusciti a inviare. Riprova tra poco.');
}

/** The messages after `after`, oldest first, and when the other person last read. */
export async function fetchNewMessages(
    recordId: number,
    after: number,
): Promise<{ messages: ChatMessage[]; otherReadAt: string | null }> {
    const response = await fetch(
        poll.url(recordId, { query: { after: String(after) } }),
        { credentials: 'same-origin', headers },
    );
    const data = await json<{
        messages: ChatMessage[];
        otherReadAt?: string | null;
    }>(response);

    return { messages: data.messages, otherReadAt: data.otherReadAt ?? null };
}

/** The page before `before`, oldest first. */
export async function fetchOlderMessages(
    recordId: number,
    before: number,
): Promise<{ messages: ChatMessage[]; hasOlder: boolean }> {
    const response = await fetch(
        older.url(recordId, { query: { before: String(before) } }),
        { credentials: 'same-origin', headers },
    );

    return json(response);
}

/** Text, and a PDF or a photo (one per message). */
export async function sendMessage(
    recordId: number,
    body: string,
    files: { pdf?: File | null; photo?: File | null } = {},
): Promise<ChatMessage> {
    const form = new FormData();

    if (body.trim() !== '') {
        form.append('body', body.trim());
    }

    if (files.pdf) {
        form.append('attachment', files.pdf);
    }

    if (files.photo) {
        form.append('photo', files.photo);
    }

    const response = await fetch(store.url(recordId), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { ...headers, 'X-XSRF-TOKEN': xsrfToken() },
        body: form,
    });
    const data = await json<{ message: ChatMessage }>(response);

    return data.message;
}

/** Adds the new messages once each, in order of id. */
export function mergeMessages(
    current: ChatMessage[],
    incoming: ChatMessage[],
): ChatMessage[] {
    const known = new Set(current.map((message) => message.id));
    const fresh = incoming.filter((message) => !known.has(message.id));

    if (fresh.length === 0) {
        return current;
    }

    return [...current, ...fresh].sort((a, b) => a.id - b.id);
}

/** The next message is from the same person, a few minutes later: same group. */
export function sameGroup(
    message: ChatMessage,
    next: ChatMessage | undefined,
): boolean {
    if (next === undefined || next.mine !== message.mine) {
        return false;
    }

    if (message.at === null || next.at === null) {
        return true;
    }

    return (
        new Date(next.at).getTime() - new Date(message.at).getTime() <
            GROUP_MS && dayKey(message.at) === dayKey(next.at)
    );
}

/** "12/11/2026" in Rome: the day separators. */
export function dayKey(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
        timeZone: 'Europe/Rome',
    });
}

/** Whole days left before the file is deleted (0 = today). */
export function daysLeft(expiresAt: string, now = Date.now()): number {
    return Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - now) / 86400000),
    );
}

/** "Disponibile ancora 3 giorni", "Disponibile fino a domani", "Scade oggi". */
export function expiryLabel(expiresAt: string, now = Date.now()): string {
    const days = daysLeft(expiresAt, now);

    if (days === 0) {
        return 'Scade oggi';
    }

    if (days === 1) {
        return 'Disponibile fino a domani';
    }

    return `Disponibile ancora ${days} giorni`;
}

/** The text split in plain parts and links (http/https/www only). */
export function linkify(
    text: string,
): Array<{ text: string; href: string | null }> {
    const parts: Array<{ text: string; href: string | null }> = [];
    const pattern = /\b((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]'"])/gi;
    let last = 0;

    for (const match of text.matchAll(pattern)) {
        const index = match.index ?? 0;

        if (index > last) {
            parts.push({ text: text.slice(last, index), href: null });
        }

        const url = match[0];
        parts.push({
            text: url,
            href: url.toLowerCase().startsWith('www.') ? `https://${url}` : url,
        });
        last = index + url.length;
    }

    if (last < text.length) {
        parts.push({ text: text.slice(last), href: null });
    }

    return parts;
}

/** 245 KB, 1,2 MB */
export function formatFileSize(bytes: number | null): string {
    if (bytes === null) {
        return '';
    }

    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / 1024 / 1024).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB`;
}
