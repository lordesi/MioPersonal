import { router, useForm } from '@inertiajs/react';
import { useId } from 'react';
import type { FormEvent } from 'react';
import ClientProgressController from '@/actions/App/Http/Controllers/ClientProgressController';
import InputError from '@/components/input-error';
import Panel from '@/components/trainer/area/panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDayMonthShort } from '@/lib/format';
import type { WeightPoint } from '@/types';

type WeightPanelProps = {
    weights: WeightPoint[];
    /** Rome day: a new weight is today's. */
    today: string;
};

const kg = (value: number) =>
    `${value.toLocaleString('it-IT', { maximumFractionDigits: 1 })} kg`;

/**
 * "Peso": the last weight, the change since the first one shown and the
 * trend, plus the field for today's. Only with the consent to body data.
 */
export default function WeightPanel({ weights, today }: WeightPanelProps) {
    const inputId = useId();
    const form = useForm({ weight: '', measured_on: today });
    const last = weights.at(-1);
    const first = weights[0];
    const change = last && first && weights.length > 1 ? last.kg - first.kg : 0;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((values) => ({
            ...values,
            weight: values.weight.replace(',', '.'),
            measured_on: today,
        }));
        form.post(ClientProgressController.storeWeight.url(), {
            preserveScroll: true,
            onSuccess: () => form.reset('weight'),
        });
    };

    const remove = (point: WeightPoint) =>
        router.delete(ClientProgressController.destroyWeight.url(point.id), {
            preserveScroll: true,
        });

    return (
        <Panel title="Peso" className="gap-3">
            {last ? (
                <div className="flex items-end justify-between gap-3">
                    <div className="flex flex-col">
                        <span className="text-[26px] leading-8 font-bold tracking-[-0.03em] tabular-nums">
                            {kg(last.kg)}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {formatDayMonthShort(last.date)}
                            {weights.length > 1 &&
                                ` · ${change > 0 ? '+' : change < 0 ? '−' : ''}${kg(Math.abs(change))} dal ${formatDayMonthShort(first.date)}`}
                        </span>
                    </div>
                    {weights.length > 1 && <Sparkline weights={weights} />}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Segna il peso quando vuoi: vedi l'andamento nel tempo. Lo
                    vedi solo tu.
                </p>
            )}

            <form onSubmit={submit} className="flex flex-col gap-1.5">
                <label htmlFor={inputId} className="sr-only">
                    Peso di oggi in chili
                </label>
                <div className="flex gap-2">
                    <Input
                        id={inputId}
                        inputMode="decimal"
                        placeholder="Peso di oggi, es. 72,5"
                        value={form.data.weight}
                        onChange={(event) =>
                            form.setData('weight', event.target.value)
                        }
                        aria-invalid={!!form.errors.weight}
                        className="h-10"
                    />
                    <Button
                        type="submit"
                        variant="outline"
                        className="h-10"
                        disabled={form.processing || form.data.weight === ''}
                    >
                        Salva
                    </Button>
                </div>
                <InputError message={form.errors.weight} />
            </form>

            {last && (
                <button
                    type="button"
                    onClick={() => remove(last)}
                    className="self-start text-xs text-muted-foreground hover:underline"
                >
                    Elimina il peso del {formatDayMonthShort(last.date)}
                </button>
            )}
        </Panel>
    );
}

/** The trend, oldest on the left: one thin line, the last point marked. */
function Sparkline({ weights }: { weights: WeightPoint[] }) {
    const width = 120;
    const height = 40;
    const values = weights.map((point) => point.kg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((value, index) => ({
        x: 4 + (index / (values.length - 1)) * (width - 8),
        y: 4 + (1 - (value - min) / range) * (height - 8),
    }));
    const end = points[points.length - 1];

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-10 w-30 flex-none"
            role="img"
            aria-label={`Andamento del peso: da ${kg(values[0])} a ${kg(values[values.length - 1])}`}
        >
            <polyline
                points={points
                    .map((point) => `${point.x},${point.y}`)
                    .join(' ')}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="stroke-foreground/70"
            />
            <circle
                cx={end.x}
                cy={end.y}
                r={4}
                strokeWidth={2}
                className="fill-primary stroke-card"
            />
        </svg>
    );
}
