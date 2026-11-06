import { Head, Link } from '@inertiajs/react';
import { Check, Copy, Download, Share } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import PageHeading from '@/components/trainer/area/page-heading';
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

const section = 'flex flex-col gap-4 rounded-2xl border bg-card p-5 md:p-6';

/**
 * "Condividi profilo": the link for the Instagram bio, the QR code and the
 * image for the stories (TrainerShareController). Everything is drawn here,
 * in the browser.
 */
export default function SharePage({ card, reason }: ShareProps) {
    return (
        <>
            <Head title="Condividi profilo" />

            <PageHeading title="Condividi il tuo profilo" />

            {card === null ? (
                <NotYet reason={reason} />
            ) : (
                <div className="flex flex-wrap items-start gap-5">
                    <div className="flex min-w-0 flex-[3_1_480px] flex-col gap-5">
                        <BioLink card={card} />
                        <QrCode card={card} />
                    </div>
                    <StoryImage card={card} />
                </div>
            )}
        </>
    );
}

function NotYet({ reason }: { reason: ShareProps['reason'] }) {
    return (
        <section className={section}>
            <h2 className="text-lg font-semibold">Non ancora</h2>
            <p className="text-sm text-muted-foreground">
                {reason === 'hidden' ? (
                    <>
                        Il tuo profilo non è visibile nella ricerca, quindi il
                        link non porterebbe a prenotare. Riattivalo dalle{' '}
                        <Link
                            href={settings()}
                            className="font-medium text-foreground underline underline-offset-4"
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
                            className="font-medium text-foreground underline underline-offset-4"
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
                <h2 id="share-link-title" className="text-lg font-semibold">
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
                    className="h-11 min-w-0 flex-[1_1_260px] rounded-[10px] border bg-muted px-3 text-sm"
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
                <h2 id="share-qr-title" className="text-lg font-semibold">
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
                        className="size-40 rounded-xl border"
                    />
                ) : (
                    <span className="flex size-40 items-center justify-center rounded-xl border">
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
            className={`${section} flex-[2_1_300px] items-center`}
            aria-labelledby="share-story-title"
        >
            <div className="flex flex-col gap-1 self-stretch">
                <h2 id="share-story-title" className="text-lg font-semibold">
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
                className="aspect-[9/16] w-full max-w-67.5 rounded-2xl border bg-sidebar"
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
