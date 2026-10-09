import { Button } from '@/components/ui/button';

type SocialSignInProps = {
    /** "Continua con" on the login page, "Registrati con" on sign-up. */
    verb: string;
};

/**
 * Google and Apple buttons, followed by the "oppure con email e password" line.
 * TODO: wire them to Laravel Socialite (new composer package: ask first).
 */
export default function SocialSignIn({ verb }: SocialSignInProps) {
    return (
        <>
            <div className="flex flex-col gap-2">
                {['Google', 'Apple'].map((provider) => (
                    <Button
                        key={provider}
                        type="button"
                        variant="outline"
                        className="h-11"
                    >
                        {verb} {provider}
                    </Button>
                ))}
            </div>
            <TextDivider>oppure con email e password</TextDivider>
        </>
    );
}

/** Horizontal line with a short text in the middle. */
export function TextDivider({ children }: { children: string }) {
    return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            {children}
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
    );
}
