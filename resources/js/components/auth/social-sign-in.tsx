import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { redirect as googleRedirect } from '@/routes/google';

type SocialSignInProps = {
    /** "Continua con" on the login page, "Registrati con" on sign-up. */
    verb: string;
    /** False until GOOGLE_CLIENT_ID is in the .env: then nothing is shown. */
    googleEnabled: boolean;
};

/**
 * The Google button, followed by the "oppure con email e password" line.
 * A plain <a>, not an Inertia Link: it leaves the site for Google.
 * TODO: "Continua con Apple" (needs the Apple Developer Program).
 */
export default function SocialSignIn({
    verb,
    googleEnabled,
}: SocialSignInProps) {
    if (!googleEnabled) {
        return null;
    }

    return (
        <>
            <Button asChild variant="outline" className="h-11">
                <a href={googleRedirect.url()}>{verb} Google</a>
            </Button>
            <TextDivider>oppure con email e password</TextDivider>
        </>
    );
}

/** Horizontal line with a short text in the middle. */
export function TextDivider({ children }: { children: ReactNode }) {
    return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            <span>{children}</span>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
    );
}
