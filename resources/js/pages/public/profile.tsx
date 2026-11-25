import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    Award,
    ChevronLeft,
    Heart,
    MapPin,
    Share,
    Star,
    Video,
} from 'lucide-react';
import HomeShelf from '@/components/home/home-shelf';
import { courseCard, eventCard } from '@/components/mp/cards';
import ProfileCard from '@/components/mp/profile-card';
import TrainerCard from '@/components/mp/trainer-card';
import ReportDialog from '@/components/shared/report-dialog';
import SocialIcon, { socialLabels } from '@/components/shared/social-icon';
import {
    BookingAside,
    BookingBar,
    DayTimeSection,
    ServicesSection,
} from '@/components/trainer-profile/profile-booking';
import {
    DesktopGallery,
    MobileGallery,
} from '@/components/trainer-profile/profile-gallery';
import {
    CertificationsList,
    ProfileBlock,
} from '@/components/trainer-profile/profile-sections';
import ReviewsBlock from '@/components/trainer-profile/reviews-block';
import { useFavorite } from '@/hooks/use-favorite';
import { useShare } from '@/hooks/use-share';
import { useTrainerBooking } from '@/hooks/use-trainer-booking';
import { courseSearchUrl } from '@/lib/course';
import { formatRating } from '@/lib/format';
import { trainingGoals } from '@/lib/goals';
import { gymSearchUrl } from '@/lib/gym';
import { hoverPrefetch } from '@/lib/prefetch';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { search as eventsSearch } from '@/routes/events';
import type {
    CourseSummary,
    GroupSessionSummary,
    SeoData,
    TrainerProfile,
    TrainerReview,
} from '@/types';

type ProfileProps = {
    trainer: TrainerProfile;
    /** Not approved yet: only its trainer and the team can see it. */
    preview: boolean;
    /** Opened from the trainer's invite link: "Marco ti ha invitato". */
    invited: boolean;
    /** Every review, loaded by "Mostra tutte le recensioni". */
    allReviews?: TrainerReview[];
    /** "Corsi che tiene" in the gyms. */
    courses: CourseSummary[];
    /** "Prossimi eventi" the trainer organizes. */
    events: GroupSessionSummary[];
    seo: SeoData;
};

/**
 * The public profile of a trainer (designs "V1 · Foto a scorrimento" and
 * "V1 · desktop · Griglia 1+4"): the photos, the name, who they are, the
 * services and the calendar right in the page, certifications and reviews.
 * The price and "Prenota" stay in the bar at the bottom (phones) or in the
 * summary on the right (desktop).
 */
