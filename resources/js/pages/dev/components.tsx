import { Head, Link } from '@inertiajs/react';
import { CircleAlert, Clock, SearchX } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import AppearanceToggleTab from '@/components/appearance-tabs';
import BookingStatusBadge from '@/components/booking/booking-status-badge';
import BookingSummary from '@/components/booking/booking-summary';
import BrandLogo from '@/components/layout/brand-logo';
import ClientHeader, {
    clientTabItems,
} from '@/components/layout/client-header';
import MinimalHeader from '@/components/layout/minimal-header';
import MobileTabBar from '@/components/layout/mobile-tab-bar';
import PublicFooter from '@/components/layout/public-footer';
import PublicHeader from '@/components/layout/public-header';
import TrainerHeader from '@/components/layout/trainer-header';
import { trainerNavItems } from '@/components/layout/trainer-nav';
import ChoiceChips from '@/components/shared/choice-chips';
import FavoriteButton from '@/components/shared/favorite-button';
import ProgressBar from '@/components/shared/progress-bar';
import SectionLabel from '@/components/shared/section-label';
import SegmentedControl from '@/components/shared/segmented-control';
import SwitchRow from '@/components/shared/switch-row';
import UserAvatar from '@/components/shared/user-avatar';
import EmptyState from '@/components/states/empty-state';
import OfflineBanner from '@/components/states/offline-banner';
import RatingSummary from '@/components/trainer/rating-summary';
import ReviewCard from '@/components/trainer/review-card';
import StarRating from '@/components/trainer/star-rating';
import TrainerCard from '@/components/trainer/trainer-card';
import TrainerCardSkeleton from '@/components/trainer/trainer-card-skeleton';
import TrainerMiniCard from '@/components/trainer/trainer-mini-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BookingStatus, TrainerSummary } from '@/types';

const trainers: TrainerSummary[] = [
    {
        name: 'Giulia Rossi',
        href: '#',
        zone: 'Città Studi',
        disciplines: ['Functional', 'Pilates'],
        rating: 4.9,
        reviewCount: 23,
        priceFromCents: 4500,
        nextSlotLabel: 'domani 18:00',
        online: 'also',
    },
    {
        name: 'Andrea Conti',
        href: '#',
        zone: 'Lambrate',
        disciplines: ['Calisthenics', 'Pesi'],
        rating: 4.8,
        reviewCount: 31,
        priceFromCents: 4000,
        nextSlotLabel: 'oggi 19:00',
        online: null,
    },
    {
        name: 'Elena Ricci',
        href: '#',
        zone: 'Monza',
        disciplines: ['Pilates', 'Yoga'],
        rating: null,
        reviewCount: 0,
        priceFromCents: 3550,
        nextSlotLabel: 'gio 8, 09:00',
        online: 'only',
    },
];

const statuses: BookingStatus[] = [
    'pending',
    'confirmed',
    'completed',
    'declined',
    'cancelled',
    'expired',
];

type Mode = 'in-person' | 'online' | 'both';
type Discipline = 'functional' | 'pilates' | 'yoga' | 'crossfit' | 'boxe';

function Showcase({
    title,
    screens,
    children,
    flush = false,
}: {
    title: string;
    /** Design screens where the component appears. */
    screens: string;
    children: ReactNode;
    /** No inner padding, for full-width headers and footers. */
    flush?: boolean;
}) {
    return (
        <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">
                    Nel design: {screens}
                </p>
            </div>
            <div
                className={cn(
                    'overflow-hidden rounded-xl border bg-background',
                    !flush && 'flex flex-col gap-6 p-4 md:p-6',
                )}
            >
                {children}
            </div>
        </section>
    );
}

