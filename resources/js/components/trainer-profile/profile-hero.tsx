import { Award, MapPin, Star, Video } from 'lucide-react';
import SocialIcon, { socialLabels } from '@/components/shared/social-icon';
import PhotoHero, {
    SplitName,
    heroChipClassName,
    heroFactsClassName,
    heroTitleClassName,
} from '@/components/trainer-profile/photo-hero';
import { useInitials } from '@/hooks/use-initials';
import { formatRating } from '@/lib/format';
import { trainingGoals } from '@/lib/goals';
import type { TrainerProfile } from '@/types';

type ProfileHeroProps = {
    trainer: TrainerProfile;
    /** The search of the trainer's city: "‹ Trainer a Bergamo". */
    backHref: string;
    /** The heart: null for trainers, gyms and the team (they can't save). */
    favorite: { pressed: boolean; onChange: (pressed: boolean) => void } | null;
    onShare: () => void;
};

/**
 * The top of the trainer's profile (designs "Ibrido 2" / "Desktop · Profilo
 * trainer"): the photos (PhotoHero), then the name, rating, where,
 * experience and the chips.
 */
export default function ProfileHero({
    trainer,
    backHref,
    favorite,
    onShare,
}: ProfileHeroProps) {
    const getInitials = useInitials();

    // The gallery, or else the profile photo, or else the initials.
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

    return (
        <PhotoHero
            titleId="profile-name"
            photosLabel={`Foto di ${trainer.name}`}
            slides={slides}
            placeholder={
                <span
                    role="img"
                    aria-label={`Foto profilo di ${trainer.name}`}
                    className="flex size-full items-start justify-center bg-[radial-gradient(circle_at_70%_25%,#1f4a4b_0%,#171717_60%)] pt-[18%] text-[120px] leading-none font-bold tracking-[-0.045em] text-foreground/15 md:pt-32 md:text-[200px]"
                >
                    {getInitials(trainer.name)}
                </span>
            }
            backHref={backHref}
            backLabel="Torna ai risultati"
            backText={
                trainer.city ? `Trainer a ${trainer.city.name}` : 'Trainer'
            }
            onShare={onShare}
            shareLabel="Condividi il profilo"
            favorite={favorite}
        >
            <h1 id="profile-name" className={heroTitleClassName}>
                <SplitName name={trainer.name} />
            </h1>

            <div className={heroFactsClassName}>
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
                        <span className="font-normal text-muted-foreground underline md:no-underline">
                            <span className="hidden md:inline">(</span>
                            {trainer.reviewCount}{' '}
                            {trainer.reviewCount === 1
                                ? 'recensione'
                                : 'recensioni'}
                            <span className="hidden md:inline">)</span>
                        </span>
                    </a>
                )}
                {trainer.online !== 'only' && (
                    <span className="flex items-center gap-1 md:gap-1.5">
                        <MapPin aria-hidden="true" className="size-4.5" />
                        {trainer.cities.join(', ')}
                    </span>
                )}
                {trainer.online && (
                    <span className="flex items-center gap-1 md:gap-1.5">
                        <Video aria-hidden="true" className="size-4.5" />
                        {trainer.online === 'only'
                            ? 'Solo online'
                            : 'Anche online'}
                    </span>
                )}
                <span className="flex items-center gap-1 md:gap-1.5">
                    <Award aria-hidden="true" className="size-4.5" />
                    {trainer.experienceLabel}
                </span>
            </div>

            {tags.length > 0 && (
                <ul className="-mx-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:gap-2 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
                    {tags.map((tag) => (
                        <li key={tag} className={heroChipClassName}>
                            {tag}
                        </li>
                    ))}
                </ul>
            )}

            {trainer.socials.length > 0 && (
                <ul className="flex gap-1">
                    {trainer.socials.map((social) => (
                        <li key={social.provider}>
                            <a
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer me"
                                aria-label={`${socialLabels[social.provider]} di ${trainer.name}: @${social.handle} (si apre in una nuova scheda)`}
                                title={`${socialLabels[social.provider]} · @${social.handle}`}
                                className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4.5"
                            >
                                <SocialIcon provider={social.provider} />
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </PhotoHero>
    );
}
