import { Input } from '@/components/ui/input';
import { pillFieldClassName } from '@/components/onboarding/dark-fields';
import { cn } from '@/lib/utils';

type InstagramFieldProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    /** The round field of the dark sign-up. */
    dark?: boolean;
};

/**
 * "Instagram" of the profile: the username only. "@giulia.fit" or the
 * link work too, the server keeps the name (TrainerProfileRequest).
 * Shown to everyone on the public profile.
 */
export default function InstagramField({
    id,
    value,
    onChange,
    dark = false,
}: InstagramFieldProps) {
    return (
        <div
            className={cn(
                'flex max-w-90 flex-col gap-1.5',
                dark && 'max-w-none gap-2',
            )}
        >
            <label
                htmlFor={id}
                className={cn(
                    'text-sm font-semibold',
                    dark && 'text-[15px] leading-5',
                )}
            >
                Instagram{' '}
                <span className="font-normal text-muted-foreground">
                    · facoltativo
                </span>
            </label>
            <div className="relative">
                <span
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] text-muted-foreground',
                        dark && 'left-5 text-[17px]',
                    )}
                >
                    @
                </span>
                <Input
                    id={id}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="nomeprofilo"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={80}
                    aria-describedby={`${id}-hint`}
                    className={cn(
                        'h-12 rounded-xl pl-8 text-[15px]',
                        dark && pillFieldClassName,
                        dark && 'pl-10',
                    )}
                />
            </div>
            <p id={`${id}-hint`} className="text-[13px] text-muted-foreground">
                Sul tuo profilo compare l’icona che apre il tuo Instagram.
            </p>
        </div>
    );
}
