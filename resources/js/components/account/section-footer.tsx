import { Button } from '@/components/ui/button';

type SectionFooterProps = {
    /** Something changed: the button turns black. */
    dirty: boolean;
    processing?: boolean;
    /** The form is not inside a <form> (e.g. saved with router): called on click. */
    onSave?: () => void;
};

/**
 * Bottom row of a section of "Impostazioni account": "Salva modifiche" on
 * the right, grey until something changes. Inside a <form> it submits it.
 */
export default function SectionFooter({
    dirty,
    processing = false,
    onSave,
}: SectionFooterProps) {
    return (
        <div className="flex justify-end border-t pt-4">
            <Button
                type={onSave ? 'button' : 'submit'}
                disabled={!dirty || processing}
                onClick={onSave}
                className="h-11 rounded-xl px-4.5 font-semibold"
            >
                Salva modifiche
            </Button>
        </div>
    );
}
