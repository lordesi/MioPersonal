import { Head, Link } from '@inertiajs/react';
import { Building2, MapPin, Share, Tag, Users } from 'lucide-react';
import UpcomingEvents from '@/components/events/upcoming-events';
import { SaveableGymCard } from '@/components/gym/gym-card';
import GymCoursePlanner from '@/components/gym/gym-course-planner';
import {
    GymAmenities,
    GymContacts,
    GymHours,
    GymPlans,
    GymPromotions,
} from '@/components/gym/gym-sections';
import PhotoGallery from '@/components/profile/photo-gallery';
import ProfileSection from '@/components/profile/profile-section';
import FavoriteButton from '@/components/shared/favorite-button';
import TrainerCard from '@/components/trainer/trainer-card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useFavorite } from '@/hooks/use-favorite';
import { useShare } from '@/hooks/use-share';
import { gymSearchUrl, monthlyLabel } from '@/lib/gym';
import { home } from '@/routes';
import type {
    GroupSessionSummary,
    GymProfileData,
    GymSummary,
    SeoData,
    TrainerSummary,
} from '@/types';

type GymProps = {
    gym: GymProfileData;
    /** Not approved yet: the gym (or the team) is looking at a preview. */
    preview: boolean;
    /** "Palestre simili": same city, most services in common; empty in a preview. */
    similar: GymSummary[];
    /** "Prossimi eventi" the gym organizes. */
    events: GroupSessionSummary[];
    seo: SeoData;
};

const crumbLink = 'text-primary-foreground/60 hover:text-primary-foreground';

const darkButton =
    'h-11 rounded-xl border-primary-foreground/20 bg-transparent px-4 text-primary-foreground shadow-none hover:bg-primary-foreground/10 hover:text-primary-foreground dark:bg-transparent';

/**
 * The public page of a gym (GymProfileController): photos, services, hours,
 * plans, promotions, the trainers who work there, where it is and contacts,
 * then the similar gyms.
 */
