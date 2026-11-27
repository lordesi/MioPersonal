import { router } from '@inertiajs/react';
import { useState } from 'react';
import { labelMinutes, minutesLabel } from '@/components/mp/wheel-picker';
import { store } from '@/routes/trainer/calendar/sessions';
import type { SessionOptions } from '@/types';

type Errors = Partial<Record<string, string>>;

/** CLIENTE: "Cliente esistente" (from the list) or "Nuovo cliente". */
export type ClientMode = 'search' | 'new';

/** Shortest and longest session (CreateTrainerSession::MIN/MAX_MINUTES). */
export const MIN_MINUTES = 15;
export const MAX_MINUTES = 240;

/** How many clients the list shows at once (design: 4). */
const LIST_SIZE = 4;

export type SessionFormStart = {
    /** "YYYY-MM-DD": the day chosen in the calendar. */
    date: string;
    /** "HH:MM": the hour clicked in the grid, if any. */
    time?: string;
    /** "YYYY-MM-DD", Rome. */
    today: string;
    /** "Prenota" from a client's card. */
    clientId?: number;
};

/**
 * The state of "Nuova seduta", shared by the sheet of phones and the
 * popover of desktop (design "Trainer · Popover · nuovo"): the client, when,
 * which session, how long, where, the note. `save` sends it to
 * TrainerManualSessionController::store.
 */
export function useSessionForm(
    options: SessionOptions,
    start: SessionFormStart,
) {
    const { clients, services, places } = options;

    const [mode, setMode] = useState<ClientMode>('search');
    const [clientId, setClientId] = useState<number | null>(
        clients.find((item) => item.id === start.clientId)?.id ?? null,
    );
    const [query, setQuery] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [serviceId, setServiceId] = useState(services[0]?.id ?? 0);
    const [minutes, setMinutes] = useState(services[0]?.minutes ?? 60);
    const [date, setDate] = useState(
        start.date < start.today ? start.today : start.date,
    );
    const [time, setTime] = useState(start.time ?? '18:00');
    const [placeId, setPlaceId] = useState(places[0]?.id ?? 0);
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    const chosen = clients.find((item) => item.id === clientId) ?? null;
    const endMinutes = Math.min(labelMinutes(time) + minutes, 24 * 60);
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
        services,
        places,
        chosen,
        /** The clients of the list under the search. */
        matches: list.slice(0, LIST_SIZE),
        mode,
        setMode,
        query,
        setQuery,
        pick: setClientId,
        name,
        setName,
        phone,
        setPhone,
        email,
        setEmail,
        serviceId,
        chooseService: (id: number) => {
            setServiceId(id);
            const next = services.find((item) => item.id === id);

            if (next) {
                setMinutes(next.minutes);
            }
        },
        minutes,
        setMinutes,
        date,
        setDate,
        time,
        setTime,
        /** "19:00": the end, from the start and the minutes. */
        end: minutesLabel(endMinutes),
        placeId,
        setPlaceId,
        note,
        setNote,
        errors,
        processing,
        clientError:
            errors.client_record_id ??
            errors.new_client ??
            errors['new_client.name'] ??
            errors['new_client.email'] ??
            errors['new_client.phone'],
        whenError: errors.date ?? errors.start ?? errors.time ?? errors.minutes,
        /** The other messages of the server, once each. */
        otherErrors: [
            ...new Set(
                Object.entries(errors)
                    .filter(
                        ([key]) =>
                            ![
                                'client_record_id',
                                'new_client',
                                'new_client.name',
                                'new_client.email',
                                'new_client.phone',
                                'date',
                                'start',
                                'time',
                                'minutes',
                            ].includes(key),
                    )
                    .map(([, message]) => message ?? ''),
            ),
        ].filter(Boolean),
        save: (onSaved: () => void) =>
            router.post(
                store.url(),
                {
                    client_record_id: mode === 'search' ? clientId : null,
                    new_client:
                        mode === 'new'
                            ? { name: name.trim(), email, phone }
                            : null,
                    service_id: serviceId,
                    date,
                    time,
                    minutes,
                    place_id: places.length > 1 ? placeId : null,
                    note,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onStart: () => setProcessing(true),
                    onFinish: () => setProcessing(false),
                    onError: setErrors,
                    onSuccess: onSaved,
                },
            ),
    };
}

export type SessionForm = ReturnType<typeof useSessionForm>;
