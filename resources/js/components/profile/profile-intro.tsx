import { Award, MapPin, Share, Star, Target, Video } from 'lucide-react';
import FavoriteButton from '@/components/shared/favorite-button';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { formatRating } from '@/lib/format';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { TrainerProfile } from '@/types';

type ProfileIntroProps = {
    trainer: TrainerProfile;
    /** Saved by the client; null hides "Salva" (trainers and admins). */
    favorite: boolean | null;
    onFavoriteChange: (favorite: boolean) => void;
    onShare: () => void;
};

/** The chips under the name, on the dark block. */
const chip =
    'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] leading-[18px] font-medium [&>svg]:size-3.5 [&>svg]:shrink-0';

/** Outline buttons on the dark block: "Salva" and "Condividi". */
const darkButton =
    'h-10 rounded-[10px] border-primary-foreground/20 bg-transparent px-3.5 text-primary-foreground shadow-none hover:bg-primary-foreground/10 hover:text-primary-foreground dark:bg-transparent';

/** Photo, name, rating, where, experience, disciplines and goals. */
export default function ProfileIntro({
    trainer,
    favorite,
    onFavoriteChange,
    onShare,
}: ProfileIntroProps) {
    const getInitials = useInitials();
    const goals = trainingGoals.filter((goal) =>
        trainer.goals.includes(goal.value),
    );
    const portrait =
        'size-20 shrink-0 rounded-3xl shadow-[0_0_0_6px] shadow-primary-foreground/10 md:size-29 md:rounded-[32px]';

    return (
        <section
            aria-labelledby="profile-name"
            className="flex flex-wrap items-start gap-x-6 gap-y-4 md:items-center"
        >
            {trainer.portraitUrl ? (
                <img
                    src={trainer.portraitUrl}
                    alt={`Foto profilo di ${trainer.name}`}
                    className={cn(
                        portrait,
                        'bg-primary-foreground object-cover',
                    )}
                />
            ) : (
                <span
                    role="img"
                    aria-label={`Foto profilo di ${trainer.name}`}
                    className={cn(
                        portrait,
                        'flex items-center justify-center bg-primary-foreground text-[28px] font-bold tracking-[-0.03em] text-primary md:text-[40px]',
                    )}
                >
                    {getInitials(trainer.name)}
                </span>
            )}

            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5">
                <h1
                    id="profile-name"
                    className="text-[32px] leading-10 font-bold tracking-[-0.03em] md:text-[44px] md:leading-12"
                >
                    {trainer.name}
                </h1>

                <ul className="flex flex-wrap gap-2">
                    {trainer.rating !== null && (
                        <li>
                            <a
                                href="#recensioni"
                                className={cn(
                                    chip,
                                    'bg-primary-foreground/10 font-semibold tabular-nums hover:bg-primary-foreground/15',
                                )}
                            >
                                <Star
                                    aria-hidden="true"
                                    className="fill-current"
                                />
                                {formatRating(trainer.rating)}
                                <span className="font-normal text-primary-foreground/60">
                                    · {trainer.reviewCount}{' '}
                                    {trainer.reviewCount === 1
                                        ? 'recensione'
                                        : 'recensioni'}
                                </span>
                            </a>
                        </li>
                    )}
                    {trainer.online !== 'only' && (
                        <li className={cn(chip, 'bg-primary-foreground/10')}>
                            <MapPin aria-hidden="true" />
                            {trainer.cities.join(', ')}
                        </li>
                    )}
                    {trainer.online && (
                        <li className={cn(chip, 'bg-primary-foreground/10')}>
                            <Video aria-hidden="true" />
                            {trainer.online === 'only'
                                ? 'Solo online'
                                : 'Anche online'}
                        </li>
                    )}
                    <li className={cn(chip, 'bg-primary-foreground/10')}>
                        <Award aria-hidden="true" />
                        {trainer.experienceLabel}
                    </li>
                    {trainer.disciplines.map((discipline) => (
                        <li
                            key={discipline}
                            className={cn(
                                chip,
                                'bg-primary-foreground font-semibold text-primary',
                            )}
                        >
                            {discipline}
                        </li>
                    ))}
                    {goals.map((goal) => (
                        <li
                            key={goal.value}
                            className={cn(
                                chip,
                                'border border-dashed border-primary-foreground/35 text-primary-foreground/90',
                            )}
                        >
                            <Target aria-hidden="true" />
                            {goal.label}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex gap-2 md:ml-auto">
                {favorite !== null && (
                    <FavoriteButton
                        variant="labeled"
                        trainerName={trainer.name}
                        pressed={favorite}
                        onPressedChange={onFavoriteChange}
                        className={darkButton}
                    />
                )}
                {/* On mobile "Condividi" is in the header. */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={onShare}
                    className={cn(darkButton, 'hidden md:inline-flex')}
                >
                    <Share />
                    Condividi
                </Button>
            </div>
        </section>
    );
}
