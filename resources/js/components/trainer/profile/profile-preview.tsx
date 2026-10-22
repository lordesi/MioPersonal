import { Check, Target } from 'lucide-react';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    BIO_MIN,
    isCertificationValid,
    isFilled,
    needsCity,
} from '@/components/onboarding/trainer/draft';
import RatingSummary from '@/components/trainer/rating-summary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useInitials } from '@/hooks/use-initials';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

export type ProfileCheck = { label: string; done: boolean };

/**
 * The list of "Profilo completo". The gallery and the certifications are
 * optional: they count for the percentage but don't stop "Salva modifiche".
 */
export function profileChecks(
    draft: TrainerDraft,
    photo: string | null,
    galleryCount: number,
): ProfileCheck[] {
    return [
        { label: 'Foto profilo', done: photo !== null },
        { label: 'Titolo del profilo', done: draft.headline.trim() !== '' },
        {
            label: 'Chi sei e come lavori',
            done: draft.bio.trim().length >= BIO_MIN,
        },
        { label: 'Anni di esperienza', done: draft.experience !== '' },
        { label: 'Foto della galleria', done: galleryCount > 0 },
        {
            label: 'Discipline e obiettivi',
            done: draft.disciplines.length > 0 && draft.goals.length > 0,
        },
        {
            label: 'Luoghi e città',
            done:
                draft.places.length > 0 &&
                (!needsCity(draft) || draft.city !== ''),
        },
        {
            label: 'Formazione e certificazioni',
            done:
                draft.certifications.some(isFilled) &&
                draft.certifications.every(isCertificationValid),
        },
    ];
}

type ProfilePreviewProps = {
    draft: TrainerDraft;
    userName: string;
    /** The new photo or the saved one. */
    photo: string | null;
    /** null without reviews: "Nuovo". */
    rating: { value: number | null; count: number };
    /** For the names of disciplines and cities. */
    disciplines: CatalogOption[];
    cities: CatalogOption[];
    checks: ProfileCheck[];
    /** "Modifiche non salvate", "Salvataggio…"; null when nothing changed. */
    status: string | null;
    changed: boolean;
    canSave: boolean;
    saving: boolean;
};

/**
 * "Anteprima": the black panel of "Il mio profilo" with the card at the size
 * of the search and home cards (TrainerCard), how complete the profile is,
 * and the save button of the page (a submit button of its form).
 */
