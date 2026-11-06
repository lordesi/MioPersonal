import { Head, router } from '@inertiajs/react';
import { Search, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import LinkRow from '@/components/gym/link-row';
import InputError from '@/components/input-error';
import Panel from '@/components/trainer/area/panel';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trainers as trainersPage } from '@/routes/gym';
import { accept, decline, destroy, invite } from '@/routes/gym/trainers';
import type { GymTrainerLinkRow, TrainerSummary } from '@/types';

type GymTrainersProps = {
    approved: boolean;
    trainers: GymTrainerLinkRow[];
    requests: GymTrainerLinkRow[];
    invites: GymTrainerLinkRow[];
    query: string;
    results: TrainerSummary[];
    maxMessage: number;
};

const detailOf = (trainer: TrainerSummary) =>
    [trainer.city, trainer.disciplines.slice(0, 2).join(', ')]
        .filter(Boolean)
        .join(' · ');

const options = { preserveScroll: true };

/**
 * "Trainer": who works here, the requests to answer, the invitations sent
 * and the search to invite a trainer of MioPersonal.
 */
export default function GymTrainers({
    approved,
    trainers,
    requests,
    invites,
    query,
    results,
}: GymTrainersProps) {
    const [search, setSearch] = useState(query);
    const [error, setError] = useState<string | undefined>();
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Searches by itself after a short pause in typing.
    useEffect(() => {
        if (search === query) {
            return;
        }

        clearTimeout(timer.current);
        timer.current = setTimeout(
            () =>
                router.get(
                    trainersPage.url({ query: { q: search || undefined } }),
                    {},
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        only: ['results', 'query'],
                    },
                ),
            300,
        );

        return () => clearTimeout(timer.current);
    }, [search, query]);

    const onError = (errors: Record<string, string>) =>
        setError(Object.values(errors)[0]);

    return (
        <>
            <Head title="Trainer" />

            <PageHeading
                title="Trainer"
                description="I personal trainer che allenano nella tua palestra compaiono nel profilo; i clienti li prenotano da lì."
            />

            <InputError message={error} />

            {requests.length > 0 && (
                <Panel title={`Richieste da confermare · ${requests.length}`}>
                    <ul className="flex flex-col divide-y">
                        {requests.map((row) => (
                            <LinkRow
                                key={row.id}
                                kind="trainer"
                                name={row.trainer.name}
                                href={row.trainer.href}
                                detail={detailOf(row.trainer)}
                                imageUrl={row.trainer.photoUrl}
                                message={row.message}
                                actions={
                                    <>
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                router.post(
                                                    accept.url(row.id),
                                                    {},
                                                    { ...options, onError },
                                                )
                                            }
                                        >
                                            Accetta
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                router.post(
                                                    decline.url(row.id),
                                                    {},
                                                    { ...options, onError },
                                                )
                                            }
                                        >
                                            Rifiuta
                                        </Button>
                                    </>
                                }
                            />
                        ))}
                    </ul>
                </Panel>
            )}

            <Panel title={`I tuoi trainer · ${trainers.length}`}>
                {trainers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nessun trainer ancora. Invitali qui sotto, oppure chiedi
                        loro di scegliere la palestra dal proprio profilo.
                    </p>
                ) : (
                    <ul className="flex flex-col divide-y">
                        {trainers.map((row) => (
                            <LinkRow
                                key={row.id}
                                kind="trainer"
                                name={row.trainer.name}
                                href={row.trainer.href}
                                detail={detailOf(row.trainer)}
                                imageUrl={row.trainer.photoUrl}
                                actions={
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            router.delete(destroy.url(row.id), {
                                                ...options,
                                                onError,
                                            })
                                        }
                                    >
                                        Rimuovi
                                    </Button>
                                }
                            />
                        ))}
                    </ul>
                )}
            </Panel>

            {invites.length > 0 && (
                <Panel title="Inviti in attesa di risposta">
                    <ul className="flex flex-col divide-y">
                        {invites.map((row) => (
                            <LinkRow
                                key={row.id}
                                kind="trainer"
                                name={row.trainer.name}
                                href={row.trainer.href}
                                detail={detailOf(row.trainer)}
                                imageUrl={row.trainer.photoUrl}
                                actions={
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            router.delete(destroy.url(row.id), {
                                                ...options,
                                                onError,
                                            })
                                        }
                                    >
                                        Annulla invito
                                    </Button>
                                }
                            />
                        ))}
                    </ul>
                </Panel>
            )}

            <Panel title="Invita un trainer">
                {!approved ? (
                    <p className="text-sm text-muted-foreground">
                        Potrai invitare i trainer quando il profilo della
                        palestra sarà approvato.
                    </p>
                ) : (
                    <>
                        <div className="relative">
                            <Search
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                type="text"
                                aria-label="Cerca un trainer per nome"
                                placeholder="Cerca un trainer per nome"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="h-11 pl-9 text-base"
                            />
                        </div>
                        {search.trim().length >= 2 && results.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Nessun trainer trovato con questo nome.
                            </p>
                        )}
                        {results.length > 0 && (
                            <ul className="flex flex-col divide-y">
                                {results.map((trainer) => (
                                    <LinkRow
                                        key={trainer.slug}
                                        kind="trainer"
                                        name={trainer.name}
                                        href={trainer.href}
                                        detail={detailOf(trainer)}
                                        imageUrl={trainer.photoUrl}
                                        actions={
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    router.post(
                                                        invite.url(),
                                                        {
                                                            trainer:
                                                                trainer.slug,
                                                        },
                                                        {
                                                            ...options,
                                                            onSuccess: () =>
                                                                setSearch(''),
                                                            onError,
                                                        },
                                                    )
                                                }
                                            >
                                                <UserPlus aria-hidden="true" />
                                                Invita
                                            </Button>
                                        }
                                    />
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </Panel>
        </>
    );
}

GymTrainers.layout = { section: 'trainers' };
