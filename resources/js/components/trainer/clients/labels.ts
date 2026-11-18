import { romeParts } from '@/lib/calendar';
import {
    formatAgo,
    formatDayMonthShort,
    formatDayRelative,
    formatMonthYear,
    formatTime,
    formatWeekdayShort,
} from '@/lib/format';
import type { ChatConversation, TrainerClient } from '@/types';

/** "Pacchetto 10 sedute · 9/10", "Richiesta in attesa", "Inattivo", "Non iscritto". */
export function statusOf(client: TrainerClient): {
    text: string;
    tone: 'brand' | 'muted' | 'normal';
} {
    if (client.hasRequest) {
        return { text: 'Richiesta in attesa', tone: 'brand' };
    }

    if (client.package) {
        return {
            text: `${client.package.name} · ${client.package.done}/${client.package.total}`,
            tone: 'normal',
        };
    }

    if (client.nextSession) {
        const day = romeParts(client.nextSession).date;

        return {
            text: `Prossima ${formatWeekdayShort(day).toLowerCase()} ${formatDayMonthShort(day)}`,
            tone: 'normal',
        };
    }

    if (!client.registered) {
        return { text: 'Non ancora iscritto', tone: 'muted' };
    }

    if (client.lastSession) {
        return {
            text: `Inattivo da ${formatMonthYear(client.lastSession)}`,
            tone: 'muted',
        };
    }

    return { text: 'Nuovo cliente', tone: 'normal' };
}

/** "Tu: Ci vediamo alle 9", "Foto", or what to say when there is nothing. */
export function previewOf(
    client: TrainerClient,
    chat: ChatConversation | undefined,
): { text: string; empty: boolean } {
    if (!client.registered) {
        return { text: 'Senza account: niente chat', empty: true };
    }

    const last = chat?.lastMessage;

    if (!last) {
        return { text: 'Non vi siete ancora scritti', empty: true };
    }

    return { text: `${last.mine ? 'Tu: ' : ''}${last.text}`, empty: false };
}

/** "10:05", "Ieri", "lun 3": when the last message came. */
export function whenOf(
    chat: ChatConversation | undefined,
    now = new Date(),
): string {
    const at = chat?.lastMessage?.at;

    if (!at) {
        return '';
    }

    const day = romeParts(at).date;
    const today = romeParts(now).date;

    if (day === today) {
        return formatTime(at);
    }

    const ago = formatAgo(at, now);

    return ago === 'ieri' ? 'Ieri' : formatDayRelative(at, now);
}

/** "Cliente da settembre 2025", from the first session. */
export function sinceOf(client: TrainerClient): string {
    if (client.firstSession) {
        return `${client.lastService || 'Cliente'} · da ${formatMonthYear(client.firstSession)}`;
    }

    return client.registered ? 'Ancora nessuna seduta' : 'Non ancora iscritto';
}