export default function ProfilePreview({
    draft,
    userName,
    photo,
    rating,
    disciplines,
    cities,
    checks,
    status,
    changed,
    canSave,
    saving,
}: ProfilePreviewProps) {
    const getInitials = useInitials();
    const nameOf = (options: CatalogOption[], value: string) =>
        options.find((option) => option.value === value)?.label ?? value;

    const online = draft.places.includes('online');
    const onlineOnly = online && !needsCity(draft);
    const cityNames = [draft.city, ...draft.otherCities]
        .filter((slug) => slug !== '')
        .map((slug) => nameOf(cities, slug));
    let cityLine = 'Nessuna città';

    if (onlineOnly) {
        cityLine = 'Solo online';
    } else if (cityNames.length > 0) {
        cityLine = cityNames.join(' · ');
    }

    const goals = trainingGoals
        .filter((goal) => draft.goals.includes(goal.value))
        .map((goal) => goal.label);
    const done = checks.filter((check) => check.done).length;
    const percent = Math.round((done / checks.length) * 100);

    return (
        <section
            aria-labelledby="profile-preview-title"
            className="flex flex-col gap-4.5 rounded-3xl bg-sidebar p-5.5 text-sidebar-foreground"
        >
            <h2
                id="profile-preview-title"
                className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground"
            >
                ANTEPRIMA
            </h2>

            {/* The width of a home card on phones, close to a search result. */}
            <div className="mx-auto w-full max-w-76 overflow-hidden rounded-[20px] bg-card text-card-foreground">
                <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden bg-sidebar-accent">
                    {photo ? (
                        <img
                            src={photo}
                            alt=""
                            className="size-full object-cover"
                        />
                    ) : (
                        <span className="text-[46px] leading-[50px] font-bold tracking-[-0.03em] text-sidebar-foreground">
                            {getInitials(userName)}
                        </span>
                    )}
                    {online && (
                        <PreviewPill className="absolute top-2.5 left-2.5">
                            {onlineOnly ? 'Solo online' : 'Anche online'}
                        </PreviewPill>
                    )}
                    {!photo && (
                        <PreviewPill className="absolute right-2.5 bottom-2.5">
                            Foto mancante
                        </PreviewPill>
                    )}
                </div>
                <div className="flex flex-col gap-2.5 p-4">
                    <div className="flex justify-between gap-2">
                        <span className="text-[17px] leading-6 font-semibold">
                            {userName}
                        </span>
                        {rating.value === null ? (
                            <Badge
                                variant="outline"
                                className="h-5.5 flex-none rounded-full px-2 text-[11px] font-semibold"
                            >
                                Nuovo
                            </Badge>
                        ) : (
                            <RatingSummary
                                rating={rating.value}
                                reviewCount={rating.count}
                                className="flex-none"
                            />
                        )}
                    </div>
                    {draft.headline.trim() !== '' ? (
                        <span className="text-[13px] leading-4.5 break-words text-foreground/80">
                            {draft.headline}
                        </span>
                    ) : (
                        <span className="text-[13px] leading-4.5 text-muted-foreground italic">
                            Il tuo titolo comparirà qui
                        </span>
                    )}
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        {cityLine}
                    </span>
                    {draft.disciplines.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {draft.disciplines.slice(0, 3).map((slug) => (
                                <span
                                    key={slug}
                                    className="inline-flex h-6.5 items-center rounded-full bg-secondary px-2.5 text-xs font-medium"
                                >
                                    {nameOf(disciplines, slug)}
                                </span>
                            ))}
                        </div>
                    )}
                    {goals.length > 0 && (
                        <span className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Target
                                aria-hidden="true"
                                className="mt-0.5 size-3.25 flex-none"
                            />
                            {goals.join(' · ')}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] leading-5.5 font-semibold">
                        Profilo completo
                    </span>
                    <span className="text-[22px] leading-7 font-bold tabular-nums">
                        {percent}%
                    </span>
                </div>
                <div
                    role="progressbar"
                    aria-label="Completamento del profilo"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 overflow-hidden rounded-full bg-sidebar-border"
                >
                    <div
                        className="h-full rounded-full bg-sidebar-primary transition-[width]"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <ul className="mt-1 flex flex-col gap-2.5">
                    {checks.map((check) => (
                        <li
                            key={check.label}
                            className="flex items-start gap-2.5 text-sm"
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'flex size-5 flex-none items-center justify-center rounded-full',
                                    check.done
                                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                        : 'border-[1.5px] border-dashed border-muted-foreground text-transparent',
                                )}
                            >
                                <Check
                                    strokeWidth={3.5}
                                    className="size-2.75"
                                />
                            </span>
                            <span
                                className={cn(
                                    check.done
                                        ? 'text-sidebar-foreground/90'
                                        : 'font-semibold text-sidebar-primary',
                                )}
                            >
                                {check.label}
                                <span className="sr-only">
                                    {check.done ? ': fatto' : ': da fare'}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border pt-4">
                {/* Always in the page, so screen readers hear the changes. */}
                <span
                    role="status"
                    className="flex items-center gap-2 text-[13px] leading-4.5 text-sidebar-foreground/80 empty:hidden"
                >
                    {status && (
                        <>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'size-2 rounded-full',
                                    changed
                                        ? 'bg-sidebar-primary'
                                        : 'bg-muted-foreground',
                                )}
                            />
                            {status}
                        </>
                    )}
                </span>
                <Button
                    type="submit"
                    disabled={!canSave || saving}
                    className="ml-auto h-11 rounded-xl bg-sidebar-primary px-4.5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90 disabled:bg-sidebar-border disabled:text-muted-foreground disabled:opacity-100"
                >
                    {saving && <Spinner />}
                    Salva modifiche
                </Button>
            </div>
        </section>
    );
}

function PreviewPill({
    className,
    children,
}: {
    className: string;
    children: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex h-6.5 items-center rounded-full bg-background px-2.5 text-xs font-semibold text-foreground',
                className,
            )}
        >
            {children}
        </span>
    );
}
