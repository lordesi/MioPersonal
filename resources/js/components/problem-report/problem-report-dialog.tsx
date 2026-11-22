import { Form } from '@inertiajs/react';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ProblemReportController from '@/actions/App/Http/Controllers/ProblemReportController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { problemContext } from '@/lib/problem-report';

/** The same as App\Models\ProblemReport::MESSAGE_MAX. */
const MESSAGE_MAX_LENGTH = 2000;

type ProblemReportDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

/**
 * "Segnala un problema": what happened and, if the person wants, a
 * screenshot. The page, the screen and the device are added by the site.
 */
export default function ProblemReportDialog({
    open,
    onOpenChange,
}: ProblemReportDialogProps) {
    // Read when it opens: the page the person was on.
    const [context, setContext] = useState(problemContext);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setContext(problemContext());
        }
    }, [open]);

    const clearFile = () => {
        if (fileInput.current) {
            fileInput.current.value = '';
        }

        setFileName(null);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                onOpenChange(next);

                if (!next) {
                    setFileName(null);
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Segnala un problema</DialogTitle>
                    <DialogDescription>
                        Raccontaci cosa non ha funzionato. Insieme al testo ci
                        arrivano la pagina in cui sei, il tipo di telefono o
                        computer e il browser.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...ProblemReportController.store.form()}
                    options={{ preserveScroll: true, preserveState: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="flex flex-col gap-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="page"
                                value={context.page}
                            />
                            <input
                                type="hidden"
                                name="viewport"
                                value={context.viewport}
                            />
                            <input
                                type="hidden"
                                name="installed"
                                value={context.installed ? '1' : '0'}
                            />

                            <label className="flex flex-col gap-1.5 text-sm font-semibold">
                                Cosa è successo?
                                <Textarea
                                    name="message"
                                    required
                                    maxLength={MESSAGE_MAX_LENGTH}
                                    rows={5}
                                    placeholder="Per esempio: ho premuto «Prenota» e non è successo niente."
                                    className="text-base font-normal md:text-sm"
                                />
                                {errors.message && (
                                    <span className="font-normal text-destructive">
                                        {errors.message}
                                    </span>
                                )}
                            </label>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-semibold">
                                    Screenshot (facoltativo)
                                </span>
                                <input
                                    ref={fileInput}
                                    id="problem-screenshot"
                                    type="file"
                                    name="screenshot"
                                    accept="image/jpeg,image/png"
                                    className="peer sr-only"
                                    onChange={(event) =>
                                        setFileName(
                                            event.target.files?.[0]?.name ??
                                                null,
                                        )
                                    }
                                />
                                {fileName ? (
                                    <div className="flex min-h-11 items-center gap-2 rounded-xl border px-3.5 text-sm">
                                        <ImagePlus
                                            aria-hidden="true"
                                            className="size-4 shrink-0"
                                        />
                                        <span className="min-w-0 flex-1 truncate">
                                            {fileName}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            aria-label="Togli lo screenshot"
                                            onClick={clearFile}
                                        >
                                            <X aria-hidden="true" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="problem-screenshot"
                                        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3.5 text-sm font-medium peer-focus-visible:ring-2 peer-focus-visible:ring-ring hover:bg-accent"
                                    >
                                        <ImagePlus
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Aggiungi uno screenshot
                                    </label>
                                )}
                                {errors.screenshot && (
                                    <span className="text-sm text-destructive">
                                        {errors.screenshot}
                                    </span>
                                )}
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Annulla
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    Invia
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
