import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import BookingAside from '@/components/profile/booking-aside';
import BookingBar from '@/components/profile/booking-bar';
import Certifications from '@/components/profile/certifications';
import PhotoGallery from '@/components/profile/photo-gallery';
import ProfileIntro from '@/components/profile/profile-intro';
import ProfileMobileHeader from '@/components/profile/profile-mobile-header';
import ProfileSection from '@/components/profile/profile-section';
import ReviewsSection from '@/components/profile/reviews-section';
import ServicePicker from '@/components/profile/service-picker';
import SimilarTrainers from '@/components/profile/similar-trainers';
import SlotPicker from '@/components/profile/slot-picker';
import TrainingPlaces from '@/components/profile/training-places';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useClipboard } from '@/hooks/use-clipboard';
import { useFavorite } from '@/hooks/use-favorite';
import {
    freeStarts,
    serviceDurations,
    serviceOption,
    toWeeks,
} from '@/lib/booking';
import { searchUrl } from '@/lib/search';
import { home } from '@/routes';
import { book } from '@/routes/trainers';
import { start as startBooking } from '@/routes/trainers/book';
import type { TrainerProfile, TrainerReview, TrainerService } from '@/types';

/** Light links on the dark block, as in the search. */
const crumbLink = 'text-primary-foreground/60 hover:text-primary-foreground';

type ProfileProps = {
    trainer: TrainerProfile;
    /** Not approved yet: only its trainer and the team can see it. */
    preview: boolean;
    /** Every review, loaded by "Mostra tutte le recensioni". */
    allReviews?: TrainerReview[];
};

