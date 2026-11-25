import { useId } from 'react';
import type { ReactNode } from 'react';
import { DarkError } from '@/components/onboarding/dark-fields';
import { shellLinkClassName } from '@/components/onboarding/dark-shell';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    experienceOptions,
    minPriceCents,
    placeOptions,
    weeklyHours,
} from '@/components/onboarding/trainer/draft';
import { shortDuration } from '@/components/trainer/services/pricing';
import { Checkbox } from '@/components/ui/checkbox';
import { darkCheckboxClassName } from '@/lib/dark-form';
import { formatHours, formatPrice } from '@/lib/format';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

type StepReviewProps = {
    draft: TrainerDraft;
    /** The account (a guest's typed name and email). */
    name: string;
    email: string;
    /** A trainer fixing the profile: the account can't be changed here. */
    editing?: boolean;
    /** From the catalog, to show names instead of slugs. */
    disciplines: CatalogOption[];
    cities: CatalogOption[];
    confirmed: boolean;
    onConfirmedChange: (confirmed: boolean) => void;
    /** "Modifica": opens that step. */
    onEdit: (step: number) => void;
    /** A photo chosen or already saved. */
    hasPhoto: boolean;
    error?: string;
};

const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

/**
 * Step 9 "Riepilogo" (design "Controlla e invia"): every step in one line
 * with its "Modifica", then the confirmation that the information is true.
 */
export default function StepReview({
    draft,
    name,
    email,
    editing = false,
    disciplines,
    cities,
    confirmed,
    onConfirmedChange,
    onEdit,
    hasPhoto,
    error,
}: StepReviewProps) {
    const confirmId = useId();
    const labelOf = (options: CatalogOption[], slug: string) =>
        options.find((option) => option.value === slug)?.label ?? slug;
    const join = (parts: (string | null | false | undefined)[]) =>
        parts.filter(Boolean).join(' · ');

    const experience = experienceOptions.find(
        (option) => option.value === draft.experience,
    )?.label;
    const goalNames = trainingGoals
        .filter((goal) => draft.goals.includes(goal.value))
        .map((goal) => goal.label);
    const placeNames = placeOptions
        .filter((place) => draft.places.includes(place.value))
        .map((place) => place.label);
    const cityNames = [draft.city, ...draft.otherCities]
        .filter((slug) => slug !== '')
        .map((slug) => labelOf(cities, slug));
    const minPrice = minPriceCents(draft);
    const first = draft.pricing.firstSession;
    const certifications = draft.certifications.filter(
        (item) => item.title.trim() !== '',
    );

    const sessions = draft.pricing.sessions.flatMap((session) =>
        session.prices.map(
            (price) =>
                `${shortDuration(price.minutes)} ${price.priceCents !== null ? formatPrice(price.priceCents) : '—'}`,
        ),
    );

    return (
        <div className="flex flex-col gap-6">
            <ul className="flex flex-col">
                {!editing && (
                    <Row title="Account" onEdit={() => onEdit(1)}>
                        {join([name, email])}
                    </Row>
                )}
                <Row title="Foto profilo" onEdit={() => onEdit(2)}>
                    {hasPhoto ? 'Caricata' : 'Da aggiungere'}
                </Row>
                <Row title="Presentazione" onEdit={() => onEdit(3)}>
                    {join([draft.headline.trim(), experience])}
                </Row>
                <Row title="Discipline" onEdit={() => onEdit(4)}>
                    {join([
                        draft.disciplines
                            .map((slug) => labelOf(disciplines, slug))
                            .join(', '),
                        goalNames.length > 0 &&
                            `Obiettivi: ${goalNames.join(', ')}`,
                    ])}
                </Row>
                <Row title="Dove alleni" onEdit={() => onEdit(5)}>
                    {join([placeNames.join(', '), cityNames.join(', ')])}
                </Row>
                <Row title="Servizi e prezzi" onEdit={() => onEdit(6)}>
                    {join([
                        sessions.length > 0
                            ? sessions.join(' · ')
                            : minPrice !== null
                              ? `da ${formatPrice(minPrice)}`
                              : 'Prezzi da completare',
                        first.enabled &&
                            (first.priceCents === 0
                                ? 'prima seduta gratuita'
                                : `prima seduta ${formatPrice(first.priceCents ?? 0)}`),
                        draft.pricing.packages.length > 0 &&
                            plural(
                                draft.pricing.packages.length,
                                'pacchetto',
                                'pacchetti',
                            ),
                    ])}
                </Row>
                <Row title="Orari" onEdit={() => onEdit(7)}>
                    {join([
                        `${formatHours(weeklyHours(draft.hours))} a settimana`,
                        `preavviso ${formatHours(draft.rules.noticeHours)}`,
                        draft.autoConfirm && 'conferma automatica',
                    ])}
                </Row>
                <Row title="Certificazioni" onEdit={() => onEdit(8)}>
                    {certifications.length === 0
                        ? 'Nessuna · puoi aggiungerle dopo'
                        : certifications.map((item) => item.title).join(' · ')}
                </Row>
            </ul>

            <label
                htmlFor={confirmId}
                className="flex min-h-14 cursor-pointer items-center gap-3.5 py-2 text-[15px] leading-5.25 font-medium"
            >
                <Checkbox
                    id={confirmId}
                    checked={confirmed}
                    onCheckedChange={(checked) =>
                        onConfirmedChange(checked === true)
                    }
                    className={darkCheckboxClassName}
                />
                Confermo che le informazioni e le certificazioni sono vere.
            </label>
            <DarkError message={error} />
        </div>
    );
}

/** A step of the summary: its name, one line and "Modifica". */
function Row({
    title,
    onEdit,
    children,
}: {
    title: string;
    onEdit: () => void;
    children: ReactNode;
}) {
    return (
        <li className="flex items-center gap-3.5 border-b border-separator py-4">
            <span className="flex min-w-0 flex-1 flex-col gap-0.75">
                <span className="text-[17px] font-semibold">{title}</span>
                <span className="text-[15px] leading-5 break-words text-muted-foreground">
                    {children}
                </span>
            </span>
            <button
                type="button"
                onClick={onEdit}
                aria-label={`Modifica: ${title}`}
                className={cn(shellLinkClassName, 'shrink-0')}
            >
                Modifica
            </button>
        </li>
    );
}
