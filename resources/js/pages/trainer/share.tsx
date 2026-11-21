import { Head, Link } from '@inertiajs/react';
import { Check, Copy, Download, Share } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ProfilePage from '@/components/trainer/profile-pages/profile-page';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useClipboard } from '@/hooks/use-clipboard';
import { canvasFile, download, drawStory, qrDataUrl } from '@/lib/story-image';
import { settings } from '@/routes/trainer';
import { edit as editProfile } from '@/routes/trainer/profile';

type ShareCard = {
    name: string;
    firstName: string;
    headline: string;
    city: string;
    disciplines: string[];
    rating: number | null;
    reviewCount: number;
    photoUrl: string | null;
    /** The public profile with the utm_* of each place. */
    links: { bio: string; qr: string; story: string };
};

type ShareProps = {
    /** null when the profile is not in the search yet. */
    card: ShareCard | null;
    reason: 'missing' | 'review' | 'hidden' | null;
};

const section =
    'flex flex-col gap-4 rounded-[26px] bg-card p-4 md:rounded-[20px] md:bg-transparent md:p-6 md:shadow-[inset_0_0_0_1px_var(--border)]';

/**
 * "Condividi profilo": the link for the Instagram bio, the QR code and the
 * image for the stories (TrainerShareController). Everything is drawn here,
 * in the browser.
 */
export default function SharePage({ card, reason }: ShareProps) {
    return (
        <>
            <Head title="Condividi profilo" />

            <ProfilePage
                title={
                    <>
                        Condividi il tuo <strong>profilo</strong>
                    </>
                }
                intro="Il link per la bio di Instagram, il codice QR e l'immagine per le storie."
            >
                {card === null ? (
                    <NotYet reason={reason} />
                ) : (
                    <div className="flex flex-col gap-5">
                        <BioLink card={card} />
                        <QrCode card={card} />
                        <StoryImage card={card} />
                    </div>
                )}
            </ProfilePage>
        </>
    );
}

function NotYet({ reason }: { reason: ShareProps['reason'] }) {
    return (
        <section className={section}>
            <h2 className="text-xl leading-6.25 font-semibold tracking-[-0.45px]">
                Non ancora
            </h2>
            <p className="text-sm text-muted-foreground">
                {reason === 'hidden' ? (
                    <>
                        Il tuo profilo non è visibile nella ricerca, quindi il
                        link non porterebbe a prenotare. Riattivalo dalle{' '}
                        <Link
                            href={settings()}
                            className="font-semibold text-brand underline-offset-4 hover:underline"
                        >
                            impostazioni
                        </Link>
                        .
                    </>
                ) : (
                    <>
                        Potrai condividere il profilo appena il team lo approva.
                        Intanto puoi completarlo da{' '}
                        <Link
                            href={editProfile()}
                            className="font-semibold text-brand underline-offset-4 hover:underline"
                        >
                            Modifica profilo
                        </Link>
                        .
                    </>
                )}
            </p>
        </section>
    );
}

/** "Link per la bio": copy it, or share it with the apps of the phone. */
function BioLink({ card }: { card: ShareCard }) {
    const [copied, copy] = useClipboard();
    const link = card.links.bio;

    const share = async () => {
        try {
            await navigator.share({
                title: `${card.name} su MioPersonal`,
                url: link,
            });
        } catch {
            // Closed by the user: nothing to do.
        }
    };

    return (
        <section className={section} aria-labelledby="share-link-title">
            <div className="flex flex-col gap-1">
                <h2
                    id="share-link-title"
                    className="text-xl leading-6.25 font-semibold tracking-[-0.45px]"
                >
                    Link per la bio di Instagram
                </h2>
                <p className="text-sm text-muted-foreground">
                    Mettilo nella bio o nei messaggi: chi lo apre vede il tuo
                    profilo e prenota. In Statistiche contiamo le visite che
                    arrivano da qui.
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                <input
                    readOnly
                    value={link}
                    aria-label="Link al tuo profilo"
                    onFocus={(event) => event.currentTarget.select()}
                    className="h-12.5 min-w-0 flex-[1_1_260px] rounded-full border-0 bg-transparent px-5 text-[17px] shadow-[inset_0_0_0_1px_var(--field)] md:text-[15px]"
                />
                <Button
                    type="button"
                    className="h-11 px-4 font-semibold"
                    onClick={async () => {
                        if (await copy(link)) {
                            toast.success('Link copiato');
                        }
                    }}
                >
                    {copied === link ? <Check /> : <Copy />}
                    {copied === link ? 'Copiato' : 'Copia'}
                </Button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-4"
                        onClick={share}
                    >
                        <Share />
                        Condividi
                    </Button>
                )}
            </div>
        </section>
    );
}

