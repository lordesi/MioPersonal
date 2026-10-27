import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The password criteria, the same as Password::defaults() in
 * AppServiceProvider: if you change one, change the other.
 */
const requirements = [
    { label: 'Almeno 8 caratteri', test: (value: string) => value.length >= 8 },
    {
        label: 'Una lettera maiuscola',
        test: (value: string) => /\p{Lu}/u.test(value),
    },
    {
        label: 'Una lettera minuscola',
        test: (value: string) => /\p{Ll}/u.test(value),
    },
    { label: 'Un numero', test: (value: string) => /\d/.test(value) },
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
export default function PasswordRequirements({ value }: { value: string }) {
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
