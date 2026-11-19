import { router } from '@inertiajs/react';
import { useState } from 'react';
import { labelMinutes, minutesLabel } from '@/components/mp/wheel-picker';
import { store } from '@/routes/trainer/calendar/sessions';
import type { InvitePrompt, SessionOptions } from '@/types';

type Errors = Partial<Record<string, string>>;

/** The client: someone of the list, or someone new written in the form. */
export type ClientMode = 'search' | 'new';

/** Shortest and longest session (CreateTrainerSession::MIN/MAX_MINUTES). */
export const MIN_MINUTES = 15;
export const MAX_MINUTES = 240;

export type SessionFormStart = {
    /** "YYYY-MM-DD": the day chosen in the calendar. */
    date: string;
    /** "HH:MM": the hour clicked in the grid, if any. */
    time?: string;
    /** "YYYY-MM-DD", Rome. */
    today: string;
    /** "Prenota" from a client's card. */
    clientId?: number;
    /**
     * The sheet of phones has one field, "Nome e cognome": a name not in the
     * list is a new client. The popover of desktop has "Cerca cliente" (only
     * the list) and "Nuovo cliente" (Nome + Cognome).
     */
    layout: 'sheet' | 'popover';
};

/**
 * The state of "Aggiungi seduta", shared by the glass sheet of phones and
 * the popover of desktop: who, which session, when, and the notes. `save`
 * sends it to TrainerManualSessionController::store.
 */
export function useSessionForm(
    options: SessionOptions,
    start: SessionFormStart,
) {
    const { clients, services, places } = options;
    const preselected = clients.find((item) => item.id === start.clientId);

    const [clientId, setClientId] = useState<number | null>(
        preselected?.id ?? null,
    );
    const [mode, setMode] = useState<ClientMode>('search');
    // Phones: "Nome e cognome" (a search of the list or a new name).
    // Desktop: the search of "Cerca cliente".
    const [query, setQuery] = useState(preselected?.name ?? '');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
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
    const service = services.find((item) => item.id === serviceId) ?? null;
    const endMinutes = Math.min(labelMinutes(time) + minutes, 24 * 60);
    const needle = query.trim().toLowerCase();
    const matches =
        needle === '' || chosen
            ? []
            : clients
                  .filter((item) => item.name.toLowerCase().includes(needle))
                  .slice(0, 6);

    /** The name of the new client: "Nome e cognome" or Nome + Cognome. */
    const newName =
        start.layout === 'sheet'
            ? query.trim()
            : mode === 'new'
              ? `${firstName} ${lastName}`.trim()
              : null;

    const pick = (id: number | null) => {
        setClientId(id);
        setQuery(clients.find((item) => item.id === id)?.name ?? '');
    };

    return {
        clients,
        services,
        places,
        chosen,
        service,
        matches,
        mode,
        setMode: (next: ClientMode) => {
            setMode(next);
            setClientId(null);
        },
        query,
        setQuery: (value: string) => {
            setQuery(value);
            setClientId(null);
        },
        pick,
        firstName,
        setFirstName,
        lastName,
        setLastName,
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
        setEnd: (value: string) =>
            setMinutes(
                Math.min(
                    MAX_MINUTES,
                    Math.max(
                        MIN_MINUTES,
                        labelMinutes(value) - labelMinutes(time),
                    ),
                ),
            ),
        placeId,
        setPlaceId,
        note,
        setNote,
        errors,
        processing,
        /** The client gets a proposal to accept ("Invia proposta"). */
        proposal: chosen?.registered ?? false,
        /** A new person: the contacts are asked. */
        isNew: chosen === null && newName !== null,
        clientError:
            errors.client_record_id ??
            errors.new_client ??
            errors['new_client.name'],
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
                                'date',
                                'start',
                                'time',
                                'minutes',
                            ].includes(key),
                    )
                    .map(([, message]) => message ?? ''),
            ),
        ].filter(Boolean),
        save: (onSaved: (invite: InvitePrompt | null) => void) =>
            router.post(
                store.url(),
                {
                    client_record_id: chosen?.id ?? null,
                    new_client:
                        chosen || newName === null
                            ? null
                            : { name: newName, email, phone },
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
                    // "Invita Marco su Miopersonal": only for someone without an account.
                    onSuccess: (page) =>
                        onSaved(
                            (
                                page.flash as
                                    | { invitePrompt?: InvitePrompt }
                                    | undefined
                            )?.invitePrompt ?? null,
                        ),
                },
            ),
    };
}

export type SessionForm = ReturnType<typeof useSessionForm>;
