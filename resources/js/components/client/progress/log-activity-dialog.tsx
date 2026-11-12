import { useForm } from '@inertiajs/react';
import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import ClientProgressController from '@/actions/App/Http/Controllers/ClientProgressController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { addDays } from '@/lib/calendar';
import type { ActivityKindOption } from '@/types';

/** As in ClientProgressController. */
const NOTE_MAX = 280;

const efforts = [
    { value: '1', label: 'Leggero' },
    { value: '2', label: 'Giusto' },
    { value: '3', label: 'Intenso' },
];

const pill =
    'h-10 rounded-full border bg-card px-3.5 text-sm font-medium first:rounded-full last:rounded-full hover:bg-secondary data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:hover:bg-foreground/90';

type LogActivityDialogProps = {
    kinds: ActivityKindOption[];
    /** Rome day: the default, and the last one allowed. */
    today: string;
    /** How many days back a training can be added. */
    daysBack: number;
    trigger: ReactNode;
};

/**
 * "Segna un allenamento": what, when and, if the client wants, how long and
 * how hard. Ten seconds, no exercises or loads: only the habit counts.
 */
export default function LogActivityDialog({
    kinds,
    today,
    daysBack,
    trigger,
}: LogActivityDialogProps) {
    const [open, setOpen] = useState(false);
    const dateId = useId();
    const minutesId = useId();
    const noteId = useId();
    const kindLabelId = useId();
    const effortLabelId = useId();

    const form = useForm({
        done_on: today,
        kind: '',
        minutes: '',
        effort: '',
        note: '',
    });
    const { data, setData, errors, processing } = form;

    const changeOpen = (next: boolean) => {
        setOpen(next);

        if (next) {
            form.reset();
            form.clearErrors();
            setData('done_on', today);
        }
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((values) => ({
            ...values,
            minutes: values.minutes === '' ? null : Number(values.minutes),
            effort: values.effort === '' ? null : Number(values.effort),
            note: values.note.trim() === '' ? null : values.note.trim(),
        }));
        form.post(ClientProgressController.storeActivity.url(), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Segna un allenamento</DialogTitle>
                    <DialogDescription>
                        Le sedute, i corsi e gli eventi prenotati qui si contano
                        da soli: segna quello che fai per conto tuo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <span
                            id={kindLabelId}
                            className="text-sm font-semibold"
                        >
                            Cosa hai fatto
                        </span>
                        <ToggleGroup
                            type="single"
                            aria-labelledby={kindLabelId}
                            value={data.kind}
                            onValueChange={(value) => setData('kind', value)}
                            className="flex-wrap justify-start gap-2"
                        >
                            {kinds.map((kind) => (
                                <ToggleGroupItem
                                    key={kind.value}
                                    value={kind.value}
                                    className={pill}
                                >
                                    {kind.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                        <InputError message={errors.kind} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor={dateId} className="font-semibold">
                                Quando
                            </Label>
                            <Input
                                id={dateId}
                                type="date"
                                required
                                min={addDays(today, -daysBack)}
                                max={today}
                                value={data.done_on}
                                onChange={(event) =>
                                    setData('done_on', event.target.value)
                                }
                                aria-invalid={!!errors.done_on}
                                className="h-11"
                            />
                            <InputError message={errors.done_on} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label
                                htmlFor={minutesId}
                                className="font-semibold"
                            >
                                Minuti{' '}
                                <span className="font-normal text-muted-foreground">
                                    (facoltativo)
                                </span>
                            </Label>
                            <Input
                                id={minutesId}
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={600}
                                value={data.minutes}
                                onChange={(event) =>
                                    setData('minutes', event.target.value)
                                }
                                aria-invalid={!!errors.minutes}
                                className="h-11"
                            />
                            <InputError message={errors.minutes} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span
                            id={effortLabelId}
                            className="text-sm font-semibold"
                        >
                            Com'è stato{' '}
                            <span className="font-normal text-muted-foreground">
                                (facoltativo)
                            </span>
                        </span>
                        <ToggleGroup
                            type="single"
                            aria-labelledby={effortLabelId}
                            value={data.effort}
                            onValueChange={(value) => setData('effort', value)}
                            className="justify-start gap-2"
                        >
                            {efforts.map((effort) => (
                                <ToggleGroupItem
                                    key={effort.value}
                                    value={effort.value}
                                    className={pill}
                                >
                                    {effort.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor={noteId} className="font-semibold">
                            Nota{' '}
                            <span className="font-normal text-muted-foreground">
                                (facoltativa)
                            </span>
                        </Label>
                        <Textarea
                            id={noteId}
                            rows={2}
                            maxLength={NOTE_MAX}
                            value={data.note}
                            onChange={(event) =>
                                setData('note', event.target.value)
                            }
                            aria-invalid={!!errors.note}
                        />
                        <InputError message={errors.note} />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Annulla
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || data.kind === ''}
                        >
                            Salva
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
