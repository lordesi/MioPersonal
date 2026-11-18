import { Head, Link, router } from '@inertiajs/react';
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import ProfileList from '@/components/trainer/profile-hub/profile-list';
import { Initials } from '@/components/trainer/ui/bits';
import {
    brandButtonClassName,
    pageTitleClassName,
    panelClassName,
    softButtonClassName,
} from '@/components/trainer/ui/styles';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatUntilDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import { reviews, services, settings, share } from '@/routes/trainer';
import { gyms } from '@/routes/trainer';
import { update as updateVisibility } from '@/routes/trainer/visibility';

type Visibility = {
    visibleInSearch: boolean;
    acceptsNewClients: boolean;
    pausedUntil: string | null;
    paused: boolean;
};

type ProfileHubProps = {
    me: { name: string; avatar: string | null; publicUrl: string | null };
    /** Null until the registration is sent. */
    visibility: Visibility | null;
    counts: {
        services: number;
        gyms: number;
        reviews: number;
        rating: number | null;
    } | null;
};

/**
 * "Profilo": on phones the list of everything that is not the daily work
 * (iOS settings style); on desktop the list stays on the left (layout) and
 * here is the summary of the public profile.
 */
export default function ProfileHub({
    me,
    visibility,
    counts,
}: ProfileHubProps) {
    const isMobile = useIsMobile();
    const trailing = counts
        ? {
              services: String(counts.services),
              gyms: String(counts.gyms),
              reviews:
                  counts.rating === null
                      ? String(counts.reviews)
                      : `${counts.rating.toLocaleString('it-IT')} · ${counts.reviews}`,
          }
        : {};

    return (
        <>
            <Head title="Profilo" />
            {isMobile ? (
                <>
                    <h1 className="mx-1 mt-1 text-[34px] leading-10 font-bold tracking-[0.4px]">
                        Profilo
                    </h1>
                    <ProfileList size="lg" trailing={trailing}>
                        {visibility && (
                            <NewClientsSwitch
                                visibility={visibility}
                                size="lg"
                            />
                        )}
                    </ProfileList>
                </>
            ) : (
                <Overview me={me} visibility={visibility} counts={counts} />
            )}
        </>
    );
}

