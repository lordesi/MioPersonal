import { router } from '@inertiajs/react';
import { Check, Search } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import SegmentedControl from '@/components/shared/segmented-control';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { searchUrl } from '@/lib/search';

// TODO: load disciplines and zones from the database.
const disciplines = [
    { value: 'functional-training', label: 'Functional training' },
    { value: 'pesi-bodybuilding', label: 'Pesi e bodybuilding' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'crossfit', label: 'Crossfit' },
    { value: 'boxe', label: 'Boxe' },
];

const zones = [
    { value: 'citta-studi', label: 'Città Studi' },
    { value: 'citylife', label: 'CityLife' },
    { value: 'lambrate', label: 'Lambrate' },
    { value: 'navigli', label: 'Navigli' },
    { value: 'porta-romana', label: 'Porta Romana' },
    { value: 'porta-venezia', label: 'Porta Venezia' },
    { value: 'monza', label: 'Monza' },
];

type Mode = 'tutte' | 'presenza' | 'online';

const modes: { value: Mode; label: string }[] = [
    { value: 'tutte', label: 'Tutte' },
    { value: 'presenza', label: 'In presenza' },
    { value: 'online', label: 'Online' },
];

const ALL = 'all';

const benefits = [
    'Gratis per chi cerca un trainer',
    'Ogni profilo è approvato dal nostro team',
    'Recensioni solo da sedute svolte davvero',
];

function FilterSelect({
    id,
    label,
    allLabel,
    options,
    value,
    onChange,
}: {
    id: string;
    label: string;
    allLabel: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Select
                value={value}
                onValueChange={(v) => onChange(v === ALL ? '' : v)}
            >
                <SelectTrigger
                    id={id}
                    className="w-full bg-background text-base data-[size=default]:h-11"
                >
                    <SelectValue placeholder={allLabel} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>{allLabel}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

/** Home hero: headline, benefits and the search form. */
export default function HeroSearch() {
    const [discipline, setDiscipline] = useState('');
    const [zone, setZone] = useState('');
    const [mode, setMode] = useState<Mode>('tutte');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            searchUrl({
                disciplina: discipline,
                zona: zone,
                modalita: mode === 'tutte' ? null : mode,
            }),
        );
    };

    return (
        <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 pt-8 pb-10 md:px-8 lg:grid-cols-2 lg:content-center lg:gap-x-16 lg:gap-y-6 lg:pt-20 lg:pb-0">
            <div className="flex flex-col gap-5 lg:col-start-1 lg:row-start-1 lg:gap-6 lg:self-end">
                <h1 className="text-4xl leading-10 font-bold tracking-tight md:text-5xl md:leading-[52px]">
                    Trova il personal trainer giusto, vicino a te.
                </h1>
                <p className="max-w-130 text-base text-muted-foreground md:text-lg md:leading-7">
                    Cerca per disciplina e zona, confronta profili e prezzi
                    indicativi, richiedi una seduta in pochi minuti. Gratis.
                </p>
            </div>

            <form
                role="search"
                aria-label="Cerca un personal trainer"
                onSubmit={submit}
                className="flex flex-col gap-3.5 rounded-xl border bg-card p-4 shadow-sm md:gap-4 md:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1"
            >
                <h2 className="hidden text-xl font-semibold tracking-tight md:block">
                    Trova il trainer perfetto per te!
                </h2>
                <FilterSelect
                    id="hero-discipline"
                    label="Disciplina"
                    allLabel="Tutte le discipline"
                    options={disciplines}
                    value={discipline}
                    onChange={setDiscipline}
                />
                <FilterSelect
                    id="hero-zone"
                    label="Zona"
                    allLabel="Tutta Milano e provincia"
                    options={zones}
                    value={zone}
                    onChange={setZone}
                />
                <div className="flex flex-col gap-1.5">
                    <span
                        id="hero-mode"
                        className="text-sm leading-none font-medium"
                    >
                        Modalità
                    </span>
                    <SegmentedControl
                        aria-labelledby="hero-mode"
                        options={modes}
                        value={mode}
                        onChange={setMode}
                    />
                </div>
                <Button type="submit" className="h-11 px-6">
                    <Search />
                    Cerca trainer
                </Button>
                <p className="text-center text-xs font-medium text-muted-foreground">
                    Per guardare i profili non serve registrarsi.
                </p>
            </form>

            <ul className="flex flex-col gap-2.5 text-sm lg:col-start-1 lg:row-start-2 lg:self-start">
                {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2.5">
                        <Check aria-hidden="true" className="size-4 shrink-0" />
                        {benefit}
                    </li>
                ))}
            </ul>
        </section>
    );
}
