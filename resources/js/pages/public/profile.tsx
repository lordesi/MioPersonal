import { Head } from '@inertiajs/react';
import { useState } from 'react';
import HomeShelf from '@/components/home/home-shelf';
import { courseCard, eventCard, trainerCard } from '@/components/mp/cards';
import ProfileCard from '@/components/mp/profile-card';
import SaveableCard from '@/components/mp/saveable-card';
import ReportDialog from '@/components/shared/report-dialog';
import {
    BookingAside,
    BookingBar,
} from '@/components/trainer-profile/booking-panel';
import ProfileHero from '@/components/trainer-profile/profile-hero';
import {
    CertificationsList,
    PlacesGrid,
    ProfileBlock,
} from '@/components/trainer-profile/profile-sections';
import ReviewsBlock from '@/components/trainer-profile/reviews-block';
import ServicesSheet from '@/components/trainer-profile/services-sheet';
import SlotSheet from '@/components/trainer-profile/slot-sheet';
import { useFavorite } from '@/hooks/use-favorite';
import { useShare } from '@/hooks/use-share';
import { useTrainerBooking } from '@/hooks/use-trainer-booking';
import { courseSearchUrl } from '@/lib/course';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
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
 * The public profile of a trainer, in the dark design (designs "Ibrido 2",
 * "Barra 5" and "Desktop · Profilo trainer"): the photos and the name, who
 * they are, where they train, certifications and reviews; on the right
 * (desktop) or in the bar at the bottom (phones) the booking, which opens
 * "Servizi" and "Scegli data e ora".
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
    // Back from the login with a time: "Scegli data e ora" opens on it.
    const [sheet, setSheet] = useState<'services' | 'slot' | null>(
        booking.restored ? 'slot' : null,
    );

    const city = trainer.city?.slug ?? null;
    // Back to the trainers of the same city.
    const citySearchHref = searchUrl({}, city);

    return (
        <>
            <Head title={seo.title} />

            <ProfileHero
                trainer={trainer}
                backHref={citySearchHref}
                favorite={
                    favorite.canSave
                        ? {
                              pressed: favorite.pressed,
                              onChange: favorite.change,
                          }
                        : null
                }
                onShare={share}
            />

            <div className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 pt-10 md:px-8">
                {invited && !preview && (
                    <p
                        role="status"
                        className="rounded-[20px] px-4 py-3.5 text-[15px] shadow-[inset_0_0_0_1px_var(--brand)]"
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
                        className="rounded-[20px] px-4 py-3.5 text-[15px] shadow-[inset_0_0_0_1px_var(--field)]"
                    >
                        <strong>Anteprima:</strong> il profilo non è ancora
                        pubblico. Lo vedi solo tu (e il nostro team) finché non
                        viene approvato.
                    </p>
                )}

                <div className="md:grid md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-18">
                    <div className="flex min-w-0 flex-col gap-10 md:gap-14">
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

                        {trainer.places.length > 0 && (
                            <PlacesGrid
                                places={trainer.places}
                                online={trainer.online}
                                trainerFirstName={firstName}
                            />
                        )}

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
                        services={trainer.services}
                        booking={booking}
                        onShowServices={() => setSheet('services')}
                        onChooseTime={() => setSheet('slot')}
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
                {(item) => (
                    <SaveableCard
                        {...trainerCard(item)}
                        slug={item.slug}
                        favoriteKind="trainer"
                        saved={item.favorite ?? false}
                    />
                )}
            </HomeShelf>

            {/* In the design it is in the footer: here, just above it. Room for the bar on phones. */}
            <div className="mx-auto w-full max-w-300 px-4 pt-10 pb-32 md:px-8 md:pt-14 md:pb-6">
                {!preview && (
                    <ReportDialog
                        type="trainer"
                        target={trainer.slug}
                        label="Segnala questo profilo"
                        contentClassName="theme-dark"
                    />
                )}
            </div>

            <BookingBar
                services={trainer.services}
                booking={booking}
                onShowServices={() => setSheet('services')}
                onChooseTime={() => setSheet('slot')}
            />

            <ServicesSheet
                open={sheet === 'services'}
                onOpenChange={(open) => setSheet(open ? 'services' : null)}
                services={trainer.services}
                booking={booking}
                onChooseTime={() => setSheet('slot')}
            />
            <SlotSheet
                open={sheet === 'slot'}
                onOpenChange={(open) => setSheet(open ? 'slot' : null)}
                booking={booking}
                availability={trainer.availability}
                waitlistDays={trainer.waitlistDays}
                onBack={() => setSheet('services')}
            />
        </>
    );
}

Profile.layout = { hideHeaderOnMobile: true };
