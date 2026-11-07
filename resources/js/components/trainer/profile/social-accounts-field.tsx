import { router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import TrainerSocialController from '@/actions/App/Http/Controllers/TrainerSocialController';
import SocialIcon from '@/components/shared/social-icon';
import InstagramField from '@/components/trainer/profile/instagram-field';
import { Button } from '@/components/ui/button';
import { connectSocial } from '@/lib/social-connect';
import type { SocialProvider, TrainerSocialsProps } from '@/types';

type SocialAccountsFieldProps = {
    /** The Instagram typed by hand, for accounts that can't be linked. */
    instagram: string;
    onInstagramChange: (value: string) => void;
    /**
     * With the popup blocked, open the social in this page ("Modifica
     * profilo"). Not in "Diventa trainer": account and photo would be lost.
     */
    allowRedirect?: boolean;
};

/**
 * "Social · facoltativo" of "Diventa trainer" and "Modifica profilo":
 * "Collega" logs in on the social (OAuth, TrainerSocialController) and the
 * profile gets its icon. Reads `socials` from the props of the page.
 */
export default function SocialAccountsField({
    instagram,
    onInstagramChange,
    allowRedirect = false,
}: SocialAccountsFieldProps) {
    const socials = usePage<{ socials?: TrainerSocialsProps }>().props
        .socials ?? { providers: [], linked: [] };
    const id = useId();
    const [busy, setBusy] = useState<SocialProvider | null>(null);
    const [manual, setManual] = useState(instagram.trim() !== '');

    const linked = (provider: SocialProvider) =>
        socials.linked.find((link) => link.provider === provider);
    const instagramLinkable = socials.providers.some(
        (option) => option.provider === 'instagram',
    );

    // No social can be linked yet (no app credentials): Instagram by hand, as before.
    if (socials.providers.length === 0) {
        return (
            <InstagramField
                id={`${id}-instagram`}
                value={instagram}
                onChange={onInstagramChange}
            />
        );
    }

    const reload = () => router.reload({ only: ['socials'] });

    const connect = (provider: SocialProvider) => {
        const url = TrainerSocialController.connect.url(provider);

        const opened = connectSocial(url, (result) => {
            if (result.ok) {
                toast.success(result.message);

                if (result.provider === 'instagram') {
                    onInstagramChange('');
                    setManual(false);
                }
            } else {
                toast.error(result.message);
            }

            reload();
        });

        if (opened) {
            return;
        }

        if (allowRedirect) {
            window.location.href = url;

            return;
        }

        toast.error(
            'Il browser ha bloccato la finestra: consenti i popup per questo sito, oppure collega i social più tardi da “Modifica profilo”.',
        );
    };

    const disconnect = (provider: SocialProvider) =>
        router.delete(TrainerSocialController.disconnect.url(provider), {
            only: ['socials'],
            preserveScroll: true,
            preserveState: true,
            onStart: () => setBusy(provider),
            onFinish: () => setBusy(null),
        });

    return (
        <fieldset className="flex max-w-120 flex-col gap-2.5">
            <legend className="mb-1.5 text-sm font-semibold">
                Social{' '}
                <span className="font-normal text-muted-foreground">
                    · facoltativo
                </span>
            </legend>
            <p className="-mt-1 text-[13px] text-muted-foreground">
                Collega i tuoi profili: sul tuo profilo pubblico compaiono le
                icone che li aprono.
            </p>

            <ul className="flex flex-col gap-2">
                {socials.providers.map(({ provider, label }) => {
                    const account = linked(provider);

                    return (
                        <li
                            key={provider}
                            className="flex items-center gap-3 rounded-2xl border p-3"
                        >
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted [&>svg]:size-5">
                                <SocialIcon provider={provider} />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-[15px] font-semibold">
                                    {label}
                                </span>
                                <span className="truncate text-[13px] text-muted-foreground">
                                    {account ? (
                                        <span className="inline-flex items-center gap-1">
                                            <Check
                                                aria-hidden="true"
                                                className="size-3.5 text-emerald-600"
                                            />
                                            Collegato · @{account.handle}
                                        </span>
                                    ) : (
                                        'Non collegato'
                                    )}
                                </span>
                            </span>
                            {account ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={busy !== null}
                                    onClick={() => disconnect(provider)}
                                    aria-label={`Scollega ${label}`}
                                >
                                    Scollega
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={busy !== null}
                                    onClick={() => connect(provider)}
                                    aria-label={`Collega ${label}`}
                                >
                                    Collega
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ul>

            {!linked('instagram') &&
                (!instagramLinkable || manual ? (
                    <InstagramField
                        id={`${id}-instagram`}
                        value={instagram}
                        onChange={onInstagramChange}
                    />
                ) : (
                    <p className="text-[13px] text-muted-foreground">
                        Instagram si collega solo con un account professionale
                        (creator o business: lo attivi gratis in un minuto
                        dall’app, in Impostazioni → Tipo di account).{' '}
                        <button
                            type="button"
                            onClick={() => setManual(true)}
                            className="font-semibold text-foreground underline underline-offset-2"
                        >
                            Hai un account personale? Scrivi il nome utente
                        </button>
                    </p>
                ))}
        </fieldset>
    );
}
