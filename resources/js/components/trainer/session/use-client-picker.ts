import { useState } from 'react';
import type { SessionOptions } from '@/types';

/** CLIENTE: "Cliente esistente" (from the list) or "Nuovo cliente". */
export type ClientMode = 'search' | 'new';

export type PickerClient = SessionOptions['clients'][number];

/** How many clients the list shows at once (design: 4). */
const LIST_SIZE = 4;

/**
 * CLIENTE of "Aggiungi seduta" and "Aggiungi pacchetto": someone of the
 * list (searched and chosen) or someone new, with name and contacts.
 * `fields` is what the server wants (TrainerManualSessionController,
 * TrainerPackageController).
 */
export function useClientPicker(
    clients: PickerClient[],
    startId?: number,
    onPick?: (client: PickerClient) => void,
) {
    const [mode, setMode] = useState<ClientMode>('search');
    const [clientId, setClientId] = useState<number | null>(
        clients.find((item) => item.id === startId)?.id ?? null,
    );
    const [query, setQuery] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const chosen = clients.find((item) => item.id === clientId) ?? null;
    const needle = query.trim().toLowerCase();
    const found = clients.filter((item) =>
        item.name.toLowerCase().includes(needle),
    );
    // The client chosen stays in sight, first, while searching others.
    const list =
        chosen && !found.slice(0, LIST_SIZE).includes(chosen)
            ? [chosen, ...found.filter((item) => item !== chosen)]
            : found;

    return {
        clients,
        /** The one chosen of the list; null with "Nuovo cliente" too. */
        chosen: mode === 'search' ? chosen : null,
        /** The clients of the list under the search. */
        matches: list.slice(0, LIST_SIZE),
        mode,
        setMode,
        query,
        setQuery,
        pick: (id: number) => {
            setClientId(id);
            const client = clients.find((item) => item.id === id);

            if (client) {
                onPick?.(client);
            }
        },
        name,
        setName,
        phone,
        setPhone,
        email,
        setEmail,
        fields: {
            client_record_id: mode === 'search' ? clientId : null,
            new_client:
                mode === 'new' ? { name: name.trim(), email, phone } : null,
        },
    };
}

export type ClientPicker = ReturnType<typeof useClientPicker>;

/** The keys of the server's messages about CLIENTE. */
export const CLIENT_ERROR_KEYS = [
    'client_record_id',
    'new_client',
    'new_client.name',
    'new_client.email',
    'new_client.phone',
];

/** The first message about CLIENTE. */
export function clientError(
    errors: Partial<Record<string, string>>,
): string | undefined {
    return CLIENT_ERROR_KEYS.map((key) => errors[key]).find(Boolean);
}
