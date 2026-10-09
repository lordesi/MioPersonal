import {
    Award,
    MapPin,
    MessageCircle,
    RotateCcw,
    Share,
    ShieldCheck,
    Star,
    Video,
} from 'lucide-react';
import FavoriteButton from '@/components/shared/favorite-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { formatRating } from '@/lib/format';
import type { TrainerProfile } from '@/types';

type ProfileIntroProps = {
    trainer: TrainerProfile;
    favorite: boolean;
    onFavoriteChange: (favorite: boolean) => void;
    onShare: () => void;
};

const pill = 'h-5.5 rounded-full px-2 text-xs font-medium';

/** Photo, name, verified badge, key facts and disciplines. */
export default function ProfileIntro({
    trainer,
    favorite,
    onFavoriteChange,
    onShare,
}: ProfileIntroProps) {
    const getInitials = useInitials();
    const onlineLabel =
        trainer.online === 'also'
            ? 'Anche online'
            : trainer.online === 'only'
              ? 'Solo online'
              : null;

    return (
        <section
            aria-labelledby="profile-name"
            className="flex flex-col gap-3.5 md:flex-row md:flex-wrap md:items-center md:gap-8"
        >
            <div className="flex items-center gap-4 md:contents">
                <span
                    role="img"
                    aria-label={`Foto profilo di ${trainer.name}`}
                    className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-muted text-[32px] font-bold tracking-tight text-muted-foreground md:size-30 md:rounded-full md:text-5xl"
                >
                    {getInitials(trainer.name)}
                </span>

                <div className="flex min-w-0 flex-col gap-1 md:flex-[1_1_400px] md:gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h1
                            id="profile-name"
                            className="flex items-center gap-2 text-3xl font-bold tracking-tight md:gap-3 md:text-4xl"
                        >
                            {trainer.name}
                            {trainer.verified && (
                                <span
                                    role="img"
                                    aria-label="Profilo approvato"
                                    title="Profilo approvato"
                                    className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground md:size-8"
                                >
                                    <ShieldCheck className="size-3.5 md:size-5" />
                                </span>
                            )}
                        </h1>
                        <div className="hidden gap-2 md:flex">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onShare}
                            >
                                <Share />
                                Condividi
                            </Button>
                            <FavoriteButton
                                variant="labeled"
                                trainerName={trainer.name}
                                pressed={favorite}
                                onPressedChange={onFavoriteChange}
                            />
                        </div>
                    </div>

                    {/* Mobile: headline and rating under the name */}
                    <span className="text-sm text-muted-foreground md:hidden">
                        {trainer.headline}
                    </span>
                    {trainer.rating !== null && (
                        <a
                            href="#recensioni"
                            className="flex items-center gap-1.5 text-sm font-semibold tabular-nums md:hidden"
                        >
                            <Star
                                aria-hidden="true"
                                className="size-3.5 fill-current"
                            />
                            {formatRating(trainer.rating)}{' '}
                            <span className="font-normal text-muted-foreground">
                                · {trainer.reviewCount} recensioni
                            </span>
                        </a>
                    )}

                    {/* Desktop: facts row */}
                    <div className="hidden flex-wrap items-center gap-x-5 gap-y-2 text-sm tabular-nums md:flex">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Award aria-hidden="true" className="size-4" />
                            {trainer.experienceLabel}
                        </span>
                        {trainer.rating !== null && (
                            <a
                                href="#recensioni"
                                className="flex items-center gap-1.5 font-semibold"
                            >
                                <Star
                                    aria-hidden="true"
                                    className="size-4 fill-current"
                                />
                                {formatRating(trainer.rating)}{' '}
                                <span className="font-normal text-muted-foreground">
                                    · {trainer.reviewCount} recensioni
                                </span>
                            </a>
                        )}
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin aria-hidden="true" className="size-4" />
                            {trainer.zones.join(', ')}
                        </span>
                        {onlineLabel && (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Video aria-hidden="true" className="size-4" />
                                {onlineLabel}
                            </span>
                        )}
                    </div>

                    <div className="hidden flex-wrap gap-1.5 md:flex">
                        {trainer.disciplines.map((discipline) => (
                            <Badge
                                key={discipline}
                                variant="secondary"
                                className={`${pill} border-transparent`}
                            >
                                {discipline}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile only: pills, zones and extra facts */}
            <div className="flex flex-wrap gap-1.5 md:hidden">
                {onlineLabel && (
                    <Badge variant="outline" className={`${pill} gap-1`}>
                        <Video aria-hidden="true" />
                        {onlineLabel}
                    </Badge>
                )}
                {trainer.disciplines.map((discipline) => (
                    <Badge
                        key={discipline}
                        variant="secondary"
                        className={`${pill} border-transparent`}
                    >
                        {discipline}
                    </Badge>
                ))}
            </div>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground md:hidden">
                <MapPin aria-hidden="true" className="size-3.5" />
                {trainer.zones.join(', ')}
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] leading-5 tabular-nums md:hidden">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Award aria-hidden="true" className="size-3.5" />
                    {trainer.experienceLabel}
                </span>
                <span className="flex items-center gap-1.5">
                    <MessageCircle aria-hidden="true" className="size-4" />
                    {trainer.responseTimeLabel}
                </span>
                <span className="flex items-center gap-1.5">
                    <RotateCcw aria-hidden="true" className="size-4" />
                    {trainer.cancellationLabel}
                </span>
            </div>
        </section>
    );
}
