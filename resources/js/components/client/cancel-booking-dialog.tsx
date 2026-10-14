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

type CancelBookingDialogProps = {
    trainerFirstName: string;
    /** The "Annulla" button that opens the dialog. */
    trigger: ReactNode;
    onConfirm: () => void;
};

/**
 * "Annulla" of a booking, confirmed or still waiting: it asks first, because it
 * can't be undone. Bookings can't be moved: for another time the client
 * cancels and books again.
 */
export default function CancelBookingDialog({
    trainerFirstName,
    trigger,
    onConfirm,
}: CancelBookingDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Annullare la prenotazione?</DialogTitle>
                    <DialogDescription>
                        La prenotazione con {trainerFirstName} viene annullata e
                        lo slot torna libero. Non si può ripristinare: per un
                        altro orario fai una nuova prenotazione.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10"
                        >
                            No, tienila
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="destructive"
                            className="h-10 font-semibold"
                            onClick={onConfirm}
                        >
                            Sì, annulla
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
