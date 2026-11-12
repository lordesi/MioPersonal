import { Form, Link, usePage } from '@inertiajs/react';
import { Flag } from 'lucide-react';
import { useState } from 'react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { login } from '@/routes';

/** The same values and labels as App\Enums\ReportReason. */
const reasons = [
    { value: 'fake', label: 'Informazioni false o ingannevoli' },
    { value: 'offensive', label: 'Contenuti offensivi o inappropriati' },
    { value: 'spam', label: 'Spam o pubblicità' },
    { value: 'behavior', label: 'Comportamento scorretto' },
    { value: 'other', label: 'Altro' },
] as const;

const DETAILS_MAX_LENGTH = 500;

type ReportDialogProps = {
    type: 'trainer' | 'gym' | 'review';
    /** The slug of a profile, the id of a review. */
    target: string | number;
    /** e.g. "Segnala il profilo". */
    label: string;
    className?: string;
};

const titles: Record<ReportDialogProps['type'], string> = {
    trainer: 'Segnala il profilo',
    gym: 'Segnala la palestra',
    review: 'Segnala la recensione',
};

/**
 * "Segnala": a small link that opens the form. The team checks the report
 * in "Admin · Segnalazioni"; guests are asked to log in first.
 */
export default function ReportDialog({
    type,
    target,
    label,
    className,
}: ReportDialogProps) {
    const user = usePage().props.auth?.user;
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<string>('');

    const trigger = (
        <Button
            type="button"
            variant="link"
            size="sm"
            className={cn(
                'h-auto gap-1.5 px-0 text-xs font-normal text-muted-foreground',
                className,
            )}
        >
            <Flag aria-hidden="true" className="size-3.5" />
            {label}
        </Button>
    );

    if (!user) {
        return (
            <Button
                asChild
                variant="link"
                size="sm"
                className={cn(
                    'h-auto gap-1.5 px-0 text-xs font-normal text-muted-foreground',
                    className,
                )}
            >
                <Link href={login()}>
                    <Flag aria-hidden="true" className="size-3.5" />
                    {label}
                </Link>
            </Button>
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                setReason('');
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{titles[type]}</DialogTitle>
                    <DialogDescription>
                        Il nostro team la controlla: chi hai segnalato non saprà
                        che sei stato tu.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...ReportController.store.form()}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="flex flex-col gap-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <input type="hidden" name="type" value={type} />
                            <input
                                type="hidden"
                                name="target"
                                value={String(target)}
                            />
                            <fieldset className="flex flex-col gap-2">
                                <legend className="mb-2 text-sm font-semibold">
                                    Perché la segnali?
                                </legend>
                                {reasons.map((option) => (
                                    <label
                                        key={option.value}
                                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-sm has-checked:border-foreground has-checked:font-semibold"
                                    >
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={option.value}
                                            checked={reason === option.value}
                                            onChange={() =>
                                                setReason(option.value)
                                            }
                                            className="size-4 accent-foreground"
                                        />
                                        {option.label}
                                    </label>
                                ))}
                                {errors.reason && (
                                    <p className="text-sm text-destructive">
                                        {errors.reason}
                                    </p>
                                )}
                            </fieldset>
                            <label className="flex flex-col gap-1.5 text-sm font-semibold">
                                Vuoi aggiungere qualcosa? (facoltativo)
                                <Textarea
                                    name="details"
                                    maxLength={DETAILS_MAX_LENGTH}
                                    rows={3}
                                    className="text-base font-normal md:text-sm"
                                />
                                {errors.details && (
                                    <span className="font-normal text-destructive">
                                        {errors.details}
                                    </span>
                                )}
                            </label>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Annulla
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={reason === '' || processing}
                                >
                                    Invia segnalazione
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
