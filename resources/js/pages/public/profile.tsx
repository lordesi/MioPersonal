import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import BookingAside from '@/components/profile/booking-aside';
import BookingBar from '@/components/profile/booking-bar';
import Certifications from '@/components/profile/certifications';
import PhotoGallery from '@/components/profile/photo-gallery';
import ProfileIntro from '@/components/profile/profile-intro';
import ProfileMobileHeader from '@/components/profile/profile-mobile-header';
import ReviewsSection from '@/components/profile/reviews-section';
import ServicePicker from '@/components/profile/service-picker';
import SimilarTrainers from '@/components/profile/similar-trainers';
import SlotPicker from '@/components/profile/slot-picker';
import TrainingPlaces from '@/components/profile/training-places';
import ZoneMap from '@/components/profile/zone-map';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useClipboard } from '@/hooks/use-clipboard';
import { freeStarts, toWeeks } from '@/lib/booking';
import { searchUrl } from '@/lib/search';
import { home } from '@/routes';
import type { TrainerProfile } from '@/types';

// TODO: point to the booking/registration flow once it exists.
const BOOK_HREF = '#';

type ProfileProps = {
    trainer: TrainerProfile;
};

export default function Profile({ trainer }: ProfileProps) {
    const firstName = trainer.name.split(' ')[0];
    const weeks = toWeeks(trainer.availability);

    /** First day of a week with at least one free slot of `hours`. */
    const firstFreeDate = (weekIndex: number, hours: number) => {
        const week = weeks[weekIndex] ?? [];

        return (
            week.find((day) => freeStarts(day, hours).length > 0)?.date ??
            week[0]?.date ??
            null
        );
    };

    const [photoIndex, setPhotoIndex] = useState(0);
    const [favorite, setFavorite] = useState(false);
    const [serviceId, setServiceId] = useState(trainer.services[0].id);
    const [hours, setHours] = useState(1);
    const [weekIndex, setWeekIndex] = useState(0);
    const [date, setDate] = useState(() => firstFreeDate(0, 1));
    const [start, setStart] = useState<string | null>(null);

    const service =
        trainer.services.find((item) => item.id === serviceId) ??
        trainer.services[0];

    const changeHours = (newHours: number) => {
        setHours(newHours);
        setStart(null);

        const day = weeks[weekIndex]?.find((item) => item.date === date);

        if (!day || freeStarts(day, newHours).length === 0) {
            setDate(firstFreeDate(weekIndex, newHours));
        }
    };

    const changeService = (id: number) => {
        setServiceId(id);

        const next = trainer.services.find((item) => item.id === id);

        if (next?.fixedDuration && hours > 1) {
            changeHours(1);
        }
    };

    const changeWeek = (index: number) => {
        setWeekIndex(index);
        setDate(firstFreeDate(index, hours));
        setStart(null);
    };

    const changeDate = (newDate: string) => {
        setDate(newDate);
        setStart(null);
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

    return (
        <>
            <Head title={trainer.name} />
            <ProfileMobileHeader backHref={searchUrl()} onShare={share} />

            <div className="mx-auto flex w-full max-w-7xl flex-col md:gap-8 md:px-8 md:pt-8">
                <Breadcrumb aria-label="Percorso" className="hidden md:block">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={home()}>Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={searchUrl()}>
                                    Personal trainer a Milano
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage>{trainer.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <PhotoGallery
                    trainerName={trainer.name}
                    photos={trainer.photos}
                    index={photoIndex}
                    onIndexChange={setPhotoIndex}
                />

                <div className="flex flex-col gap-8 px-4 pt-6 pb-10 md:px-0 md:pt-0 md:pb-20">
                    <ProfileIntro
                        trainer={trainer}
                        favorite={favorite}
                        onFavoriteChange={setFavorite}
                        onShare={share}
                    />

                    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
                        <div className="flex min-w-0 flex-col gap-8">
                            <section
                                aria-labelledby="bio-title"
                                className="order-1 flex flex-col gap-3"
                            >
                                <h2
                                    id="bio-title"
                                    className="text-xl font-semibold tracking-tight md:text-2xl"
                                >
                                    Chi sono
                                </h2>
                                {trainer.bio.map((paragraph) => (
                                    <p
                                        key={paragraph}
                                        className="text-base leading-[26px]"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </section>

                            {/* Below lg the booking box is replaced by this section and the bottom bar. */}
                            <section
                                aria-labelledby="services-title"
                                className="order-2 flex flex-col gap-3 lg:hidden"
                            >
                                <h2
                                    id="services-title"
                                    className="text-xl font-semibold tracking-tight md:text-2xl"
                                >
                                    Servizi e prezzi
                                </h2>
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
                            </section>

                            <div className="order-4 lg:order-3">
                                {weeks[weekIndex] && (
                                    <SlotPicker
                                        trainerFirstName={firstName}
                                        week={weeks[weekIndex]}
                                        weekIndex={weekIndex}
                                        weekCount={weeks.length}
                                        onWeekChange={changeWeek}
                                        hours={hours}
                                        onHoursChange={changeHours}
                                        hoursLocked={service.fixedDuration}
                                        selectedDate={date}
                                        onDateChange={changeDate}
                                        selectedStart={start}
                                        onStartChange={setStart}
                                    />
                                )}
                            </div>

                            <div className="order-3 lg:order-4">
                                <TrainingPlaces places={trainer.places} />
                            </div>
                            <div className="order-5">
                                <Certifications
                                    certifications={trainer.certifications}
                                />
                            </div>
                            <div className="order-6">
                                <ZoneMap areaLabel={trainer.areaLabel} />
                            </div>
                            <div className="order-7">
                                <ReviewsSection trainer={trainer} />
                            </div>
                        </div>

                        <BookingAside
                            services={trainer.services}
                            service={service}
                            onServiceChange={changeService}
                            hours={hours}
                            selectedStart={start}
                            bookHref={BOOK_HREF}
                        />
                    </div>

                    <SimilarTrainers trainers={trainer.similarTrainers} />
                </div>
            </div>

            <BookingBar
                service={service}
                hours={hours}
                selectedStart={start}
                bookHref={BOOK_HREF}
            />
        </>
    );
}

Profile.layout = { footer: 'compact', hideHeaderOnMobile: true };