export default function Profile({
    trainer,
    preview,
    invited,
    allReviews,
    events,
    courses,
    seo,
}: ProfileProps) {
    const firstName = trainer.name.split(' ')[0];
    const favorite = useFavorite(trainer.slug, trainer.favorite);
    const share = useShare(trainer.name);
    const booking = useTrainerBooking(trainer);

    // Back from the login with a time: straight to "Giorno e ora".
    useEffect(() => {
        if (booking.restored) {
            document.getElementById('giorno')?.scrollIntoView();
        }
        // Only when the page opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const city = trainer.city?.slug ?? null;
    // Back to the trainers of the same city.
    const citySearchHref = searchUrl({}, city);

    // The gallery, or else the profile photo.
    const slides =
        trainer.photos.length > 0
            ? trainer.photos
            : trainer.portraitUrl
              ? [{ caption: trainer.name, url: trainer.portraitUrl }]
              : [];

    const goals = trainingGoals.filter((goal) =>
        trainer.goals.includes(goal.value),
    );
    // Disciplines and goals in one row; "Postura" can be both: shown once.
    const tags = [
        ...new Set([
            ...trainer.disciplines,
            ...goals.map((goal) => goal.label),
        ]),
    ];
    const tagList = (className: string) =>
        tags.length > 0 && (
            <ul className={cn('flex flex-wrap gap-1.5 md:gap-2', className)}>
                {tags.map((tag) => (
                    <li
                        key={tag}
                        className="flex h-6.5 items-center rounded-full border border-field px-2.5 text-[13px] md:h-7.5 md:px-3 md:text-sm md:font-semibold"
                    >
                        {tag}
                    </li>
                ))}
            </ul>
        );

    const favoriteButton = favorite.canSave
        ? { pressed: favorite.pressed, onChange: favorite.change }
        : null;

    return (
        <>
            <Head title={seo.title} />

            <MobileGallery
                name={trainer.name}
                slides={slides}
                backHref={citySearchHref}
                onShare={share}
                favorite={favoriteButton}
            />

            <div className="mx-auto flex w-full max-w-300 flex-col px-4 pt-6 md:px-8 md:pt-26">
                <Link
                    prefetch={hoverPrefetch}
                    href={citySearchHref}
                    className="mb-2 hidden min-h-11 items-center gap-1.5 self-start text-[15px] text-muted-foreground hover:text-foreground md:flex"
                >
                    <ChevronLeft aria-hidden="true" className="size-4.5" />
                    {trainer.city
                        ? `Trainer a ${trainer.city.name}`
                        : 'Trainer'}
                </Link>

                <DesktopGallery name={trainer.name} slides={slides} />

                <header className="flex flex-col gap-3 md:mt-7 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-4">
                    <div className="flex flex-col gap-3 md:gap-2">
                        <h1 className="text-[28px] leading-8.5 font-bold tracking-[0.01em] md:text-[40px] md:leading-11.5 md:tracking-[-0.02em]">
                            {trainer.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[15px] text-muted-foreground md:gap-x-4.5 md:text-base">
                            {trainer.rating !== null && (
                                <a
                                    href="#recensioni"
                                    className="flex items-center gap-1 font-semibold text-foreground md:gap-1.5"
                                >
                                    <Star
                                        aria-hidden="true"
                                        className="size-4.5 fill-brand text-brand"
                                    />
                                    {formatRating(trainer.rating)}{' '}
                                    <span className="font-normal text-muted-foreground underline">
                                        {trainer.reviewCount}{' '}
                                        {trainer.reviewCount === 1
                                            ? 'recensione'
                                            : 'recensioni'}
                                    </span>
                                </a>
                            )}
                            {trainer.online !== 'only' &&
                                trainer.cities.length > 0 && (
                                    <span className="flex items-center gap-1 md:gap-1.5">
                                        <MapPin
                                            aria-hidden="true"
                                            className="size-4.5"
                                        />
                                        {trainer.cities.join(', ')}
                                    </span>
                                )}
                            {trainer.online && (
                                <span className="flex items-center gap-1 md:gap-1.5">
                                    <Video
                                        aria-hidden="true"
                                        className="size-4.5"
                                    />
                                    {trainer.online === 'only'
                                        ? 'Solo online'
                                        : 'Anche online'}
                                </span>
                            )}
                            <span className="flex items-center gap-1 md:gap-1.5">
                                <Award
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                                {trainer.experienceLabel}
                            </span>
                        </div>
                        {tagList('md:hidden')}
                        {trainer.socials.length > 0 && (
                            <ul className="-ml-2 flex gap-1">
                                {trainer.socials.map((social) => (
                                    <li key={social.provider}>
                                        <a
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer me"
                                            aria-label={`${socialLabels[social.provider]} di ${trainer.name}: @${social.handle} (si apre in una nuova scheda)`}
                                            title={`${socialLabels[social.provider]} · @${social.handle}`}
                                            className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4.5"
                                        >
                                            <SocialIcon
                                                provider={social.provider}
                                            />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="hidden gap-1 md:flex">
                        <button
                            type="button"
                            onClick={share}
                            className="flex h-11 items-center gap-2 rounded-xl px-3.5 text-[15px] font-semibold underline outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Share aria-hidden="true" className="size-4.5" />
                            Condividi
                        </button>
                        {favoriteButton && (
                            <button
                                type="button"
                                aria-pressed={favoriteButton.pressed}
                                onClick={() =>
                                    favoriteButton.onChange(
                                        !favoriteButton.pressed,
                                    )
                                }
                                className="flex h-11 items-center gap-2 rounded-xl px-3.5 text-[15px] font-semibold underline outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Heart
                                    aria-hidden="true"
                                    className={cn(
                                        'size-4.5',
                                        favoriteButton.pressed &&
                                            'fill-brand text-brand',
                                    )}
                                />
                                {favoriteButton.pressed ? 'Salvato' : 'Salva'}
                            </button>
                        )}
                    </div>
                </header>

                {invited && !preview && (
                    <p
                        role="status"
                        className="mt-6 rounded-[20px] px-4 py-3.5 text-[15px] shadow-[inset_0_0_0_1px_var(--brand)]"
                    >
                        <strong>
                            {firstName} ti ha invitato su MioPersonal.
                        </strong>{' '}
                        Da qui prenoti le sedute in pochi secondi, vedi gli
                        orari liberi e trovi tutto nella tua area.
                    </p>
                )}
                {preview && (
                    <p
                        role="status"
                        className="mt-6 rounded-[20px] px-4 py-3.5 text-[15px] shadow-[inset_0_0_0_1px_var(--field)]"
                    >
                        <strong>Anteprima:</strong> il profilo non è ancora
                        pubblico. Lo vedi solo tu (e il nostro team) finché non
                        viene approvato.
                    </p>
                )}

                <div className="mt-10 md:grid md:grid-cols-[minmax(0,1fr)_360px] md:items-start md:gap-16">
                    <div className="flex min-w-0 flex-col gap-10 md:gap-12">
                        {tagList('hidden md:flex')}

                        {trainer.bio.length > 0 && (
                            <ProfileBlock id="bio-title" title="Chi sono">
                                {trainer.bio.map((paragraph) => (
                                    <p
                                        key={paragraph}
                                        // break-words: a very long word wraps instead of going under the prices.
                                        className="max-w-160 text-[17px] leading-6 break-words md:leading-6.5"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </ProfileBlock>
                        )}

                        <ServicesSection
                            services={trainer.services}
                            booking={booking}
                        />

                        <DayTimeSection
                            booking={booking}
                            availability={trainer.availability}
                            waitlistDays={trainer.waitlistDays}
                            trainerFirstName={firstName}
                        />

                        {trainer.certifications.length > 0 && (
                            <CertificationsList
                                certifications={trainer.certifications}
                            />
                        )}

                        <ReviewsBlock
                            trainer={trainer}
                            allReviews={allReviews}
                            canReport={!preview}
                        />
                    </div>

                    <BookingAside
                        booking={booking}
                        online={trainer.online}
                        notes={[
                            trainer.confirmLabel,
                            trainer.responseTimeLabel,
                        ]}
                        trainerFirstName={firstName}
                    />
                </div>
            </div>

            {/* Where else to find the trainer: only the rows with something in them. */}
            <HomeShelf
                id="gyms-title"
                title={`Palestre dove allena ${firstName}`}
                link={{ label: 'Vedi tutte', href: gymSearchUrl({}, city) }}
                items={trainer.gyms}
                itemKey={(gym) => gym.slug}
            >
                {(gym) => (
                    <ProfileCard
                        kind="gym"
                        name={gym.name}
                        href={gym.href}
                        image={gym.coverUrl}
                        location={[gym.address, gym.city]
                            .filter(Boolean)
                            .join(', ')}
                        cta="Scopri"
                    />
                )}
            </HomeShelf>
            <HomeShelf
                id="courses-title"
                title={`Corsi che tiene ${firstName}`}
                link={{ label: 'Vedi tutti', href: courseSearchUrl({}, city) }}
                items={courses}
                itemKey={(course) => String(course.id)}
            >
                {(course) => <ProfileCard {...courseCard(course)} />}
            </HomeShelf>
            <HomeShelf
                id="events-title"
                title="Prossimi eventi"
                link={{
                    label: 'Tutti gli eventi',
                    href: eventsSearch.url(city ? { city } : undefined),
                }}
                items={events}
                itemKey={(event) => event.slug}
            >
                {(event) => <ProfileCard {...eventCard(event)} />}
            </HomeShelf>
            <HomeShelf
                id="similar-title"
                title="Trainer simili"
                link={{ label: 'Vedi tutti', href: citySearchHref }}
                items={trainer.similarTrainers}
                itemKey={(item) => item.slug}
            >
                {(item) => <TrainerCard trainer={item} />}
            </HomeShelf>

            <div className="mx-auto w-full max-w-300 px-4 pt-10 pb-8 md:px-8 md:pt-14 md:pb-6">
                {!preview && (
                    <ReportDialog
                        type="trainer"
                        target={trainer.slug}
                        label="Segnala questo profilo"
                        contentClassName="theme-dark"
                    />
                )}
            </div>

            <BookingBar booking={booking} />
        </>
    );
}

Profile.layout = { hideHeaderOnMobile: true };
