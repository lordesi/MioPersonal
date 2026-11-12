import { Share } from 'lucide-react';

/**
 * How to add the app by hand, where the browser has no install dialog:
 * Safari on the iPhone (the only place where iOS delivers the push
 * notifications) and Safari on the Mac.
 */
export default function InstallSteps({
    method,
    withNotifications = false,
}: {
    method: 'ios' | 'mac-safari';
    /** Third step "…e premi Attiva le notifiche" (logged-in users). */
    withNotifications?: boolean;
}) {
    if (method === 'mac-safari') {
        return (
            <ol className="flex list-decimal flex-col gap-1 pl-4.5">
                <li>
                    Nella barra dei menu di Safari apri{' '}
                    <strong className="font-semibold">File</strong>
                </li>
                <li>
                    Scegli{' '}
                    <strong className="font-semibold">Aggiungi al Dock</strong>
                </li>
                <li>Apri MioPersonal dal Dock, come le altre app</li>
            </ol>
        );
    }

    return (
        <ol className="flex list-decimal flex-col gap-1 pl-4.5">
            <li>
                In Safari tocca{' '}
                <Share
                    aria-label="Condividi"
                    className="inline size-4 align-text-bottom"
                />{' '}
                <strong className="font-semibold">Condividi</strong>
            </li>
            <li>
                Scegli{' '}
                <strong className="font-semibold">
                    Aggiungi alla schermata Home
                </strong>
            </li>
            <li>
                {withNotifications ? (
                    <>
                        Apri MioPersonal dalla Home e premi{' '}
                        <strong className="font-semibold">
                            Attiva le notifiche
                        </strong>
                    </>
                ) : (
                    'Apri MioPersonal dalla Home, come le altre app'
                )}
            </li>
        </ol>
    );
}
