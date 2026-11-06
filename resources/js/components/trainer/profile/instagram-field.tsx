import { Input } from '@/components/ui/input';

type InstagramFieldProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
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
}: InstagramFieldProps) {
    return (
        <div className="flex max-w-90 flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-semibold">
                Instagram{' '}
                <span className="font-normal text-muted-foreground">
                    · facoltativo
                </span>
            </label>
            <div className="relative">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] text-muted-foreground"
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
                    className="h-12 rounded-xl pl-8 text-[15px]"
                />
            </div>
            <p id={`${id}-hint`} className="text-[13px] text-muted-foreground">
                Sul tuo profilo compare l’icona che apre il tuo Instagram.
            </p>
        </div>
    );
}
