import type { CardStat, ProfileCardProps } from '@/components/mp/profile-card';
import {
    formatDayShort,
    formatDuration,
    formatPrice,
    formatRating,
    formatTime,
} from '@/lib/format';
import type {
    CourseSummary,
    GroupSessionSummary,
    GymSummary,
    TrainerSummary,
} from '@/types';

type CardData = Omit<ProfileCardProps, 'favorite' | 'className'>;

const onlineLabels = { also: 'Anche', only: 'Solo' } as const;

/** "domani 18:00" → "Domani 18:00": it stands alone in the card. */
const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

/** A trainer of the searches and of the home: rating, online, first free slot. */
export function trainerCard(trainer: TrainerSummary): CardData {
    const stats: CardStat[] = [];
    const price = formatPrice(trainer.priceFromCents);

    if (trainer.rating !== null) {
        stats.push({
            star: true,
            value: formatRating(trainer.rating),
            label:
                trainer.reviewCount === 1
                    ? '1 recensione'
                    : `${trainer.reviewCount} recensioni`,
        });
    }

    stats.push(
        trainer.online
            ? { value: 'Online', label: onlineLabels[trainer.online] }
            : { value: 'In sede', label: 'Modalità' },
    );

    stats.push({
        value: trainer.nextSlotLabel
            ? capitalize(trainer.nextSlotLabel)
            : 'Nessuno',
        label: 'Primo slot',
    });

    return {
        name: trainer.name,
        href: trainer.href,
        image: trainer.photoUrl,
        // No reviews yet: a new profile.
        badge: trainer.rating === null ? 'Nuovo' : null,
        subtitle: [...trainer.disciplines, trainer.city].join(' · '),
        stats,
        price: { from: 'a partire da', amount: price, unit: '/ seduta' },
        cta: 'Prenota',
        ariaLabel: `${trainer.name}, ${trainer.city}, da ${price} a seduta`,
    };
}

/** A gym: address, services and trainers, the cheapest monthly plan. */
export function gymCard(gym: GymSummary): CardData {
    return {
        kind: 'gym',
        name: gym.name,
        href: gym.href,
        image: gym.coverUrl,
        badge: gym.promotion ? 'Promo' : null,
        location: `${gym.address}, ${gym.city}`,
        stats: [
            { value: gym.amenityCount, label: 'Servizi' },
            { value: gym.trainerCount, label: 'Trainer' },
        ],
        price:
            gym.monthlyFromCents === null
                ? null
                : {
                      from: 'a partire da',
                      amount: formatPrice(gym.monthlyFromCents),
                      unit: '/ mese',
                  },
        cta: 'Scopri',
        ariaLabel: `${gym.name}, ${gym.address}, ${gym.city}`,
    };
}

/** An event: the day on the photo, start, length and places left. */
export function eventCard(event: GroupSessionSummary): CardData {
    const host = event.hosts[0]?.name;
    const minutes = Math.round(
        (new Date(event.end).getTime() - new Date(event.start).getTime()) /
            60000,
    );
    const day = formatDayShort(event.start);

    return {
        name: event.title,
        href: event.href,
        image: event.coverUrl,
        badge: day,
        subtitle: `${event.typeLabel} · ${host ? `con ${host}` : event.place}`,
        stats: [
            { value: formatTime(event.start), label: 'Inizio' },
            { value: formatDuration(minutes), label: 'Durata' },
            { value: event.remaining, label: 'Posti liberi' },
        ],
        price: { from: 'Ingresso', amount: event.price },
        cta: 'Iscriviti',
        ariaLabel: `${event.title}, ${day} alle ${formatTime(event.start)}, ${event.place}`,
    };
}

/**
 * A weekly course of a gym: the days and hours on the photo (as the day of
 * an event), the gym with the pin. No price (ask the gym) and no heart
 * (courses can't be saved).
 */
export function courseCard(course: CourseSummary): CardData {
    const stats: CardStat[] = [{ value: course.level, label: 'Livello' }];

    if (course.discipline) {
        stats.unshift({ value: course.discipline, label: 'Disciplina' });
    }

    if (course.maxPlaces !== null) {
        stats.push({ value: course.maxPlaces, label: 'Posti' });
    }

    return {
        kind: 'course',
        name: course.name,
        href: course.href,
        image: course.photoUrl,
        badge: course.when,
        location: `${course.gym.name}, ${course.gym.city}`,
        stats,
        price: null,
        cta: 'Scopri',
        ariaLabel: `${course.name}, ${course.when}${course.instructor ? `, con ${course.instructor}` : ''}, ${course.gym.name}, ${course.gym.city}`,
    };
}
