import { router } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { send } from '@/routes/verification';

type VerifyEmailNoticeProps = {
    email: string;
    trainerFirstName: string;
};

/** "Conferma la tua email", with a link to send the verification email again. */
export default function VerifyEmailNotice({
    email,
    trainerFirstName,
}: VerifyEmailNoticeProps) {
    const [sent, setSent] = useState(false);

    const resend = () =>
        router.post(
            send.url(),
            {},
            { preserveScroll: true, onSuccess: () => setSent(true) },
        );

    return (
        <div
            role="status"
            className="flex gap-3 rounded-[14px] border bg-card p-4 text-sm"
        >
            <Mail aria-hidden="true" className="mt-0.5 size-5 flex-none" />
            <div className="flex flex-col gap-1">
                <strong className="font-semibold">Conferma la tua email</strong>
                <span className="text-muted-foreground">
                    Abbiamo mandato un link a {email}: serve per ricevere la
                    conferma di {trainerFirstName}.
                </span>
                <button
                    type="button"
                    onClick={resend}
                    disabled={sent}
                    className="min-h-8 self-start font-medium underline disabled:no-underline"
                >
                    {sent
                        ? 'Email inviata di nuovo'
                        : 'Non è arrivata? Inviala di nuovo'}
                </button>
            </div>
        </div>
    );
}
