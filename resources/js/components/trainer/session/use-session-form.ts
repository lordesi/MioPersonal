import { router } from '@inertiajs/react';
import { useState } from 'react';
import { labelMinutes, minutesLabel } from '@/components/mp/wheel-picker';
import {
    CLIENT_ERROR_KEYS,
    clientError,
    useClientPicker,
} from '@/components/trainer/session/use-client-picker';
import { store } from '@/routes/trainer/calendar/sessions';
import type { SessionOptions } from '@/types';

type Errors = Partial<Record<string, string>>;

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
};

/** The messages shown under QUANDO. */
const WHEN_KEYS = ['date', 'start', 'time', 'minutes'];

/**
 * The state of "Nuova seduta", shared by the sheet of phones and the
 * popover of desktop (design "Trainer · Popover · nuovo"): the client, when,
 * which session, how long, where, the note, and "Dal pacchetto" for a
 * client with a package still to use. `save` sends it to
 * TrainerManualSessionController::store.
 */
export function useSessionForm(
    options: SessionOptions,
    start: SessionFormStart,
) {
    const { clients, services, places } = options;
    const first = clients.find((item) => item.id === start.clientId);

    // A package lasts its own minutes: chosen with the client.
    const [usePackage, setUsePackage] = useState(true);
    const [serviceId, setServiceId] = useState(services[0]?.id ?? 0);
    const [minutes, setMinutes] = useState(
        first?.package?.minutes ?? services[0]?.minutes ?? 60,
    );
    const client = useClientPicker(clients, start.clientId, (picked) => {
        setUsePackage(true);

        if (picked.package) {
            setMinutes(picked.package.minutes);
        }
    });
    const [date, setDate] = useState(
        start.date < start.today ? start.today : start.date,
    );
    const [time, setTime] = useState(start.time ?? '18:00');
    const [placeId, setPlaceId] = useState(places[0]?.id ?? 0);
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    const endMinutes = Math.min(labelMinutes(time) + minutes, 24 * 60);
    /** The package of the client chosen, whether it is used or not. */
    const clientPackage = client.chosen?.package ?? null;
    const packageId = usePackage && clientPackage ? clientPackage.id : null;

    return {
        client,
        services,
        places,
        clientPackage,
        /** "Dal pacchetto" chosen (true) or "Seduta singola". */
        usePackage: packageId !== null,
        setUsePackage,
        serviceId,
        chooseService: (id: number) => {
            setServiceId(id);
            const next = services.find((item) => item.id === id);

            if (next && packageId === null) {
                setMinutes(next.minutes);
            }
        },
        minutes,
        setMinutes,
        date,
        setDate,
        time,
        /** A new start keeps the length, as long as it ends by midnight. */
        setTime: (next: string) => {
            setTime(next);
            setMinutes((current) =>
                Math.max(
                    MIN_MINUTES,
                    Math.min(current, 24 * 60 - labelMinutes(next)),
                ),
            );
        },
        /** "19:00": the end, from the start and the minutes. */
        end: minutesLabel(endMinutes),
        placeId,
        setPlaceId,
        note,
        setNote,
        errors,
        processing,
        clientError: clientError(errors),
        whenError: WHEN_KEYS.map((key) => errors[key]).find(Boolean),
        packageError: errors.client_package_id,
        /** The other messages of the server, once each. */
        otherErrors: [
            ...new Set(
                Object.entries(errors)
                    .filter(
                        ([key]) =>
                            ![
                                ...CLIENT_ERROR_KEYS,
                                ...WHEN_KEYS,
                                'client_package_id',
                            ].includes(key),
                    )
                    .map(([, message]) => message ?? ''),
            ),
        ].filter(Boolean),
        save: (onSaved: () => void) =>
            router.post(
                store.url(),
                {
                    ...client.fields,
                    service_id: serviceId,
                    date,
                    time,
                    minutes,
                    place_id: places.length > 1 ? placeId : null,
                    client_package_id: packageId,
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
