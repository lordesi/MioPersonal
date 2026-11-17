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
import {
    rangeLabel,
    toRanges,
} from '@/components/onboarding/trainer/step-hours';
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
    error?: string;
};

const shortDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

/**
 * Step 7 "Riepilogo": every step in a few lines with its "Modifica", then
 * the confirmation that the information is true.
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

    return (
        <div className="flex flex-col gap-8 md:gap-10">
            <ul className="flex flex-col rounded-[26px] bg-card px-4 md:rounded-[20px] md:bg-transparent md:px-0">
                {!editing && (
                    <Row title="Account" onEdit={() => onEdit(1)}>
                        <Main>{join([name, email])}</Main>
                        <Sub>Termini per i trainer accettati</Sub>
                    </Row>
                )}
                <Row title="Profilo pubblico" onEdit={() => onEdit(2)}>
                    <Main>{draft.headline}</Main>
                    <Sub>
                        {join([
                            'Foto, presentazione',
                            experience && `${experience} di esperienza`,
                            draft.instagram.trim() &&
                                `@${draft.instagram.trim().replace(/^@/, '')}`,
                        ])}
                    </Sub>
                </Row>
                <Row title="Discipline e luoghi" onEdit={() => onEdit(3)}>
                    <ul className="flex flex-wrap gap-1.5">
                        {draft.disciplines.map((slug) => (
                            <li
                                key={slug}
                                className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                            >
                                {labelOf(disciplines, slug)}
                            </li>
                        ))}
                    </ul>
                    <Sub>Obiettivi: {goalNames.join(', ')}</Sub>
                    <Sub>
                        {join([placeNames.join(', '), cityNames.join(', ')])}
                    </Sub>
                </Row>
                <Row title="Servizi e prezzi" onEdit={() => onEdit(4)}>
                    <Main>
                        {minPrice !== null ? (
                            <>
                                a partire da{' '}
                                <strong className="text-brand">
                                    {formatPrice(minPrice)}
                                </strong>{' '}
                                / seduta
                            </>
                        ) : (
                            'Prezzi da completare'
                        )}
                    </Main>
                    {draft.pricing.sessions.map((session, index) => (
                        <Sub key={index}>
                            {session.name.trim() || 'Tipo di seduta'}:{' '}
                            {session.prices
                                .map(
                                    (price) =>
                                        `${shortDuration(price.minutes)} ${price.priceCents !== null ? formatPrice(price.priceCents) : '—'}`,
                                )
                                .join(' · ')}
                            {session.maxPeople > 1 &&
                                ` · fino a ${session.maxPeople} persone`}
                        </Sub>
                    ))}
                    {(first.enabled || draft.pricing.packages.length > 0) && (
                        <Sub>
                            {join([
                                first.enabled &&
                                    (first.priceCents === 0
                                        ? 'Prima seduta gratuita'
                                        : `Prima seduta a ${formatPrice(first.priceCents ?? 0)}`),
                                draft.pricing.packages.length > 0 &&
                                    plural(
                                        draft.pricing.packages.length,
                                        'pacchetto',
                                        'pacchetti',
                                    ),
                            ])}
                        </Sub>
                    )}
                </Row>
                <Row title="Orari e regole" onEdit={() => onEdit(5)}>
                    <Main>
                        {join([
                            `${formatHours(weeklyHours(draft.hours))} a settimana`,
                            `preavviso ${formatHours(draft.rules.noticeHours)}`,
                        ])}
                    </Main>
                    <dl className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px] leading-4.5">
                        {draft.hours.map((hours, day) =>
                            hours.length > 0 ? (
                                <div key={day} className="contents">
                                    <dt className="text-muted-foreground">
                                        {shortDays[day]}
                                    </dt>
                                    <dd className="tabular-nums">
                                        {toRanges(hours)
                                            .map(rangeLabel)
                                            .join(' · ')}
                                    </dd>
                                </div>
                            ) : null,
                        )}
                    </dl>
                    <Sub>
                        {draft.autoConfirm
                            ? 'Conferma automatica'
                            : 'Conferma manuale'}
                    </Sub>
                </Row>
                <Row
                    title="Certificazioni"
                    optional
                    onEdit={() => onEdit(6)}
                    editLabel={
                        certifications.length === 0 ? 'Aggiungi' : undefined
                    }
                >
                    <Main>
                        {certifications.length === 0
                            ? 'Nessuna certificazione'
                            : plural(
                                  certifications.length,
                                  'certificazione',
                                  'certificazioni',
                              )}
                    </Main>
                    <Sub>
                        {certifications.length === 0
                            ? 'Puoi aggiungerle anche dopo, da Modifica profilo.'
                            : certifications
                                  .map((item) => item.title)
                                  .join(' · ')}
                    </Sub>
                </Row>
            </ul>

            <section className="flex flex-col gap-1 rounded-[26px] bg-card p-4 md:rounded-[20px] md:bg-transparent md:p-5 md:shadow-[inset_0_0_0_1px_var(--border)]">
                <label
                    htmlFor={confirmId}
                    className="flex min-h-11 cursor-pointer items-center gap-3 text-[17px] leading-5.5 font-semibold"
                >
                    <Checkbox
                        id={confirmId}
                        checked={confirmed}
                        onCheckedChange={(checked) =>
                            onConfirmedChange(checked === true)
                        }
                        aria-describedby={`${confirmId}-note`}
                        className={darkCheckboxClassName}
                    />
                    Confermo che le informazioni e le certificazioni sono vere.
                </label>
                <p
                    id={`${confirmId}-note`}
                    className="pl-8.5 text-[13px] leading-4.5 text-muted-foreground"
                >
                    Profili con dati non veritieri vengono rifiutati.
                </p>
                <DarkError message={error} />
            </section>
        </div>
    );
}

/** A step of the summary: its name, what was written and "Modifica". */
function Row({
    title,
    optional = false,
    onEdit,
    editLabel = 'Modifica',
    children,
}: {
    title: string;
    optional?: boolean;
    onEdit: () => void;
    editLabel?: string;
    children: ReactNode;
}) {
    return (
        <li className="flex items-start justify-between gap-4 border-b border-separator py-4 last:border-b-0 md:border-border md:py-5">
            <div className="flex min-w-0 flex-col gap-1.5 md:grid md:flex-1 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-x-6">
                <h2 className="flex items-center gap-2 text-[13px] leading-4.5 font-semibold tracking-[0.6px] text-muted-foreground uppercase md:pt-0.5">
                    {title}
                    {optional && (
                        <span className="rounded-full px-2 py-0.5 text-[11px] tracking-normal normal-case shadow-[inset_0_0_0_1px_var(--field)]">
                            Facoltativo
                        </span>
                    )}
                </h2>
                <div className="flex min-w-0 flex-col gap-1.5">{children}</div>
            </div>
            <button
                type="button"
                onClick={onEdit}
                aria-label={`${editLabel}: ${title}`}
                className={cn(shellLinkClassName, '-my-2.5 shrink-0')}
            >
                {editLabel}
            </button>
        </li>
    );
}

function Main({ children }: { children: ReactNode }) {
    return (
        <p className="text-[17px] leading-5.5 font-semibold break-words">
            {children}
        </p>
    );
}

function Sub({ children }: { children: ReactNode }) {
    return (
        <p className="text-[13px] leading-4.5 text-muted-foreground">
            {children}
        </p>
    );
}