export default function DevComponents() {
    const [favorites, setFavorites] = useState<string[]>(['Giulia Rossi']);
    const [mode, setMode] = useState<Mode | null>('in-person');
    const [segment, setSegment] = useState<'all' | 'in-person' | 'online'>(
        'all',
    );
    const [disciplines, setDisciplines] = useState<Discipline[]>([
        'functional',
        'pilates',
    ]);
    const [switches, setSwitches] = useState({
        reminder: true,
        offers: false,
        autoConfirm: false,
    });

    const favoriteProps = (name: string) => ({
        pressed: favorites.includes(name),
        onPressedChange: (pressed: boolean) =>
            setFavorites((current) =>
                pressed
                    ? [...current, name]
                    : current.filter((n) => n !== name),
            ),
    });

    return (
        <>
            <Head title="Componenti" />
            <div className="min-h-screen bg-secondary">
                <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 md:px-8">
                    <header className="flex flex-col gap-4">
                        <BrandLogo />
                        <h1 className="text-3xl font-bold tracking-tight">
                            Componenti condivisi
                        </h1>
                        <p className="text-muted-foreground">
                            Pagina visibile solo in locale. Confronta ogni
                            blocco con le schermate in docs/design, in tema
                            chiaro e scuro e restringendo la finestra.
                        </p>
                        <AppearanceToggleTab className="self-start" />
                        <nav
                            aria-label="Anteprime dei layout"
                            className="flex flex-wrap gap-2"
                        >
                            <Button asChild variant="outline">
                                <Link href="/dev/layouts/public">
                                    Layout pubblico
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/dev/layouts/trainer">
                                    Layout area trainer
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/dev/layouts/client">
                                    Layout area cliente
                                </Link>
                            </Button>
                        </nav>
                    </header>

                    <Showcase
                        title="Header pubblico"
                        screens="Home, Ricerca, Profilo"
                        flush
                    >
                        <PublicHeader section="search" />
                    </Showcase>

                    <Showcase
                        title="Header ridotto"
                        screens="Registrazione cliente, Registrazione trainer, Completa profilo, Conferma"
                        flush
                    >
                        <MinimalHeader>
                            Hai già un account?
                            <Link
                                href="#"
                                className="font-medium text-foreground underline"
                            >
                                Accedi
                            </Link>
                        </MinimalHeader>
                        <MinimalHeader badge="Per i trainer">
                            Hai già un account?
                            <Link
                                href="#"
                                className="font-medium text-foreground underline"
                            >
                                Accedi
                            </Link>
                        </MinimalHeader>
                        <MinimalHeader logoLinksHome={false}>
                            <Link
                                href="#"
                                className="font-medium text-foreground"
                            >
                                Salta per ora
                            </Link>
                        </MinimalHeader>
                        <MinimalHeader>
                            <UserAvatar
                                name="Luca Moretti"
                                label="Account di Luca Moretti"
                            />
                        </MinimalHeader>
                    </Showcase>

                    <Showcase
                        title="Header area trainer"
                        screens="Dashboard trainer (tutte le schede)"
                        flush
                    >
                        <TrainerHeader
                            userName="Giulia Rossi"
                            notificationCount={3}
                            publicProfileHref="#"
                        />
                    </Showcase>

                    <Showcase
                        title="Header area cliente"
                        screens="Le mie prenotazioni"
                        flush
                    >
                        <ClientHeader
                            userName="Luca Moretti"
                            section="bookings"
                        />
                    </Showcase>

                    <Showcase
                        title="Barre di schede in basso (mobile)"
                        screens="Dashboard trainer mobile, Le mie prenotazioni mobile"
                    >
                        <MobileTabBar
                            label="Area trainer"
                            items={trainerNavItems('today', 3)}
                            className="static max-w-sm rounded-lg border md:grid"
                        />
                        <MobileTabBar
                            label="Navigazione principale"
                            items={clientTabItems('bookings')}
                            className="static max-w-sm rounded-lg border md:grid"
                        />
                        <p className="text-sm text-muted-foreground">
                            Qui sono mostrate sempre; nei layout compaiono solo
                            sotto i 768 px.
                        </p>
                    </Showcase>

                    <Showcase
                        title="Footer pubblico — completo"
                        screens="Home, Ricerca"
                        flush
                    >
                        <PublicFooter />
                    </Showcase>

                    <Showcase
                        title="Footer pubblico — compatto"
                        screens="Profilo trainer"
                        flush
                    >
                        <PublicFooter variant="compact" />
                    </Showcase>

                    <Showcase
                        title="Card del trainer — verticale"
                        screens="Home (Trainer in evidenza)"
                    >
                        <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:gap-6">
                            {trainers.map((trainer) => (
                                <TrainerCard
                                    key={trainer.name}
                                    trainer={trainer}
                                    layout="vertical"
                                    className="w-68 shrink-0 md:w-80 lg:w-auto"
                                />
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Resta verticale anche su mobile, dove le card
                            scorrono in orizzontale.
                        </p>
                    </Showcase>

                    <Showcase
                        title="Card del trainer — risultati"
                        screens="Ricerca, Registrazione trainer passo 7"
                    >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
                            {trainers.map((trainer) => (
                                <TrainerCard
                                    key={trainer.name}
                                    trainer={trainer}
                                    favorite={favoriteProps(trainer.name)}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Sotto i 768 px diventa la riga compatta della
                            ricerca mobile.
                        </p>
                    </Showcase>

                    <Showcase title="Caricamento" screens="Stati di sistema">
                        <TrainerCardSkeleton />
                    </Showcase>

                    <Showcase
                        title="Riga trainer compatta"
                        screens="Profilo (Trainer simili), Le mie prenotazioni (Trainer preferiti)"
                    >
                        <div className="grid gap-3 md:grid-cols-3">
                            <TrainerMiniCard
                                name="Andrea Conti"
                                href="#"
                                subtitle="Lambrate · Calisthenics, Pesi"
                                detail="da 40 € · primo slot oggi 19:00"
                            />
                            <TrainerMiniCard
                                name="Elena Ricci"
                                href="#"
                                subtitle="Monza · Pilates, Yoga"
                                detail="da 40 € · primo slot domani 09:00"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                            <TrainerMiniCard
                                variant="pill"
                                name="Giulia Rossi"
                                href="#"
                                subtitle="Primo slot: mar 6, 18:00"
                            />
                            <TrainerMiniCard
                                variant="pill"
                                name="Chiara Galli"
                                href="#"
                                subtitle="Primo slot: gio 8, 09:00"
                            />
                        </div>
                    </Showcase>

                    <Showcase
                        title="Badge di stato prenotazione"
                        screens="Conferma, Le mie prenotazioni, Dashboard trainer"
                    >
                        <div className="flex flex-wrap gap-2">
                            {statuses.map((status) => (
                                <BookingStatusBadge
                                    key={status}
                                    status={status}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-primary p-5 text-primary-foreground">
                            <span className="text-sm">Su card scura:</span>
                            <BookingStatusBadge status="confirmed" onPrimary />
                        </div>
                    </Showcase>

                    <Showcase
                        title="Voto e stelle"
                        screens="Home, Ricerca, Profilo, Quiz risultati, Dashboard trainer"
                    >
                        <div className="flex flex-wrap items-center gap-6">
                            <RatingSummary rating={4.9} reviewCount={23} />
                            <RatingSummary
                                rating={4.9}
                                reviewCount={23}
                                format="long"
                            />
                            <RatingSummary rating={4.8} />
                            <StarRating value={5} />
                            <StarRating value={4} />
                        </div>
                    </Showcase>

                    <Showcase
                        title="Recensione"
                        screens="Profilo, Dashboard trainer (Recensioni)"
                    >
                        <ReviewCard
                            authorName="Marta Bianchi"
                            meta="Seduta singola · 2 giorni fa"
                            rating={5}
                            text="Puntuale e preparatissima. Ho una routine che riesco a seguire anche da sola."
                            reply={{
                                label: 'Risposta di Giulia:',
                                text: 'Grazie Marta, ci vediamo mercoledì!',
                            }}
                        />
                        <ReviewCard
                            authorName="Ilaria Conti"
                            meta="Seduta online · luglio 2026"
                            rating={4}
                            text="Le sedute online funzionano bene, servirebbe un po' più di materiale da seguire tra una seduta e l'altra."
                        >
                            <Button
                                type="button"
                                variant="outline"
                                className="self-start"
                            >
                                Rispondi
                            </Button>
                        </ReviewCard>
                    </Showcase>

                    <Showcase
                        title="Riepilogo prenotazione"
                        screens="Conferma, Registrazione cliente"
                    >
                        <BookingSummary
                            title="Riepilogo"
                            status="pending"
                            trainer={{
                                name: 'Giulia Rossi',
                                subtitle: 'Functional e Pilates · Città Studi',
                                href: '#',
                            }}
                            rows={[
                                {
                                    label: 'Servizio',
                                    value: 'Seduta singola · 1 ora',
                                },
                                {
                                    label: 'Quando',
                                    value: 'Gio 8 ottobre, 18:00–19:00',
                                },
                                {
                                    label: 'Dove',
                                    value: (
                                        <>
                                            Studio · Città Studi
                                            <br />
                                            <span className="font-normal text-muted-foreground">
                                                Indirizzo dopo la conferma
                                            </span>
                                        </>
                                    ),
                                },
                                {
                                    label: 'Prezzo indicativo',
                                    value: '45 €, da pagare a Giulia',
                                    emphasis: true,
                                },
                                {
                                    label: 'Cancellazione',
                                    value: 'Gratis fino a 24 ore prima',
                                },
                            ]}
                        >
                            <Button variant="outline" className="h-10">
                                Sposta
                            </Button>
                            <Button variant="ghost" className="h-10 underline">
                                Annulla la prenotazione
                            </Button>
                        </BookingSummary>
                    </Showcase>

                    <Showcase
                        title="Selettore a segmenti"
                        screens="Home, Ricerca, Profilo, Dashboard trainer (Settimana / Mese)"
                    >
                        <div className="flex max-w-sm flex-col gap-1.5">
                            <span
                                id="demo-segmented"
                                className="text-sm font-medium"
                            >
                                Modalità
                            </span>
                            <SegmentedControl
                                aria-labelledby="demo-segmented"
                                value={segment}
                                onChange={setSegment}
                                options={[
                                    { value: 'all', label: 'Tutte' },
                                    {
                                        value: 'in-person',
                                        label: 'In presenza',
                                    },
                                    { value: 'online', label: 'Online' },
                                ]}
                            />
                        </div>
                    </Showcase>

                    <Showcase
                        title="Chip selezionabili"
                        screens="Ricerca mobile, Completa profilo, Registrazione trainer, Dashboard trainer, Profilo"
                    >
                        <div className="flex flex-col gap-2">
                            <span
                                id="demo-mode"
                                className="text-sm font-semibold"
                            >
                                Modalità (una sola scelta)
                            </span>
                            <ChoiceChips
                                aria-labelledby="demo-mode"
                                value={mode}
                                onChange={setMode}
                                options={[
                                    {
                                        value: 'in-person',
                                        label: 'In presenza',
                                    },
                                    { value: 'online', label: 'Online' },
                                    { value: 'both', label: 'Entrambe' },
                                ]}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span
                                id="demo-disciplines"
                                className="text-sm font-semibold"
                            >
                                Discipline (anche più di una)
                            </span>
                            <ChoiceChips
                                multiple
                                aria-labelledby="demo-disciplines"
                                value={disciplines}
                                onChange={setDisciplines}
                                options={[
                                    {
                                        value: 'functional',
                                        label: 'Functional',
                                    },
                                    { value: 'pilates', label: 'Pilates' },
                                    { value: 'yoga', label: 'Yoga' },
                                    { value: 'crossfit', label: 'Crossfit' },
                                    { value: 'boxe', label: 'Boxe' },
                                ]}
                            />
                        </div>
                    </Showcase>

                    <Showcase
                        title="Righe con interruttore"
                        screens="Completa profilo, Dashboard trainer (Disponibilità e regole)"
                    >
                        <SwitchRow
                            label="Promemoria il giorno prima"
                            description="Email e notifica 24 ore prima della seduta."
                            checked={switches.reminder}
                            onCheckedChange={(checked) =>
                                setSwitches((s) => ({
                                    ...s,
                                    reminder: checked,
                                }))
                            }
                        />
                        <SwitchRow
                            label="Novità e offerte"
                            description="Al massimo una email al mese."
                            checked={switches.offers}
                            onCheckedChange={(checked) =>
                                setSwitches((s) => ({ ...s, offers: checked }))
                            }
                        />
                        <SwitchRow
                            label="Conferma automatica"
                            checked={switches.autoConfirm}
                            onCheckedChange={(checked) =>
                                setSwitches((s) => ({
                                    ...s,
                                    autoConfirm: checked,
                                }))
                            }
                        />
                    </Showcase>

                    <Showcase
                        title="Barre di avanzamento"
                        screens="Completa profilo, Le mie prenotazioni (pacchetti), Dashboard trainer (clienti)"
                    >
                        <div className="flex flex-col gap-2">
                            <span className="text-sm">
                                Profilo completo al 60%
                            </span>
                            <ProgressBar
                                value={60}
                                label="Completamento del profilo"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm tabular-nums">
                                4 usate · 6 rimaste
                            </span>
                            <ProgressBar
                                value={4}
                                max={10}
                                label="Sedute usate del pacchetto"
                            />
                        </div>
                    </Showcase>

                    <Showcase
                        title="Etichette di sezione, avatar, preferiti"
                        screens="Più schermate"
                    >
                        <div className="flex flex-col gap-1">
                            <SectionLabel as="p">Prossime</SectionLabel>
                            <SectionLabel as="p">
                                In attesa di conferma
                            </SectionLabel>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <UserAvatar name="Giulia Rossi" size="sm" />
                            <UserAvatar name="Giulia Rossi" size="md" />
                            <UserAvatar name="Giulia Rossi" size="lg" />
                            <UserAvatar
                                name="Giulia Rossi"
                                size="xl"
                                shape="rounded"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <FavoriteButton
                                trainerName="Giulia Rossi"
                                {...favoriteProps('Giulia Rossi')}
                            />
                            <FavoriteButton
                                variant="labeled"
                                trainerName="Giulia Rossi"
                                {...favoriteProps('Giulia Rossi')}
                            />
                        </div>
                    </Showcase>

                    <Showcase
                        title="Stati vuoti e di errore"
                        screens="Ricerca, Stati di sistema"
                    >
                        <EmptyState
                            bordered
                            icon={SearchX}
                            title="Nessun trainer con questi filtri"
                            description="Prova a togliere un filtro o a scegliere un'altra zona. Stiamo aggiungendo nuovi trainer ogni settimana."
                            action={
                                <Button variant="outline">
                                    Rimuovi filtri
                                </Button>
                            }
                        />
                        <EmptyState
                            icon={Clock}
                            title="Questo orario è appena stato prenotato"
                            description="Giulia ha ancora 3 slot liberi giovedì: 19:00, 20:00 e venerdì alle 07:00."
                            action={
                                <Button className="h-10">
                                    Scegli un altro orario
                                </Button>
                            }
                        />
                        <EmptyState
                            tone="error"
                            icon={CircleAlert}
                            title="Qualcosa non ha funzionato"
                            description="Non siamo riusciti a inviare la prenotazione. I tuoi dati sono salvi: riprova tra qualche secondo."
                            action={<Button className="h-10">Riprova</Button>}
                        />
                    </Showcase>

                    <Showcase
                        title="Senza connessione e conferme brevi"
                        screens="Stati di sistema"
                    >
                        <OfflineBanner />
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    toast('Prenotazione confermata', {
                                        action: {
                                            label: 'Annulla',
                                            onClick: () => undefined,
                                        },
                                    })
                                }
                            >
                                Mostra «Prenotazione confermata»
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => toast('Aggiunto ai preferiti')}
                            >
                                Mostra «Aggiunto ai preferiti»
                            </Button>
                        </div>
                    </Showcase>
                </div>
            </div>
        </>
    );
}
