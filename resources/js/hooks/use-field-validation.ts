import { useEffect, useState } from 'react';
import type { FormControl } from '@/lib/validation-message';
import { validationMessage } from '@/lib/validation-message';

/** True while one submit is reporting its errors: only the first field gets the focus. */
let focusTaken = false;

/**
 * The real form field behind an id. A shadcn Checkbox is a <button>: inside a
 * form, Radix puts the native checkbox the browser checks right next to it.
 */
function findField(target: HTMLElement): FormControl | null {
    if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
    ) {
        return target;
    }

    return (
        target.parentElement?.querySelector<HTMLInputElement>(
            'input[type="checkbox"]',
        ) ?? null
    );
}

/**
 * Replaces the browser bubble ("Compila questo campo", "Please fill out this
 * field"…) of the field with the given id: returns an Italian message to show
 * under it, cleared as soon as the user changes the value.
 */
export function useFieldValidation(id: string): string | undefined {
    const [message, setMessage] = useState<string>();

    useEffect(() => {
        const target = document.getElementById(id);
        const field = target && findField(target);

        if (!target || !field) {
            return;
        }

        // aria-invalid also turns the border red (see components/ui/input.tsx);
        // React keeps its own value for server errors, restored afterwards.
        let marked = false;
        let previousInvalid: string | null = null;

        const onInvalid = (event: Event) => {
            // No browser bubble: we show our own message.
            event.preventDefault();
            setMessage(validationMessage(field));

            if (!marked) {
                marked = true;
                previousInvalid = target.getAttribute('aria-invalid');
                target.setAttribute('aria-invalid', 'true');
            }

            // Like the browser: the cursor goes to the first wrong field.
            if (!focusTaken) {
                focusTaken = true;
                target.focus();
                setTimeout(() => {
                    focusTaken = false;
                });
            }
        };

        const onChange = () => {
            if (!marked) {
                return;
            }

            marked = false;
            setMessage(undefined);

            if (previousInvalid === null) {
                target.removeAttribute('aria-invalid');
            } else {
                target.setAttribute('aria-invalid', previousInvalid);
            }
        };

        // A shadcn Checkbox changes with a click on the visible button.
        const changeEvent = target === field ? 'input' : 'click';

        field.addEventListener('invalid', onInvalid);
        target.addEventListener(changeEvent, onChange);

        return () => {
            field.removeEventListener('invalid', onInvalid);
            target.removeEventListener(changeEvent, onChange);
        };
    }, [id]);

    return message;
}
