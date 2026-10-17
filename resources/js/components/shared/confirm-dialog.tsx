import type { ReactNode } from 'react';
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

type ConfirmDialogProps = {
    /** The button that opens the dialog; none when `open` is controlled. */
    trigger?: ReactNode;
    /** Controlled from outside, e.g. opened by the submit of a form. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    /** Red confirm button, for actions like "Rifiuta". */
    destructive?: boolean;
    onConfirm: () => void;
};

/**
 * Asks before a decision that can't be undone, e.g. "Conferma la
 * prenotazione" or "Non si è presentato".
 */
export default function ConfirmDialog({
    trigger,
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Torna indietro',
    destructive = false,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10"
                        >
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant={destructive ? 'destructive' : 'default'}
                            className="h-10 font-semibold"
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
