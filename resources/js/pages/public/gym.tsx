import { Head } from '@inertiajs/react';
import { Building2, MapPin, Tag, Users } from 'lucide-react';
import HomeShelf from '@/components/home/home-shelf';
import { GymAside, GymBar } from '@/components/gym/gym-aside';
import GymCoursePlanner from '@/components/gym/gym-course-planner';
import {
    GymAmenities,
    GymContacts,
    GymHours,
    GymPlans,
    GymPromotions,
    OpenBadge,
} from '@/components/gym/gym-sections';
import { eventCard, gymCard, trainerCard } from '@/components/mp/cards';
import ProfileCard from '@/components/mp/profile-card';
import SaveableCard from '@/components/mp/saveable-card';
import ReportDialog from '@/components/shared/report-dialog';
import SocialIcon from '@/components/shared/social-icon';
import PhotoHero, {
    IconPlaceholder,
    SplitName,
    heroFactsClassName,
    heroTitleClassName,
} from '@/components/trainer-profile/photo-hero';
import { ProfileBlock } from '@/components/trainer-profile/profile-sections';
import { useFavorite } from '@/hooks/use-favorite';
import { useShare } from '@/hooks/use-share';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { search as eventsSearch } from '@/routes/events';
import type {
    GroupSessionSummary,
    GymProfileData,
    GymSummary,
    SeoData,
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

/** Below the top of the window when a link jumps to a block. */
const anchored = 'scroll-mt-6';

/**
 * The public page of a gym (GymProfileController), in the dark design of
 * the trainer profile: the photos and the name, then what happens there
 * (promotions, courses), what it offers (services, plans); on the right
 * (desktop) or in the bar at the bottom (phones) price, call and
 * directions. Below, its trainers, its events and the similar gyms.
 */
export default function Gym({ gym, preview, similar, events, seo }: GymProps) {
    const slides = [gym.coverUrl, ...gym.photos]
        .filter((url): url is string => url !== null)
        .map((url) => ({ caption: gym.name, url }));
    const favorite = useFavorite(gym.slug, gym.favorite, 'gym');
    const share = useShare(gym.name);
    const citySearchHref = gymSearchUrl({}, gym.city.slug);
    const trainers =
        gym.trainers.length === 1
            ? '1 personal trainer'
            : `${gym.trainers.length} personal trainer`;

    return (
        <>
            <Head title={seo.title} />

            <PhotoHero
                titleId="gym-name"
                photosLabel={`Foto di ${gym.name}`}
                slides={slides}
                placeholder={
                    <IconPlaceholder
                        icon={Building2}
                        label={`Nessuna foto di ${gym.name}`}
                    />
                }
                backHref={citySearchHref}
                backLabel="Torna alle palestre"
                backText={`Palestre a ${gym.city.name}`}
                // Not in a preview: the gym isn't public yet.
                onShare={preview ? null : share}
                shareLabel="Condividi la palestra"
                favorite={
                    !preview && favorite.canSave
                        ? {
                              pressed: favorite.pressed,
                              onChange: favorite.change,
                          }
                        : null
                }
            >
                <h1 id="gym-name" className={heroTitleClassName}>
                    <SplitName name={gym.name} />
                </h1>

                <div className={heroFactsClassName}>
                    <span className="flex items-center gap-1 md:gap-1.5">
                        <MapPin aria-hidden="true" className="size-4.5" />
                        {gym.address}
                    </span>
                    {gym.trainers.length > 0 && (
                        <a
                            href="#trainer"
                            className="flex items-center gap-1 hover:text-foreground md:gap-1.5"
                        >
                            <Users aria-hidden="true" className="size-4.5" />
                            {trainers}
                        </a>
                    )}
                    {gym.promotions.length > 0 && (
                        <a
                            href="#promozioni"
                            className="flex items-center gap-1 font-semibold text-brand hover:underline md:gap-1.5"
                        >
                            <Tag aria-hidden="true" className="size-4.5" />
                            {gym.promotions.length === 1
                                ? '1 promozione attiva'
                                : `${gym.promotions.length} promozioni attive`}
                        </a>
                    )}
                </div>

                {(gym.openNow !== null || gym.contacts.instagramUrl) && (
                    <div className="flex items-center gap-2">
                        {gym.openNow !== null && (
                            <OpenBadge openNow={gym.openNow} />
                        )}
                        {gym.contacts.instagram &&
                            gym.contacts.instagramUrl && (
                                <a
                                    href={gym.contacts.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Instagram di ${gym.name}: @${gym.contacts.instagram} (si apre in una nuova scheda)`}
                                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4.5"
                                >
                                    <SocialIcon provider="instagram" />
                                </a>
                            )}
                    </div>
                )}
            </PhotoHero>

            <div className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 pt-10 md:px-8">
                {preview && (
                    <p
                        role="status"
                        className="rounded-[20px] px-4 py-3.5 text-[15px] shadow-[inset_0_0_0_1px_var(--field)]"
                    >
                        <strong>Anteprima:</strong> il profilo non è ancora
                        pubblico. Lo vedi solo tu (e il nostro team) finché non
                        viene approvato.
                    </p>
                )}

                <div className="md:grid md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-18">
                    <div className="flex min-w-0 flex-col gap-10 md:gap-14">
                        {gym.promotions.length > 0 && (
                            <ProfileBlock
                                id="promotions-title"
                                anchor="promozioni"
                                title="Promozioni"
                                className={anchored}
                            >
                                <GymPromotions promotions={gym.promotions} />
                            </ProfileBlock>
                        )}

                        {gym.description.length > 0 && (
                            <ProfileBlock id="about-title" title="La palestra">
                                {gym.description.map((paragraph) => (
                                    <p
                                        key={paragraph}
                                        className="max-w-160 text-[17px] leading-6 break-words md:leading-6.5"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </ProfileBlock>
                        )}

                        {gym.courses.length > 0 && (
                            <ProfileBlock
                                id="courses-title"
                                anchor="corsi"
                                title="Corsi"
                                className={anchored}
                            >
                                <GymCoursePlanner
                                    weeks={gym.courseWeeks}
                                    courses={gym.courses}
                                />
                            </ProfileBlock>
                        )}

                        {gym.amenities.length > 0 && (
                            <ProfileBlock
                                id="amenities-title"
                                anchor="servizi"
                                title="Servizi"
                                className={anchored}
                            >
                                <GymAmenities amenities={gym.amenities} />
                            </ProfileBlock>
                        )}

                        {gym.plans.length > 0 && (
                            <ProfileBlock
                                id="plans-title"
                                anchor="abbonamenti"
                                title="Abbonamenti"
                                description="Si acquistano direttamente in palestra."
                                className={anchored}
                            >
                                <GymPlans plans={gym.plans} />
                            </ProfileBlock>
                        )}

                        {/* Phones: on desktop hours and contacts are in the aside. */}
                        <ProfileBlock
                            id="hours-title"
                            title="Orari di apertura"
                            className="md:hidden"
                        >
                            <GymHours
                                hours={gym.hours}
                                openNow={gym.openNow}
                                notes={gym.openingNotes}
                            />
                        </ProfileBlock>
                        <ProfileBlock
                            id="where-title"
                            anchor="dove"
                            title="Dove si trova"
                            className={`${anchored} md:hidden`}
                        >
                            <GymContacts
                                address={gym.address}
                                mapsUrl={gym.mapsUrl}
                                contacts={gym.contacts}
                            />
                        </ProfileBlock>

                        {gym.trainers.length === 0 && (
                            <ProfileBlock
                                id="trainers-title"
                                anchor="trainer"
                                title="Personal trainer"
                                className={anchored}
                            >
                                <p className="text-[15px] text-muted-foreground">
                                    Nessun personal trainer di MioPersonal
                                    allena ancora qui.
                                </p>
                            </ProfileBlock>
                        )}
                    </div>

                    <GymAside gym={gym} />
                </div>
            </div>

            {/* Who trains here, what the gym organizes, the other gyms: only the rows with something in them. */}
            <div
                id={gym.trainers.length > 0 ? 'trainer' : undefined}
                className={anchored}
            >
                <HomeShelf
                    id="gym-trainers-title"
                    title={`Personal trainer di ${gym.name}`}
                    link={{
                        label: 'Vedi tutti',
                        href: searchUrl({}, gym.city.slug),
                    }}
                    items={gym.trainers}
                    itemKey={(trainer) => trainer.slug}
                >
                    {(trainer) => (
                        <SaveableCard
                            {...trainerCard(trainer)}
                            slug={trainer.slug}
                            favoriteKind="trainer"
                            saved={trainer.favorite ?? false}
                        />
                    )}
                </HomeShelf>
            </div>
            <div id="eventi" className={anchored}>
                <HomeShelf
                    id="events-title"
                    title="Prossimi eventi"
                    link={{
                        label: 'Tutti gli eventi',
                        href: eventsSearch.url({ city: gym.city.slug }),
                    }}
                    items={events}
                    itemKey={(event) => event.slug}
                >
                    {(event) => <ProfileCard {...eventCard(event)} />}
                </HomeShelf>
            </div>
            <HomeShelf
                id="similar-title"
                title={`Palestre simili a ${gym.city.name}`}
                link={{ label: 'Vedi tutte', href: citySearchHref }}
                items={similar}
                itemKey={(other) => other.slug}
            >
                {(other) => (
                    <SaveableCard
                        {...gymCard(other)}
                        slug={other.slug}
                        favoriteKind="gym"
                        saved={other.favorite ?? false}
                    />
                )}
            </HomeShelf>

            {/* Just above the footer, as on the trainer profile. Room for the bar on phones. */}
            <div className="mx-auto w-full max-w-300 px-4 pt-10 pb-32 md:px-8 md:pt-14 md:pb-6">
                {!preview && (
                    <ReportDialog
                        type="gym"
                        target={gym.slug}
                        label="Segnala questa palestra"
                        contentClassName="theme-dark"
                    />
                )}
            </div>

            <GymBar gym={gym} />
        </>
    );
}

Gym.layout = { hideHeaderOnMobile: true };
