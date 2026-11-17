import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The password criteria, the same as Password::defaults() in
 * AppServiceProvider: if you change one, change the other.
 */
const requirements = [
    {
        label: 'Almeno 8 caratteri',
        short: '8+ caratteri',
        test: (value: string) => value.length >= 8,
    },
    {
        label: 'Una lettera maiuscola',
        short: 'Una maiuscola',
        test: (value: string) => /\p{Lu}/u.test(value),
    },
    {
        label: 'Una lettera minuscola',
        short: 'Una minuscola',
        test: (value: string) => /\p{Ll}/u.test(value),
    },
    {
        label: 'Un numero',
        short: 'Un numero',
        test: (value: string) => /\d/.test(value),
    },
];

/** For the browser check of the input (`pattern`): all the criteria at once. */
export const PASSWORD_PATTERN = '(?=.*\\p{Lu})(?=.*\\p{Ll})(?=.*\\d).{8,}';

export const PASSWORD_PATTERN_MESSAGE =
    'La password non rispetta tutti i criteri qui sotto.';

export function meetsPasswordRequirements(value: string): boolean {
    return requirements.every(({ test }) => test(value));
}

/** The criteria still missing, e.g. ["Una lettera maiuscola", "Un numero"]. */
export function missingPasswordRequirements(value: string): string[] {
    return requirements
        .filter(({ test }) => !test(value))
        .map(({ label }) => label);
}

/** How many criteria there are: one segment each in the strength bar. */
export const PASSWORD_REQUIREMENTS_COUNT = requirements.length;

/**
 * The list under the password field, as the `hint` of its FormField: each
 * criterion is ticked as you type.
 */
export default function PasswordRequirements({
    value,
    variant = 'list',
}: {
    value: string;
    /**
     * "dark": "Registra la palestra" — round chips on phones (turquoise when
     * met), a list with a dot per line on desktop.
     */
    variant?: 'list' | 'dark';
}) {
    if (variant === 'dark') {
        return (
            <ul className="flex flex-wrap gap-1.5 md:flex-col md:flex-nowrap md:gap-0">
                {requirements.map(({ label, short, test }) => {
                    const met = test(value);

                    return (
                        <li
                            key={label}
                            className={cn(
                                'flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] shadow-[inset_0_0_0_1px_var(--field)] md:h-auto md:min-h-10 md:gap-2.5 md:rounded-none md:border-b md:border-border md:px-0 md:text-[15px] md:shadow-none md:last:border-b-0',
                                met
                                    ? 'text-brand shadow-[inset_0_0_0_1px_var(--brand)]'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'hidden size-2 shrink-0 rounded-full border-[1.5px] md:block',
                                    met
                                        ? 'border-brand bg-brand'
                                        : 'border-field',
                                )}
                            />
                            {met && (
                                <Check
                                    aria-hidden="true"
                                    strokeWidth={3}
                                    className="size-3.5 md:hidden"
                                />
                            )}
                            <span className="md:hidden">{short}</span>
                            <span className="hidden md:inline">{label}</span>
                            <span className="sr-only">
                                {met ? ': fatto' : ': manca'}
                            </span>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <ul className="flex flex-col gap-1">
            {requirements.map(({ label, test }) => {
                const met = test(value);

                return (
                    <li
                        key={label}
                        className={cn(
                            'flex items-center gap-1.5',
                            met ? 'text-foreground' : 'text-muted-foreground',
                        )}
                    >
                        <Check
                            aria-hidden="true"
                            strokeWidth={met ? 3 : 2}
                            className={cn('size-3.5', !met && 'opacity-30')}
                        />
                        {label}
                        <span className="sr-only">
                            {met ? ': fatto' : ': manca'}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}
