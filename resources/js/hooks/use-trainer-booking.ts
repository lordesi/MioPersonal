import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    freeStarts,
    maxPeople,
    serviceDurations,
    serviceOption,
} from '@/lib/booking';
import { book } from '@/routes/trainers';
import { start as startBooking } from '@/routes/trainers/book';
import {
    join as joinWaitlist,
    leave as leaveWaitlist,
} from '@/routes/trainers/waitlist';
import type { AvailabilityDay, TrainerProfile, TrainerService } from '@/types';

/** 1 hour when the service offers it, otherwise the shortest duration. */
function defaultMinutes(service: TrainerService): number {
    const durations = serviceDurations(service);

    return durations.includes(60) ? 60 : (durations[0] ?? 60);
}

/** The first day (from `from` on) with a free start of `minutes`, else the first day. */
function firstFreeDate(
    days: AvailabilityDay[],
    minutes: number,
    from: string | null = null,
): string | null {
    const later = days.filter((day) => from === null || day.date >= from);

    return (
        later.find((day) => freeStarts(day, minutes).length > 0)?.date ??
        days.find((day) => freeStarts(day, minutes).length > 0)?.date ??
        days[0]?.date ??
        null
    );
}

/**
 * The booking of a trainer's profile: service, duration, day, time, place,
 * people and "Ripeti ogni settimana", then the request (POST trainers.book)
 * or, for guests, login or sign-up and back here with the same choice
 * (BookingController::start). Also "Avvisami se si libera" (waiting list).
 */
export function useTrainerBooking(trainer: TrainerProfile) {
    const page = usePage();
    const user = page.props.auth?.user;
    const days = trainer.availability;

    // Back from login or sign-up: the slot chosen before is still chosen.
    const [choice] = useState(() => savedChoice(page.url, trainer));
    const [serviceId, setServiceId] = useState(choice.service.id);
    const [minutes, setMinutes] = useState(
        () => choice.minutes ?? defaultMinutes(choice.service),
    );
    const [date, setDate] = useState(
        () => choice.date ?? firstFreeDate(days, minutes),
    );
    const [start, setStart] = useState<string | null>(choice.start);
    const [booking, setBooking] = useState(false);

    // "Dove": only with more than one place in person (a gym, a studio…).
    const inPersonPlaces = trainer.places.filter(
        (place) => place.type !== 'online',
    );
    const [placeId, setPlaceId] = useState<number | null>(() => {
        const wanted = Number(
            new URLSearchParams(page.url.split('?')[1] ?? '').get('luogo'),
        );

        return inPersonPlaces.some((place) => place.id === wanted)
            ? wanted
            : null;
    });

    const service =
        trainer.services.find((item) => item.id === serviceId) ??
        trainer.services[0];

    // "Invita un amico": up to the most people of the chosen duration.
    const [wantedPeople, setPeople] = useState(choice.people);
    const peopleMax = service ? maxPeople(service, minutes) : 1;
    const people = Math.min(wantedPeople, peopleMax);

    // "Ripeti ogni settimana": alone (not with friends), for a session or a package.
    const [wantsRepeat, setRepeat] = useState(choice.repeat);
    const canRepeat = service?.repeatable === true && people === 1;
    const repeatWeekly = canRepeat && wantsRepeat;

    const changeMinutes = (newMinutes: number) => {
        setMinutes(newMinutes);
        setStart(null);

        const day = days.find((item) => item.date === date);

        if (!day || freeStarts(day, newMinutes).length === 0) {
            setDate(firstFreeDate(days, newMinutes, date));
        }
    };

    const changeService = (id: number) => {
        setServiceId(id);

        const next = trainer.services.find((item) => item.id === id);

        if (next && !serviceDurations(next).includes(minutes)) {
            changeMinutes(defaultMinutes(next));
        }
    };

    const changeDate = (newDate: string) => {
        setDate(newDate);
        setStart(null);
    };

    /** "Avvisami se si libera": a guest goes through login and comes back here. */
    const toggleWaitlist = (day: string, waiting: boolean) => {
        if (!user) {
            router.visit(startBooking.url(trainer.slug));

            return;
        }

        const options = {
            preserveScroll: true,
            only: ['trainer'],
            onError: (errors: Record<string, string>) =>
                toast.error(errors.waitlist ?? 'Riprova tra poco.'),
        };

        if (waiting) {
            router.delete(leaveWaitlist.url(trainer.slug), {
                ...options,
                data: { date: day },
            });
        } else {
            router.post(joinWaitlist.url(trainer.slug), { date: day }, options);
        }
    };

    /**
     * Sends the request. Guests go through login or sign-up and come back
     * here with the same choice; clients send the request.
     */
    const bookSlot = () => {
        if (!start || !service) {
            return;
        }

        // Each duration of a service is a row of its own: the one booked.
        const bookedServiceId = serviceOption(service, minutes).serviceId;

        if (!user) {
            router.visit(
                startBooking.url(trainer.slug, {
                    query: {
                        servizio: bookedServiceId,
                        durata: minutes,
                        inizio: start,
                        luogo: placeId,
                        persone: people > 1 ? people : null,
                        ripeti: repeatWeekly ? 1 : null,
                    },
                }),
            );

            return;
        }

        if (user.role !== 'client') {
            toast.error('Per prenotare serve un account cliente.');

            return;
        }

        router.post(
            book.url(trainer.slug),
            // "Il tuo pacchetto": the package says service and duration.
            service.packageId !== null
                ? {
                      client_package_id: service.packageId,
                      start,
                      place_id: placeId,
                      repeat_weekly: repeatWeekly,
                  }
                : {
                      service_id: bookedServiceId,
                      start,
                      minutes,
                      place_id: placeId,
                      people,
                      repeat_weekly: repeatWeekly,
                  },
            {
                preserveScroll: true,
                onStart: () => setBooking(true),
                onFinish: () => setBooking(false),
                onError: (errors) => {
                    toast.error(
                        errors.start ??
                            errors.place_id ??
                            errors.client_package_id ??
                            errors.minutes ??
                            errors.people ??
                            errors.repeat_weekly ??
                            errors.service_id ??
                            'Riprova tra poco.',
                    );

                    // «Slot appena preso»: show the free slots as they are now.
                    if (errors.start) {
                        setStart(null);
                        router.reload({ only: ['trainer'] });
                    }
                },
            },
        );
    };

    return {
        service,
        changeService,
        minutes,
        durations: service ? serviceDurations(service) : [],
        changeMinutes,
        date,
        changeDate,
        start,
        setStart,
        inPersonPlaces,
        placeId,
        setPlaceId,
        people,
        peopleMax,
        setPeople,
        canRepeat,
        wantsRepeat,
        setRepeat,
        bookSlot,
        booking,
        toggleWaitlist,
        /** Back from the login with a time: the page opens the calendar on it. */
        restored: choice.start !== null,
    };
}

