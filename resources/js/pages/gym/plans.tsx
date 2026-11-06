import { Head, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import Panel from '@/components/trainer/area/panel';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/gym/plans';

type Period = 'monthly' | 'quarterly' | 'yearly' | 'entries';

type Plan = {
    id: number | null;
    name: string;
    period: Period;
    entriesCount: number | null;
    priceCents: number;
    features: string[];
    note: string;
    isActive: boolean;
};

type GymPlansProps = {
    plans: (Plan & { id: number })[];
    max: number;
    maxFeatures: number;
};

const periods: { value: Period; label: string }[] = [
    { value: 'monthly', label: 'Mensile' },
    { value: 'quarterly', label: 'Trimestrale' },
    { value: 'yearly', label: 'Annuale' },
    { value: 'entries', label: 'Pacchetto ingressi' },
];

const newPlan = (): Plan => ({
    id: null,
    name: '',
    period: 'monthly',
    entriesCount: null,
    priceCents: 0,
    features: [],
    note: '',
    isActive: true,
});

/** "45,50" → 4550. */
const toCents = (text: string) =>
    Math.round(Number(text.replace(',', '.')) * 100) || 0;

const toEuros = (cents: number) =>
    cents === 0 ? '' : (cents / 100).toString().replace('.', ',');

/**
 * "Abbonamenti": shown on the profile, bought at the gym. Saved all
 * together with "Salva abbonamenti".
 */
export default function GymPlans({
    plans: saved,
    max,
    maxFeatures,
}: GymPlansProps) {
    const [plans, setPlans] = useState<Plan[]>(saved);
    const [prices, setPrices] = useState<string[]>(
        saved.map((plan) => toEuros(plan.priceCents)),
    );
    const form = useForm({});

    const change = (index: number, changes: Partial<Plan>) =>
        setPlans(
            plans.map((plan, i) =>
                i === index ? { ...plan, ...changes } : plan,
            ),
        );

    const move = (index: number, by: number) => {
        const next = [...plans];
        const nextPrices = [...prices];
        [next[index], next[index + by]] = [next[index + by], next[index]];
        [nextPrices[index], nextPrices[index + by]] = [
            nextPrices[index + by],
            nextPrices[index],
        ];
        setPlans(next);
        setPrices(nextPrices);
    };

    const remove = (index: number) => {
        setPlans(plans.filter((_, i) => i !== index));
        setPrices(prices.filter((_, i) => i !== index));
    };

    const save = () => {
        form.transform(() => ({
            plans: plans.map((plan) => ({
                id: plan.id,
                name: plan.name,
                period: plan.period,
                entries_count:
                    plan.period === 'entries' ? plan.entriesCount : null,
                price_cents: plan.priceCents,
                features: plan.features.filter((line) => line.trim() !== ''),
                note: plan.note,
                is_active: plan.isActive,
            })),
        }));
        form.put(update.url(), {
            preserveScroll: true,
            // The new plans have their id now: start again from the saved list.
            onSuccess: (page) => {
                const fresh = (page.props as unknown as GymPlansProps).plans;
                setPlans(fresh);
                setPrices(fresh.map((plan) => toEuros(plan.priceCents)));
            },
        });
    };

    const errors = Object.values(form.errors as Record<string, string>);

    return (
        <>
            <Head title="Abbonamenti" />

            <PageHeading
                title="Abbonamenti"
                description="Compaiono nel profilo; si pagano in palestra. Il prezzo mensile più basso è quello mostrato nella ricerca."
                action={
                    plans.length < max && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setPlans([...plans, newPlan()]);
                                setPrices([...prices, '']);
                            }}
                        >
                            <Plus aria-hidden="true" />
                            Aggiungi abbonamento
                        </Button>
                    )
                }
            />

            <StepErrors errors={errors} title="Da sistemare:" />

            {plans.length === 0 && (
                <Panel>
                    <p className="text-sm text-muted-foreground">
                        Nessun abbonamento. Aggiungi almeno il mensile: chi
                        cerca per budget trova solo le palestre con un prezzo.
                    </p>
                </Panel>
            )}

            {plans.map((plan, index) => (
                <Panel
                    key={plan.id ?? `new-${index}`}
                    title={plan.name || `Abbonamento ${index + 1}`}
                    action={
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Sposta su"
                                disabled={index === 0}
                                onClick={() => move(index, -1)}
                            >
                                <ArrowUp aria-hidden="true" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Sposta giù"
                                disabled={index === plans.length - 1}
                                onClick={() => move(index, 1)}
                            >
                                <ArrowDown aria-hidden="true" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Elimina ${plan.name || `l’abbonamento ${index + 1}`}`}
                                onClick={() => remove(index)}
                            >
                                <Trash2 aria-hidden="true" />
                            </Button>
                        </div>
                    }
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <Label htmlFor={`plan-${index}-name`}>Nome</Label>
                            <Input
                                id={`plan-${index}-name`}
                                value={plan.name}
                                maxLength={100}
                                placeholder="Es. Open, Solo sala pesi, Studenti"
                                onChange={(event) =>
                                    change(index, { name: event.target.value })
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`plan-${index}-period`}>
                                Durata
                            </Label>
                            <Select
                                value={plan.period}
                                onValueChange={(period) =>
                                    change(index, {
                                        period: period as Period,
                                        entriesCount:
                                            period === 'entries'
                                                ? (plan.entriesCount ?? 10)
                                                : null,
                                    })
                                }
                            >
                                <SelectTrigger
                                    id={`plan-${index}-period`}
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((period) => (
                                        <SelectItem
                                            key={period.value}
                                            value={period.value}
                                        >
                                            {period.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3">
                            {plan.period === 'entries' && (
                                <div className="flex flex-1 flex-col gap-1.5">
                                    <Label htmlFor={`plan-${index}-entries`}>
                                        Ingressi
                                    </Label>
                                    <Input
                                        id={`plan-${index}-entries`}
                                        type="number"
                                        min={1}
                                        max={500}
                                        value={plan.entriesCount ?? ''}
                                        onChange={(event) =>
                                            change(index, {
                                                entriesCount:
                                                    Number(
                                                        event.target.value,
                                                    ) || null,
                                            })
                                        }
                                    />
                                </div>
                            )}
                            <div className="flex flex-1 flex-col gap-1.5">
                                <Label htmlFor={`plan-${index}-price`}>
                                    Prezzo (€)
                                </Label>
                                <Input
                                    id={`plan-${index}-price`}
                                    inputMode="decimal"
                                    value={prices[index] ?? ''}
                                    placeholder="45"
                                    onChange={(event) => {
                                        const text = event.target.value.replace(
                                            /[^\d,.]/g,
                                            '',
                                        );
                                        setPrices(
                                            prices.map((price, i) =>
                                                i === index ? text : price,
                                            ),
                                        );
                                        change(index, {
                                            priceCents: toCents(text),
                                        });
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <Label htmlFor={`plan-${index}-features`}>
                                Cosa include (una voce per riga, max{' '}
                                {maxFeatures})
                            </Label>
                            <Textarea
                                id={`plan-${index}-features`}
                                rows={4}
                                value={plan.features.join('\n')}
                                placeholder={
                                    'Sala pesi e cardio\nCorsi di gruppo\nScheda personalizzata'
                                }
                                onChange={(event) =>
                                    change(index, {
                                        features: event.target.value
                                            .split('\n')
                                            .slice(0, maxFeatures),
                                    })
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <Label htmlFor={`plan-${index}-note`}>
                                Note (facoltative)
                            </Label>
                            <Input
                                id={`plan-${index}-note`}
                                value={plan.note}
                                maxLength={200}
                                placeholder="Es. Quota d’iscrizione 30 € a parte"
                                onChange={(event) =>
                                    change(index, { note: event.target.value })
                                }
                            />
                        </div>
                        <label className="flex items-center gap-3 text-sm md:col-span-2">
                            <Switch
                                checked={plan.isActive}
                                onCheckedChange={(isActive) =>
                                    change(index, { isActive })
                                }
                            />
                            Visibile nel profilo
                        </label>
                    </div>
                </Panel>
            ))}

            <div className="sticky bottom-20 z-10 flex justify-end rounded-[20px] border bg-card/95 p-3 shadow-lg backdrop-blur-sm md:bottom-4">
                <Button
                    type="button"
                    onClick={save}
                    disabled={form.processing}
                    className="h-11 rounded-xl px-5 font-semibold"
                >
                    {form.processing && <Spinner />}
                    Salva abbonamenti
                </Button>
            </div>
        </>
    );
}

GymPlans.layout = { section: 'plans' };
