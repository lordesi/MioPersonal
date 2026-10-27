import { Check, Minus } from 'lucide-react';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    experienceOptions,
    minPriceCents,
    placeOptions,
    serviceCount,
    weeklyHours,
} from '@/components/onboarding/trainer/draft';
import {
    CheckRow,
    DarkPanel,
    StepColumns,
} from '@/components/onboarding/trainer/onboarding-shell';
import SearchCardPreview from '@/components/onboarding/trainer/search-card-preview';
import { weekRangesLabel } from '@/components/trainer/hours/availability-summary';
import { formatHours, formatPrice } from '@/lib/format';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

type StepReviewProps = {
    draft: TrainerDraft;
    /** The account (a guest's typed name and email). */
    name: string;
    email: string;
    photo: string | null;
    /** A trainer fixing the profile: the account can't be changed here. */
    editing?: boolean;
    /** From the catalog, to show names instead of slugs. */
    disciplines: CatalogOption[];
    cities: CatalogOption[];
    confirmed: boolean;
    onConfirmedChange: (confirmed: boolean) => void;
};

const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

/** Step 7: summary of every step, preview of the search card, final check. */
export default function StepReview({
    draft,
    name,
    email,
    photo,
    editing = false,
    disciplines,
    cities,
    confirmed,
    onConfirmedChange,
}: StepReviewProps) {
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
    const packages = draft.pricing.packages.filter(
        (item) => item.priceCents !== null,
    );
    const certifications = draft.certifications.filter(
        (item) => item.title.trim() !== '',
    );

    const rows = [
        {
            step: 1,
            title: 'Account',
            main: join([name, email]),
            sub: 'Termini per i trainer accettati',
        },
        {
            step: 2,
            title: 'Profilo pubblico',
            main: draft.headline,
            sub: join([
                'Foto, presentazione',
                experience && `${experience} di esperienza`,
            ]),
        },
        {
            step: 3,
            title: 'Discipline e città',
            main: draft.disciplines
                .map((slug) => labelOf(disciplines, slug))
                .join(', '),
            sub: join([
                goalNames.join(', '),
                placeNames.join(', '),
                cityNames.join(', '),
            ]),
        },
        {
            step: 4,
            title: 'Servizi e prezzi',
            main: join([
                plural(serviceCount(draft), 'servizio', 'servizi'),
                minPrice !== null && `da ${formatPrice(minPrice)}`,
            ]),
            sub: join([
                first.enabled &&
                    (first.priceCents === 0
                        ? 'Prima seduta gratuita'
                        : first.priceCents !== null &&
                          `Prima seduta a ${formatPrice(first.priceCents)}`),
                ...packages.map(
                    (item) =>
                        `pacchetto da ${item.sessions} sedute a ${formatPrice(item.priceCents ?? 0)}`,
                ),
            ]),
        },
        {
            step: 5,
            title: 'Orari e regole',
            main: join([
                `${formatHours(weeklyHours(draft.hours))} a settimana`,
                `preavviso ${formatHours(draft.rules.noticeHours)}`,
            ]),
            sub: join([
                weekRangesLabel(draft.hours),
                draft.autoConfirm ? 'conferma automatica' : 'conferma manuale',
            ]),
        },
        {
            step: 6,
            title: 'Certificazioni',
            optional: certifications.length === 0,
            main:
                certifications.length === 0
                    ? 'Nessuna certificazione'
                    : plural(
                          certifications.length,
                          'certificazione',
                          'certificazioni',
                      ),
            sub:
                certifications.length === 0
                    ? 'Puoi aggiungerle anche dopo, da Modifica profilo'
                    : certifications.map((item) => item.title).join(' · '),
        },
    ];

    return (
        <StepColumns
            aside={
                <DarkPanel title="Anteprima">
                    <SearchCardPreview
                        draft={draft}
                        name={name}
                        photo={photo}
                        disciplines={disciplines}
                        cities={cities}
                        search
                        price
                    />
                </DarkPanel>
            }
        >
            <section
                aria-label="Riepilogo dei passi"
                className="rounded-3xl border bg-card p-2"
            >
                <ul className="flex flex-col">
                    {rows
                        .filter((row) => !editing || row.step > 1)
                        .map((row) => (
                            <li
                                key={row.step}
                                className="flex items-start gap-3.5 rounded-2xl border-t p-4 first:border-t-0"
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'mt-px flex size-7 flex-none items-center justify-center rounded-full',
                                        row.optional
                                            ? 'border-[1.5px] border-dashed border-ring text-ring'
                                            : 'bg-foreground text-background',
                                    )}
                                >
                                    {row.optional ? (
                                        <Minus
                                            strokeWidth={3}
                                            className="size-3.5"
                                        />
                                    ) : (
                                        <Check
                                            strokeWidth={3}
                                            className="size-3.5"
                                        />
                                    )}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="flex flex-wrap items-center gap-2">
                                        <span className="text-[15px] leading-5.5 font-bold">
                                            {row.title}
                                        </span>
                                        {row.optional && (
                                            <span className="inline-flex h-5 items-center rounded-full bg-secondary px-2 text-[11px] font-semibold text-foreground/70">
                                                Facoltativo
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-sm break-words tabular-nums">
                                        {row.main}
                                    </span>
                                    {row.sub && (
                                        <span className="text-[13px] leading-4.5 break-words text-muted-foreground tabular-nums">
                                            {row.sub}
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
                </ul>
            </section>

            <CheckRow checked={confirmed} onCheckedChange={onConfirmedChange}>
                <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] leading-5.5 font-semibold">
                        Confermo che le informazioni e le certificazioni sono
                        vere.
                    </span>
                    <span className="text-[13px] leading-4.5 text-foreground/70">
                        Profili con dati non veritieri vengono rifiutati.
                    </span>
                </span>
            </CheckRow>
        </StepColumns>
    );
}