export type TrainerBooking = ReturnType<typeof useTrainerBooking>;

/**
 * The choice kept in the URL by BookingController::start (?servizio=…&durata=…
 * &inizio=…), checked against the current offer: anything no longer valid is
 * left out, and the page starts from its defaults. `servizio` is the booked
 * row: the service that has it among its options.
 */
function savedChoice(
    url: string,
    trainer: TrainerProfile,
): {
    service: TrainerService;
    minutes: number | null;
    date: string | null;
    start: string | null;
    /** "Invita un amico": the page keeps it under the most people of the duration. */
    people: number;
    /** "Ripeti ogni settimana", ticked before login. */
    repeat: boolean;
} {
    const query = new URLSearchParams(url.split('?')[1] ?? '');
    const service =
        trainer.services.find((item) =>
            item.options.some(
                (option) => option.serviceId === Number(query.get('servizio')),
            ),
        ) ?? trainer.services[0];
    const minutes = Number(query.get('durata'));
    const start = query.get('inizio');
    const people = Math.max(1, Number(query.get('persone')) || 1);
    const repeat = query.get('ripeti') === '1';

    if (!service || !serviceDurations(service).includes(minutes)) {
        return {
            service,
            minutes: null,
            date: null,
            start: null,
            people,
            repeat,
        };
    }

    const day = trainer.availability.find(
        (item) => start && freeStarts(item, minutes).includes(start),
    );

    return {
        service,
        minutes,
        date: day?.date ?? null,
        start: day ? start : null,
        people,
        repeat,
    };
}