/** The QR code, for the studio, a flyer or a business card. */
function QrCode({ card }: { card: ShareCard }) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        qrDataUrl(card.links.qr)
            .then(setSrc)
            .catch(() =>
                toast.error('Non siamo riusciti a creare il QR code.'),
            );
    }, [card.links.qr]);

    const save = async () => {
        if (src) {
            download(await (await fetch(src)).blob(), 'miopersonal-qr.png');
        }
    };

    return (
        <section className={section} aria-labelledby="share-qr-title">
            <div className="flex flex-col gap-1">
                <h2
                    id="share-qr-title"
                    className="text-xl leading-6.25 font-semibold tracking-[-0.45px]"
                >
                    QR code
                </h2>
                <p className="text-sm text-muted-foreground">
                    Da stampare in studio, su un volantino o un biglietto da
                    visita: si inquadra con la fotocamera e apre il tuo profilo.
                </p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
                {src ? (
                    <img
                        src={src}
                        alt="QR code del tuo profilo"
                        className="size-40 rounded-[18px] bg-white p-2"
                    />
                ) : (
                    <span className="flex size-40 items-center justify-center rounded-[18px] shadow-[inset_0_0_0_1px_var(--field)]">
                        <Spinner />
                    </span>
                )}
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-4"
                    disabled={!src}
                    onClick={save}
                >
                    <Download />
                    Scarica PNG
                </Button>
            </div>
        </section>
    );
}

/** The image for the stories, 1080 × 1920, drawn on a canvas. */
function StoryImage({ card }: { card: ShareCard }) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!canvas.current) {
            return;
        }

        drawStory(canvas.current, {
            name: card.name,
            headline: card.headline,
            city: card.city,
            disciplines: card.disciplines,
            rating: card.rating,
            reviewCount: card.reviewCount,
            photoUrl: card.photoUrl,
            link: card.links.story,
        })
            .then(() => setReady(true))
            .catch(() =>
                toast.error('Non siamo riusciti a creare l’immagine.'),
            );
    }, [card]);

    const file = () =>
        canvas.current
            ? canvasFile(canvas.current, 'miopersonal-storia.png')
            : Promise.resolve(null);

    const save = async () => {
        const image = await file();

        if (image) {
            download(image, image.name);
        }
    };

    const share = async () => {
        const image = await file();

        if (!image) {
            return;
        }

        if (navigator.canShare?.({ files: [image] })) {
            try {
                await navigator.share({ files: [image] });
            } catch {
                // Closed by the user.
            }
        } else {
            download(image, image.name);
        }
    };

    return (
        <section
            className={`${section} items-center`}
            aria-labelledby="share-story-title"
        >
            <div className="flex flex-col gap-1 self-stretch">
                <h2
                    id="share-story-title"
                    className="text-xl leading-6.25 font-semibold tracking-[-0.45px]"
                >
                    Immagine per le storie
                </h2>
                <p className="text-sm text-muted-foreground">
                    Pubblicala nelle storie di Instagram e aggiungi lo sticker
                    «Link» con il link qui accanto.
                </p>
            </div>
            <canvas
                ref={canvas}
                role="img"
                aria-label={`Anteprima: ${card.name}, ${card.city}, con il QR code per prenotare`}
                className="aspect-[9/16] w-full max-w-67.5 rounded-[20px] bg-[#262626]"
            />
            <div className="flex flex-wrap justify-center gap-2">
                <Button
                    type="button"
                    className="h-11 px-4 font-semibold"
                    disabled={!ready}
                    onClick={save}
                >
                    <Download />
                    Scarica immagine
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-4 md:hidden"
                    disabled={!ready}
                    onClick={share}
                >
                    <Share />
                    Condividi
                </Button>
            </div>
        </section>
    );
}

SharePage.layout = { section: 'share' };