export default function Gym({ gym, preview, similar, events, seo }: GymProps) {
    const photos = [gym.coverUrl, ...gym.photos]
        .filter((url): url is string => url !== null)
        .map((url) => ({ caption: gym.name, url }));
    const fromLabel = monthlyLabel(gym.monthlyFromCents);
    const favorite = useFavorite(gym.slug, gym.favorite, 'gym');
    const share = useShare(gym.name);

    return (
        <>
            <Head title={seo.title} />

            <div className="bg-primary text-primary-foreground">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pt-6 pb-8 md:px-8">
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
                    <Breadcrumb aria-label="Percorso">
                        <BreadcrumbList className="gap-2 text-[13px] leading-[18px] text-primary-foreground/60 sm:gap-2">
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild className={crumbLink}>
                                    <Link href={home()}>Home</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>/</BreadcrumbSeparator>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild className={crumbLink}>
                                    <Link
                                        href={gymSearchUrl({}, gym.city.slug)}
                                    >
                                        Palestre a {gym.city.name}
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>/</BreadcrumbSeparator>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-primary-foreground">
                                    {gym.name}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {photos.length > 0 ? (
                        <PhotoGallery trainerName={gym.name} photos={photos} />
                    ) : (
                        <div className="flex aspect-[3/1] items-center justify-center rounded-3xl bg-primary-foreground/10">
                            <Building2
                                aria-hidden="true"
                                className="size-12 text-primary-foreground/50"
                            />
                        </div>
                    )}

                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-2">
                            <h1 className="text-[32px] leading-9 font-bold tracking-[-0.03em] md:text-[44px] md:leading-12">
                                {gym.name}
                            </h1>
                            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-primary-foreground/75">
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    {gym.address}
                                </span>
                                {gym.trainers.length > 0 && (
                                    <a
                                        href="#trainer"
                                        className="inline-flex items-center gap-1.5 hover:text-primary-foreground"
                                    >
                                        <Users
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        {gym.trainers.length === 1
                                            ? '1 personal trainer'
                                            : `${gym.trainers.length} personal trainer`}
                                    </a>
                                )}
                                {gym.promotions.length > 0 && (
                                    <a
                                        href="#promozioni"
                                        className="inline-flex items-center gap-1.5 font-semibold text-primary-foreground hover:underline"
                                    >
                                        <Tag
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        {gym.promotions.length === 1
                                            ? '1 promozione attiva'
                                            : `${gym.promotions.length} promozioni attive`}
                                    </a>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Not in a preview: the gym isn't public yet. */}
                            {!preview && favorite.canSave && (
                                <FavoriteButton
                                    variant="labeled"
                                    name={gym.name}
                                    pressed={favorite.pressed}
                                    onPressedChange={favorite.change}
                                    className={darkButton}
                                />
                            )}
                            {!preview && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={share}
                                    className={darkButton}
                                >
                                    <Share />
                                    Condividi
                                </Button>
                            )}
                            {fromLabel && (
                                <span className="text-xl font-bold">
                                    {fromLabel}
                                </span>
                            )}
                            {gym.plans.length > 0 && (
                                <Button
                                    asChild
                                    className="h-11 rounded-xl bg-primary-foreground px-5 font-semibold text-primary hover:bg-primary-foreground/90"
                                >
                                    <a href="#abbonamenti">Vedi abbonamenti</a>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-muted">
                <div className="mx-auto grid w-full max-w-7xl items-start gap-6 px-4 pt-7 pb-14 md:px-8 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
                    <div className="flex min-w-0 flex-col gap-4.5">
                        {gym.promotions.length > 0 && (
                            <ProfileSection
                                id="promozioni"
                                titleId="promotions-title"
                                title="Promozioni"
                            >
                                <GymPromotions promotions={gym.promotions} />
                            </ProfileSection>
                        )}

                        {gym.description.length > 0 && (
                            <ProfileSection
                                titleId="about-title"
                                title="La palestra"
                            >
                                {gym.description.map((paragraph) => (
                                    <p
                                        key={paragraph}
                                        className="text-base leading-[26px] break-words text-foreground/80"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </ProfileSection>
                        )}

                        {gym.amenities.length > 0 && (
                            <ProfileSection
                                titleId="amenities-title"
                                title="Servizi"
                            >
                                <GymAmenities amenities={gym.amenities} />
                            </ProfileSection>
                        )}

                        {gym.courses.length > 0 && (
                            <ProfileSection
                                id="corsi"
                                titleId="courses-title"
                                title="Corsi"
                            >
                                <GymCoursePlanner
                                    weeks={gym.courseWeeks}
                                    courses={gym.courses}
                                    gymSlug={preview ? undefined : gym.slug}
                                />
                            </ProfileSection>
                        )}

                        {gym.plans.length > 0 && (
                            <ProfileSection
                                id="abbonamenti"
                                titleId="plans-title"
                                title="Abbonamenti"
                                description="Si acquistano direttamente in palestra."
                            >
                                <GymPlans plans={gym.plans} />
                            </ProfileSection>
                        )}

                        <ProfileSection
                            id="trainer"
                            titleId="trainers-title"
                            title="Personal trainer"
                            description={
                                gym.trainers.length > 0
                                    ? `Allenano da ${gym.name}: prenoti dal loro profilo.`
                                    : undefined
                            }
                        >
                            {gym.trainers.length > 0 ? (
                                <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3 sm:gap-4">
                                    {gym.trainers.map((trainer) => (
                                        <li key={trainer.href} className="flex">
                                            <GymTrainerCard trainer={trainer} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Nessun personal trainer di MioPersonal
                                    allena ancora qui.
                                </p>
                            )}
                        </ProfileSection>
                    </div>

                    <aside className="flex min-w-0 flex-col gap-4.5 lg:sticky lg:top-6">
                        <ProfileSection
                            titleId="where-title"
                            title="Dove si trova"
                        >
                            <GymContacts
                                address={gym.address}
                                mapsUrl={gym.mapsUrl}
                                contacts={gym.contacts}
                            />
                        </ProfileSection>
                        <ProfileSection
                            titleId="hours-title"
                            title="Orari di apertura"
                        >
                            <GymHours
                                hours={gym.hours}
                                openNow={gym.openNow}
                                notes={gym.openingNotes}
                            />
                        </ProfileSection>
                    </aside>

                    <UpcomingEvents events={events} className="lg:col-span-2" />

                    {similar.length > 0 && (
                        <section
                            aria-labelledby="similar-title"
                            className="flex flex-col gap-3.5 lg:col-span-2"
                        >
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <h2
                                    id="similar-title"
                                    className="text-xl leading-7 font-semibold tracking-tight"
                                >
                                    Palestre simili a {gym.city.name}
                                </h2>
                                <Link
                                    href={gymSearchUrl({}, gym.city.slug)}
                                    className="inline-flex min-h-11 items-center text-sm font-medium underline md:min-h-0"
                                >
                                    Tutte le palestre a {gym.city.name}
                                </Link>
                            </div>
                            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 sm:gap-5">
                                {similar.map((other) => (
                                    <li key={other.slug} className="flex">
                                        <SaveableGymCard
                                            gym={other}
                                            className="flex-1"
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

/** A trainer who works here, with the heart: each one keeps its own state. */
function GymTrainerCard({ trainer }: { trainer: TrainerSummary }) {
    const favorite = useFavorite(trainer.slug, trainer.favorite ?? false);

    return (
        <TrainerCard
            trainer={trainer}
            layout="results"
            className="flex-1"
            favorite={
                favorite.canSave
                    ? {
                          pressed: favorite.pressed,
                          onPressedChange: favorite.change,
                      }
                    : undefined
            }
        />
    );
}
