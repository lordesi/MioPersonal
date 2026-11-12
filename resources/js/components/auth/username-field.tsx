import { useHttp } from '@inertiajs/react';
import { Check, Lock } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import FormField from '@/components/auth/form-field';
import { Input } from '@/components/ui/input';
import { check } from '@/routes/username';

type CheckResponse = { username: string; error: string | null };

/** How long to wait after the last key before asking the server. */
const TYPING_PAUSE_MS = 500;

/** As App\Rules\Username: 3–30 lowercase letters, numbers, "-" and "_". */
const PATTERN = '[a-z0-9](?:[a-z0-9_\\-]*[a-z0-9])?';
const MIN = 3;
const MAX = 30;

/** While typing: lowercase, no "@", spaces become "-", other symbols go away. */
export function cleanUsername(value: string): string {
    return value
        .toLowerCase()
        .replace(/^@+/, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, MAX);
}

/** "Giulia", "Rossi" → "giulia-rossi": the example in the empty field. */
export function usernameFromName(...parts: string[]): string {
    return cleanUsername(
        parts
            .join(' ')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .trim(),
    ).replace(/-{2,}/g, '-');
}

type UsernameFieldProps = {
    error?: string;
    /** "miopersonal.it/trainer/": the public link is shown under the field. */
    linkPrefix?: string | null;
    /** Shown as the example while the field is empty, e.g. from the name. */
    suggestion?: string;
    /** Starting value inside a <Form> (uncontrolled). */
    defaultValue?: string;
    /** Controlled by the page (trainer and gym wizards). */
    bind?: {
        value: string;
        onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    };
};

/**
 * "Username": chosen once, it can never be changed, and the field says so.
 * Checked while typing (free, valid, not reserved) with the same rule as the
 * server (UsernameController::check).
 */
export default function UsernameField({
    error: serverError,
    linkPrefix,
    suggestion,
    defaultValue = '',
    bind,
}: UsernameFieldProps) {
    const [typed, setTyped] = useState(defaultValue);
    const value = bind?.value ?? typed;
    const http = useHttp<{ value: string }, CheckResponse>({ value: '' });
    const [answer, setAnswer] = useState<CheckResponse>();
    const current = useRef(value);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const ask = (username: string) => {
        clearTimeout(timer.current);

        if (username.length < MIN) {
            return;
        }

        http.transform(() => ({ value: username }));
        http.submit(check())
            .then((response) => {
                // Answers about an older value are not shown.
                if (current.current === username) {
                    setAnswer(response);
                }
            })
            // Too many checks or no connection: the form checks it anyway.
            .catch(() => {});
    };

    // The answer of the check is newer than the error of the last submit.
    const shown = answer?.username === value ? answer : undefined;
    const error = shown ? (shown.error ?? undefined) : serverError;
    const available = shown !== undefined && shown.error === null;

    return (
        <FormField
            label="Username"
            error={error}
            hint={
                <span className="flex flex-col gap-1">
                    {available && (
                        <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                            <Check className="size-3.5" aria-hidden />
                            Disponibile
                        </span>
                    )}
                    {linkPrefix && (
                        <span className="break-all">
                            Il tuo link: {linkPrefix}
                            <strong className="text-foreground">
                                {value || suggestion || 'username'}
                            </strong>
                        </span>
                    )}
                    <span className="flex items-center gap-1 font-medium text-foreground">
                        <Lock className="size-3.5 shrink-0" aria-hidden />
                        Scegli bene: l’username non si può cambiare.
                    </span>
                </span>
            }
        >
            {({ id, describedBy }) => (
                <div className="relative">
                    <span
                        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-muted-foreground"
                        aria-hidden
                    >
                        @
                    </span>
                    <Input
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={!!error}
                        name="username"
                        required
                        minLength={MIN}
                        maxLength={MAX}
                        pattern={PATTERN}
                        data-pattern-message="Usa solo lettere minuscole, numeri, trattino o underscore (non all’inizio o alla fine)."
                        autoComplete="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder={suggestion || 'es. giulia-rossi'}
                        className="h-11 pl-7 text-base md:text-base"
                        value={value}
                        onChange={(event) => {
                            event.target.value = cleanUsername(
                                event.target.value,
                            );
                            const username = event.target.value;
                            current.current = username;
                            setTyped(username);
                            bind?.onChange(event);
                            clearTimeout(timer.current);
                            timer.current = setTimeout(
                                () => ask(username),
                                TYPING_PAUSE_MS,
                            );
                        }}
                        onBlur={(event) => ask(event.target.value)}
                    />
                </div>
            )}
        </FormField>
    );
}