export default function Profile({
    trainer,
    preview,
    allReviews,
}: ProfileProps) {
    const page = usePage();
    const user = page.props.auth?.user;
    const firstName = trainer.name.split(' ')[0];
    const weeks = toWeeks(trainer.availability);

    /** First day of a week with at least one free slot of `minutes`. */
    const firstFreeDate = (weekIndex: number, minutes: number) => {
        const week = weeks[weekIndex] ?? [];

        return (
            week.find((day) => freeStarts(day, minutes).length > 0)?.date ??
            week[0]?.date ??
            null
        );
    };

    const favorite = useFavorite(trainer.slug, trainer.favorite);
    /** 1 hour when the service offers it, otherwise the shortest duration. */
    const defaultMinutes = (item: TrainerService) => {
        const durations = serviceDurations(item);

        return durations.includes(60) ? 60 : (durations[0] ?? 60);
    };

    // Back from login or sign-up: the slot chosen before is still chosen.
    const [choice] = useState(() => savedChoice(page.url, trainer, weeks));
    const [serviceId, setServiceId] = useState(choice.service.id);
    const [minutes, setMinutes] = useState(
        () => choice.minutes ?? defaultMinutes(choice.service),
    );
    const [weekIndex, setWeekIndex] = useState(choice.weekIndex);
    const [date, setDate] = useState(
        () => choice.date ?? firstFreeDate(0, minutes),
    );
    const [start, setStart] = useState<string | null>(choice.start);
    const [booking, setBooking] = useState(false);

    const service =
        trainer.services.find((item) => item.id === serviceId) ??
        trainer.services[0];

    const changeMinutes = (newMinutes: number) => {
        setMinutes(newMinutes);
        setStart(null);

        const day = weeks[weekIndex]?.find((item) => item.date === date);

        if (!day || freeStarts(day, newMinutes).length === 0) {
            setDate(firstFreeDate(weekIndex, newMinutes));
        }
    };

    const changeService = (id: number) => {
        setServiceId(id);

        const next = trainer.services.find((item) => item.id === id);

        if (next && !serviceDurations(next).includes(minutes)) {
            changeMinutes(defaultMinutes(next));
        }
    };

    const changeWeek = (index: number) => {
        setWeekIndex(index);
        setDate(firstFreeDate(index, minutes));
        setStart(null);
    };

    const changeDate = (newDate: string) => {
        setDate(newDate);
        setStart(null);
    };

    /**
     * "Prenota questo slot". Guests go through login or sign-up and come back
     * here with the same choice; clients send the request.
     */
    const bookSlot = () => {
        if (!start) {
            return;
        }

        // Each duration of a service is a row of its own: the one booked.
        const serviceId = serviceOption(service, minutes).serviceId;

        if (!user) {
            router.visit(
                startBooking.url(trainer.slug, {
                    query: {
                        servizio: serviceId,
                        durata: minutes,
                        inizio: start,
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
                ? { client_package_id: service.packageId, start }
                : { service_id: serviceId, start, minutes },
            {
                preserveScroll: true,
                onStart: () => setBooking(true),
                onFinish: () => setBooking(false),
                onError: (errors) => {
                    toast.error(
                        errors.start ??
                            errors.client_package_id ??
                            errors.minutes ??
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

    const [, copy] = useClipboard();

    const share = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({ title: trainer.name, url });
            } catch {
                // The visitor closed the share sheet: nothing to do.
            }

            return;
        }

        if (await copy(url)) {
            toast('Link copiato');
        }
    };

    // Back to the trainers of the same city.
    const citySearchHref = searchUrl({}, trainer.city?.slug);

    return (
        <>
            <Head title={trainer.name} />
            <ProfileMobileHeader backHref={citySearchHref} onShare={share} />

            {/* The dark block, like the header: breadcrumb, photos and name. */}
            <div className="bg-primary text-primary-foreground">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-6.5 px-4 pt-5.5 pb-10 md:px-8">
                    {preview && (
                        <p
                            role="status"
                            className="rounded-xl border border-primary-foreground/40 px-3.5 py-3 text-sm"
                        >
                            <strong>Anteprima:</strong> il profilo non è ancora
                            pubblico. Lo vedi solo tu (e il nostro team) finché
                            non viene approvato.
                        </p>
                    )}
                    <Breadcrumb
                        aria-label="Percorso"
                        className="hidden md:block"
                    >
                        <BreadcrumbList className="gap-2 text-[13px] leading-[18px] text-primary-foreground/60 sm:gap-2">
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild className={crumbLink}>
                                    <Link href={home()}>Home</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>/</BreadcrumbSeparator>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild className={crumbLink}>
                                    <Link href={citySearchHref}>
                                        {trainer.city
                                            ? `Personal trainer a ${trainer.city.name}`
                                            : 'Personal trainer'}
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>/</BreadcrumbSeparator>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-primary-foreground">
                                    {trainer.name}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Only the gallery: the profile photo is next to the name. */}
                    {trainer.photos.length > 0 && (
                        <PhotoGallery
                            trainerName={trainer.name}
                            photos={trainer.photos}
                        />
                    )}

                    <ProfileIntro
                        trainer={trainer}
                        favorite={favorite.canSave ? favorite.pressed : null}
                        onFavoriteChange={favorite.change}
                        onShare={share}
                    />
                </div>
            </div>

            <div className="flex-1 bg-muted">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 pt-7 pb-10 md:px-8 md:pb-14">
                    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
                        <div className="flex min-w-0 flex-col gap-4.5">
                            {trainer.bio.length > 0 && (
                                <ProfileSection
                                    titleId="bio-title"
                                    title="Chi sono"
                                    className="order-1"
                                >
                                    {trainer.bio.map((paragraph) => (
                                        <p
                                            key={paragraph}
                                            // break-words: a very long word wraps instead of going under the prices.
                                            className="text-base leading-[26px] break-words text-foreground/80"
                                        >
                                            {paragraph}
                                        </p>
                                    ))}
                                </ProfileSection>
                            )}

                            {/* Below lg the booking box is replaced by this section and the bottom bar. */}
                            <ProfileSection
                                titleId="services-title"
                                title="Servizi e prezzi"
                                className="order-2 lg:hidden"
                            >
                                <ServicePicker
                                    variant="detailed"
                                    legend="Tocca un servizio per sceglierlo, poi giorno e orario qui sotto"
                                    services={trainer.services}
                                    value={service.id}
                                    onChange={changeService}
                                />
                                <p className="text-xs font-medium text-muted-foreground">
                                    Prezzi indicativi. Il pagamento si concorda
                                    con il trainer.
                                </p>
                            </ProfileSection>

                            {weeks[weekIndex] && (
                                <div className="order-4 lg:order-3">
                                    <SlotPicker
                                        serviceName={service.name}
                                        week={weeks[weekIndex]}
                                        weekIndex={weekIndex}
                                        weekCount={weeks.length}
                                        onWeekChange={changeWeek}
                                        durations={serviceDurations(service)}
                                        minutes={minutes}
                                        onMinutesChange={changeMinutes}
                                        selectedDate={date}
                                        onDateChange={changeDate}
                                        selectedStart={start}
                                        onStartChange={setStart}
                                    />
                                </div>
                            )}

                            {/* Sections without content are left out, title included. */}
                            {trainer.places.length > 0 && (
                                <div className="order-3 lg:order-4">
                                    <TrainingPlaces
                                        places={trainer.places}
                                        online={trainer.online}
                                        trainerFirstName={firstName}
                                    />
                                </div>
                            )}
                            {trainer.certifications.length > 0 && (
                                <div className="order-5">
                                    <Certifications
                                        certifications={trainer.certifications}
                                    />
                                </div>
                            )}
                            {/* Without reviews ReviewsSection is empty. */}
                            {trainer.rating !== null && (
                                <div className="order-7">
                                    <ReviewsSection
                                        trainer={trainer}
                                        allReviews={allReviews}
                                    />
                                </div>
                            )}
                        </div>

                        <BookingAside
                            services={trainer.services}
                            service={service}
                            onServiceChange={changeService}
                            minutes={minutes}
                            selectedStart={start}
                            confirmLabel={trainer.confirmLabel}
                            onBook={bookSlot}
                            booking={booking}
                        />
                    </div>

                    <SimilarTrainers
                        trainers={trainer.similarTrainers}
                        searchHref={citySearchHref}
                    />
                </div>
            </div>

            <BookingBar
                service={service}
                minutes={minutes}
                selectedStart={start}
                onBook={bookSlot}
                booking={booking}
            />
        </>
    );
}

/**
 * The choice kept in the URL by BookingController::start (?servizio=…&durata=…
 * &inizio=…), checked against the current offer: anything no longer valid is
 * left out, and the page starts from its defaults. `servizio` is the booked
 * row: the service that has it among its options.
 */
function savedChoice(
    url: string,
    trainer: TrainerProfile,
    weeks: ReturnType<typeof toWeeks>,
): {
    service: TrainerService;
    minutes: number | null;
    weekIndex: number;
    date: string | null;
    start: string | null;
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

    if (!serviceDurations(service).includes(minutes)) {
        return {
            service,
            minutes: null,
            weekIndex: 0,
            date: null,
            start: null,
        };
    }

    const weekIndex = weeks.findIndex((week) =>
        week.some((day) => start && freeStarts(day, minutes).includes(start)),
    );

    if (weekIndex === -1) {
        return { service, minutes, weekIndex: 0, date: null, start: null };
    }

    const day = weeks[weekIndex].find(
        (item) => start && freeStarts(item, minutes).includes(start),
    );

    return { service, minutes, weekIndex, date: day?.date ?? null, start };
}

Profile.layout = { hideHeaderOnMobile: true };
