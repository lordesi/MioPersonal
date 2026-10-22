import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Clock,
    Dumbbell,
    Euro,
    MapPin,
    ShieldCheck,
    Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    budgetLabel,
    preferredTimes,
} from '@/components/client/preferences-fields';
import type { PreferencesData } from '@/components/client/preferences-fields';
import { Button } from '@/components/ui/button';
import { trainingGoals } from '@/lib/goals';
import { searchUrl } from '@/lib/search';
import type { SearchFilters } from '@/lib/search';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

type PreferencesPreviewProps = {
    data: PreferencesData;
    /** For the names of disciplines and cities. */
    disciplines: CatalogOption[];
    cities: CatalogOption[];
    /** Something differs from the saved answers. */
    changed: boolean;
    saving: boolean;
};

type SummaryRow = {
    label: string;
    value: string;
    /** Not chosen yet: written in grey italics. */
    empty: boolean;
    icon: LucideIcon;
};

/** App\Enums\TrainingMode → "modalita" of the search; "Entrambe" is no filter. */
const searchModes: Record<string, SearchFilters['modalita']> = {
    in_person: 'presenza',
    online: 'online',
};

/** "a Roma", "ad Alessandria". */
function inCity(city: string): string {
    return /^a/i.test(city) ? `ad ${city}` : `a ${city}`;
}

/**
 * "Anteprima": the black panel of "Modifica il mio profilo" with what the
 * client is looking for, the link to the search with those filters and the
 * save button of the page (a submit button of its form).
 */
export default function PreferencesPreview({
    data,
    disciplines,
    cities,
    changed,
    saving,
}: PreferencesPreviewProps) {
    const nameOf = (options: CatalogOption[], value: string) =>
        options.find((option) => option.value === value)?.label ?? value;

    const online = data.mode === 'online';
    // Online the city doesn't count, as in the search.
    const city = data.city && !online ? nameOf(cities, data.city) : null;
    const disciplineNames = data.disciplines.map((slug) =>
        nameOf(disciplines, slug),
    );
    const goal = trainingGoals.find((option) => option.value === data.goal);
    const timeNames = preferredTimes
        .filter((time) => data.times.includes(time.value))
        .map((time) => time.label);

    let headline =
        disciplineNames.length > 0
            ? `Trainer di ${disciplineNames[0]}`
            : 'Personal trainer';

    if (online) {
        headline += ' online';
    } else if (city) {
        headline += ` ${inCity(city)}`;
    }

    let where = 'Scegli la città';

    if (online) {
        where = 'Online, da dove vuoi';
    } else if (city && data.mode === 'in_person') {
        where = `${city} · in presenza`;
    } else if (city && data.mode === 'both') {
        where = `${city} · in presenza e online`;
    } else if (city) {
        where = city;
    }

    const summary: SummaryRow[] = [
        {
            label: 'Dove',
            value: where,
            empty: !online && city === null,
            icon: MapPin,
        },
        {
            label: 'Obiettivo',
            value: goal?.label ?? 'Non ancora scelto',
            empty: goal === undefined,
            icon: Target,
        },
        {
            label: 'Discipline',
            value:
                disciplineNames.length > 0
                    ? disciplineNames.join(', ')
                    : 'Tutte, finché non ne scegli qualcuna',
            empty: disciplineNames.length === 0,
            icon: Dumbbell,
        },
        {
            label: 'Quando',
            value:
                timeNames.length > 0
                    ? timeNames.join(', ')
                    : 'Qualsiasi momento',
            empty: timeNames.length === 0,
            icon: Clock,
        },
        {
            label: 'Budget a seduta',
            value: budgetLabel(data.budget_max_cents),
            empty: data.budget_max_cents === null,
            icon: Euro,
        },
    ];

    // The budget isn't a filter: the trainers above it stay in the results.
    const trainersUrl = searchUrl(
        {
            disciplina: data.disciplines,
            obiettivo: goal ? [goal.value] : null,
            modalita: searchModes[data.mode ?? ''] ?? null,
        },
        online ? null : data.city,
    );

    return (
        <section
            aria-labelledby="preferences-preview-title"
            className="flex flex-col gap-4.5 rounded-3xl bg-sidebar p-5.5 text-sidebar-foreground"
        >
            <div className="flex flex-col gap-1.5">
                <h2
                    id="preferences-preview-title"
                    className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground"
                >
                    ANTEPRIMA
                </h2>
                <span className="text-[22px] leading-7 font-bold tracking-[-0.02em]">
                    {headline}
                </span>
            </div>

            <dl className="flex flex-col gap-2">
                {summary.map(({ label, value, empty, icon: Icon }) => (
                    <div
                        key={label}
                        className="flex items-start gap-3 rounded-[14px] bg-sidebar-accent px-3.5 py-3"
                    >
                        <span
                            aria-hidden="true"
                            className="flex size-7.5 flex-none items-center justify-center rounded-full bg-sidebar-border"
                        >
                            <Icon className="size-3.5" />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-px">
                            <dt className="text-xs text-sidebar-muted-foreground">
                                {label}
                            </dt>
                            <dd
                                className={cn(
                                    'text-sm break-words',
                                    empty
                                        ? 'text-sidebar-muted-foreground italic'
                                        : 'font-semibold',
                                )}
                            >
                                {value}
                            </dd>
                        </div>
                    </div>
                ))}
            </dl>

            <Button
                asChild
                className="h-11.5 rounded-xl bg-sidebar-primary text-[15px] font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            >
                <Link href={trainersUrl}>
                    Vedi i trainer per te
                    <ArrowRight aria-hidden="true" strokeWidth={2.5} />
                </Link>
            </Button>

            <p className="flex gap-2.5 text-[13px] leading-4.5 text-sidebar-foreground/80">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-px size-4 flex-none"
                />
                Non ti chiediamo dati sulla salute. Puoi cambiare queste
                preferenze quando vuoi.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border pt-4">
                <span
                    role="status"
                    className="text-[13px] text-sidebar-muted-foreground"
                >
                    {saving && 'Salvataggio…'}
                    {!saving && changed && 'Modifiche non salvate'}
                </span>
                <Button
                    type="submit"
                    disabled={!changed || saving}
                    className="h-11 rounded-xl bg-sidebar-primary px-4.5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90 disabled:bg-sidebar-border disabled:text-sidebar-muted-foreground disabled:opacity-100"
                >
                    Salva modifiche
                </Button>
            </div>
        </section>
    );
}