/** Desktop: the public profile at a glance, with its link and the switch. */
function Overview({ me, visibility, counts }: ProfileHubProps) {
    const shareLink = async () => {
        if (!me.publicUrl) {
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({ title: me.name, url: me.publicUrl });
            } catch {
                // Closed the share sheet: nothing to do.
            }

            return;
        }

        await copy();
    };
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        if (!me.publicUrl) {
            return;
        }

        try {
            await navigator.clipboard.writeText(me.publicUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Non siamo riusciti a copiare il link.');
        }
    };

    const tiles = counts
        ? [
              {
                  label: 'Servizi',
                  value: String(counts.services),
                  href: services.url(),
              },
              {
                  label: 'Palestre',
                  value: String(counts.gyms),
                  href: gyms.url(),
              },
              {
                  label: 'Recensioni',
                  value:
                      counts.rating === null
                          ? String(counts.reviews)
                          : `${counts.rating.toLocaleString('it-IT')} ★`,
                  href: reviews.url(),
              },
          ]
        : [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
                <h1 className={pageTitleClassName}>Il tuo profilo</h1>
                <p className="text-[15px] text-muted-foreground">
                    Quello che vedono i clienti quando ti cercano e ti
                    prenotano.
                </p>
            </div>

            <section className={cn(panelClassName, 'flex flex-col gap-5 p-6')}>
                <div className="flex flex-wrap items-center gap-5">
                    <Initials
                        name={me.name}
                        src={me.avatar}
                        size={96}
                        className="shadow-[0_0_0_3px_#0a0a0a,0_0_0_5px_#42d7d9]"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-[22px] leading-7 font-bold">
                            {me.name}
                        </span>
                        {me.publicUrl ? (
                            <span className="truncate font-mono text-[13px] text-muted-foreground">
                                {me.publicUrl.replace(/^https?:\/\//, '')}
                            </span>
                        ) : (
                            <span className="text-[13px] text-muted-foreground">
                                Il link arriva quando invii il profilo.
                            </span>
                        )}
                    </div>
                </div>
                {me.publicUrl && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={copy}
                            className={cn(
                                brandButtonClassName,
                                copied &&
                                    'text-[#30d158] shadow-[inset_0_0_0_1.5px_#30d158]',
                            )}
                        >
                            {copied ? (
                                <Check
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                            ) : (
                                <Copy aria-hidden="true" className="size-4.5" />
                            )}
                            <span aria-live="polite">
                                {copied ? 'Link copiato' : 'Copia link'}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={shareLink}
                            className={cn(softButtonClassName, 'h-11')}
                        >
                            <Share2 aria-hidden="true" className="size-4.5" />
                            Condividi con un’app
                        </button>
                        <a
                            href={me.publicUrl}
                            className={cn(softButtonClassName, 'h-11')}
                        >
                            <ExternalLink
                                aria-hidden="true"
                                className="size-4.5"
                            />
                            Vedi profilo pubblico
                        </a>
                        <Link
                            href={share()}
                            className={cn(softButtonClassName, 'h-11')}
                        >
                            QR code e storie
                        </Link>
                    </div>
                )}
            </section>

            {visibility && (
                <NewClientsSwitch visibility={visibility} size="sm" />
            )}

            {tiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5">
                    {tiles.map((tile) => (
                        <Link
                            key={tile.label}
                            href={tile.href}
                            className="flex flex-col gap-1.5 rounded-[22px] bg-card p-4.5 outline-none hover:bg-[#232323] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <span className="text-[13px] text-muted-foreground">
                                {tile.label}
                            </span>
                            <span className="text-[28px] leading-8 font-bold tabular-nums">
                                {tile.value}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * "Accetto nuovi clienti": the same switch of Impostazioni › Visibilità,
 * saved at once. The clients already followed can always book.
 */
function NewClientsSwitch({
    visibility,
    size,
}: {
    visibility: Visibility;
    size: 'lg' | 'sm';
}) {
    const labelId = useId();
    const noteId = useId();
    const [saving, setSaving] = useState(false);
    const on = visibility.acceptsNewClients;

    const toggle = () => {
        router.patch(
            updateVisibility.url(),
            {
                visible_in_search: visibility.visibleInSearch,
                accepts_new_clients: !on,
            },
            {
                preserveScroll: true,
                only: ['visibility'],
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onError: () =>
                    toast.error('Non siamo riusciti a salvare. Riprova.'),
            },
        );
    };

    const paused = visibility.paused || visibility.pausedUntil !== null;

    return (
        <div className="flex flex-col gap-2">
            <div
                className={cn(
                    'flex items-center gap-3.5 bg-card',
                    size === 'lg'
                        ? 'min-h-13 rounded-[26px] px-4'
                        : 'rounded-[22px] px-4 py-3',
                )}
            >
                <span
                    id={labelId}
                    className={cn(
                        'flex-1',
                        size === 'lg'
                            ? 'text-[17px] leading-5.5'
                            : 'text-[15px] font-semibold',
                    )}
                >
                    Accetto nuovi clienti
                </span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-labelledby={labelId}
                    aria-describedby={noteId}
                    disabled={saving}
                    onClick={toggle}
                    className={cn(
                        'relative h-7 w-16 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60',
                        on ? 'bg-brand' : 'bg-[rgba(120,120,128,0.36)]',
                    )}
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'absolute top-0.5 left-0.5 h-6 w-9.5 rounded-full bg-white shadow-[0_2px_6px_0_rgba(0,0,0,0.3)] transition-transform',
                            on ? 'translate-x-5.5' : 'translate-x-0',
                        )}
                    />
                </button>
            </div>
            <p
                id={noteId}
                aria-live="polite"
                className="px-4 text-[13px] leading-4.5 text-muted-foreground"
            >
                {on
                    ? 'I nuovi clienti possono prenotarti dalla tua vetrina.'
                    : 'Resti nella ricerca, ma solo chi ti conosce già può prenotare.'}
                {paused && (
                    <>
                        {' '}
                        <Link
                            href={`${settings.url()}#visibilita`}
                            className="text-brand"
                        >
                            {visibility.pausedUntil
                                ? `In pausa fino ${formatUntilDay(visibility.pausedUntil)}`
                                : 'Prenotazioni in pausa'}
                        </Link>
                    </>
                )}
            </p>
        </div>
    );
}

ProfileHub.layout = { section: 'profile-hub' };
