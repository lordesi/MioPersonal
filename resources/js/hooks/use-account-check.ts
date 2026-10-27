import { useHttp } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { check } from '@/routes/register';

export type CheckedField = 'email' | 'phone';

type CheckResponse = { error: string | null; taken: boolean };

/** How long to wait after the last key before asking the server. */
const TYPING_PAUSE_MS = 600;

/** A whole Italian mobile, without +39 (see PhoneFields). */
const PHONE_DIGITS = 10;

/**
 * Checks the email or the phone of a sign-up while it is typed, with the same
 * rules as "Crea account" (see RegistrationCheckController): after a short
 * pause in typing or when the user leaves the field. Without `onTaken`
 * nothing is checked. It runs once per value: closing the
 * pop-up doesn't reopen it.
 */
export function useAccountCheck(
    field: CheckedField,
    onTaken?: (value: string) => void,
) {
    const http = useHttp<{ field: CheckedField; value: string }, CheckResponse>(
        { field, value: '' },
    );
    const [error, setError] = useState<string>();
    // The value on screen: answers about older values are not shown.
    const current = useRef('');
    // Each value is asked once: going back to it shows the same answer.
    const answers = useRef(new Map<string, CheckResponse>());
    const pending = useRef('');
    const announced = useRef('');
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const show = (value: string, response: CheckResponse) => {
        if (current.current !== value) {
            return;
        }

        setError(response.error ?? undefined);

        if (response.taken && announced.current !== value) {
            announced.current = value;
            onTaken?.(value);
        }
    };

    const ask = (value: string) => {
        clearTimeout(timer.current);
        const known = answers.current.get(value);

        if (known) {
            show(value, known);

            return;
        }

        if (pending.current === value) {
            return;
        }

        pending.current = value;
        http.transform(() => ({ field, value }));
        http.submit(check())
            .then((response) => {
                answers.current.set(value, response);
                show(value, response);
            })
            // Too many checks or no connection: "Crea account" checks it anyway.
            .catch(() => {})
            .finally(() => {
                if (pending.current === value) {
                    pending.current = '';
                }
            });
    };

    /**
     * Leaving the field: always (the server says what is wrong). While typing:
     * once the value looks complete, so half an email isn't an error yet.
     * validity, not checkValidity(): that one would show the browser error.
     */
    const shouldAsk = (input: HTMLInputElement, typing: boolean) => {
        if (onTaken === undefined || input.value === '') {
            return false;
        }

        return (
            !typing ||
            input.validity.valid ||
            (field === 'phone' && input.value.length === PHONE_DIGITS)
        );
    };

    return {
        error,
        onChange: (input: HTMLInputElement) => {
            current.current = input.value;
            clearTimeout(timer.current);
            // The old answer was about another value.
            setError(undefined);

            if (shouldAsk(input, true)) {
                const value = input.value;
                timer.current = setTimeout(() => ask(value), TYPING_PAUSE_MS);
            }
        },
        onBlur: (input: HTMLInputElement) => {
            current.current = input.value;

            if (shouldAsk(input, false)) {
                ask(input.value);
            }
        },
    };
}
