import { Head, Link, router } from '@inertiajs/react';
import { Search, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import LinkRow from '@/components/gym/link-row';
import InputError from '@/components/input-error';
import Panel from '@/components/trainer/area/panel';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gyms as gymsPage } from '@/routes/trainer';
import { accept, decline, destroy, request } from '@/routes/trainer/gyms';
import type { GymSummary, TrainerGymLinkRow } from '@/types';

type TrainerGymsProps = {
    gyms: TrainerGymLinkRow[];
    invites: TrainerGymLinkRow[];
    requests: TrainerGymLinkRow[];
    query: string;
    results: GymSummary[];
    approved: boolean;
    max: number;
    maxMessage: number;
};

const detailOf = (gym: GymSummary) => `${gym.address}, ${gym.city}`;

const options = { preserveScroll: true };

/**
 * "Palestre": where the trainer works. A gym appears in the profile (and the
 * trainer in the gym's) once both agree.
 */
export default function TrainerGyms({
    gyms,
    invites,
    requests,
    query,
    results,
    approved,
    max,
}: TrainerGymsProps) {
    const [search, setSearch] = useState(query);
    const [error, setError] = useState<string | undefined>();
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const used = gyms.length + invites.length + requests.length;

    useEffect(() => {
        if (search === query) {
            return;
        }

        clearTimeout(timer.current);
        timer.current = setTimeout(
            () =>
                router.get(
                    gymsPage.url({ query: { q: search || undefined } }),
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
            <Head title="Palestre" />

            <PageHeading
                title="Palestre"
                description={`Le palestre di MioPersonal dove alleni: compaiono nel tuo profilo e tu nel loro. Al massimo ${max}.`}
            />

            <InputError message={error} />

            {invites.length > 0 && (
                <Panel title={`Inviti da confermare · ${invites.length}`}>
                    <ul className="flex flex-col divide-y">
                        {invites.map((row) => (
                            <LinkRow
                                key={row.id}
                                kind="gym"
                                name={row.gym.name}
                                href={row.gym.href}
                                detail={detailOf(row.gym)}
                                imageUrl={row.gym.coverUrl}
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

            <Panel title={`Dove alleni · ${gyms.length}`}>
                {gyms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nessuna palestra collegata. Cercala qui sotto e chiedi
                        di allenare lì: la palestra conferma.
                    </p>
                ) : (
                    <ul className="flex flex-col divide-y">
                        {gyms.map((row) => (
                            <LinkRow
                                key={row.id}
                                kind="gym"
                                name={row.gym.name}
                                href={row.gym.href}
                                detail={detailOf(row.gym)}
                                imageUrl={row.gym.coverUrl}
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
                                        Lascia
                                    </Button>
                                }
                            >
                                {row.courses.length > 0 && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            Corsi che tieni qui
                                        </span>
                                        <ul className="flex flex-wrap gap-1.5">
                                            {row.courses.map((course) => (
                                                <li key={course.id}>
                                                    <Link
                                                        href={course.href}
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm hover:bg-accent"
                                                    >
                                                        <span className="font-medium">
                                                            {course.name}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {course.when}
                                                        </span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </LinkRow>
                        ))}
                    </ul>
                )}
            </Panel>

            {requests.length > 0 && (
                <Panel title="Richieste in attesa di risposta">
                    {!approved && (
                        <p className="text-sm text-muted-foreground">
                            Le palestre le ricevono quando il tuo profilo è
                            approvato.
                        </p>
                    )}
                    <ul className="flex flex-col divide-y">
                        {requests.map((row) => (
                            <LinkRow
                                key={row.id}
                                kind="gym"
                                name={row.gym.name}
                                href={row.gym.href}
                                detail={detailOf(row.gym)}
                                imageUrl={row.gym.coverUrl}
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
                                        Annulla richiesta
                                    </Button>
                                }
                            />
                        ))}
                    </ul>
                </Panel>
            )}

            <Panel title="Cerca una palestra">
                {used >= max ? (
                    <p className="text-sm text-muted-foreground">
                        Hai già {max} palestre tra collegate e richieste.
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
                                aria-label="Cerca una palestra per nome"
                                placeholder="Cerca una palestra per nome"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="h-11 pl-9 text-base"
                            />
                        </div>
                        {search.trim().length >= 2 && results.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Nessuna palestra trovata: forse non è ancora su
                                MioPersonal.
                            </p>
                        )}
                        {results.length > 0 && (
                            <ul className="flex flex-col divide-y">
                                {results.map((gym) => (
                                    <LinkRow
                                        key={gym.slug}
                                        kind="gym"
                                        name={gym.name}
                                        href={gym.href}
                                        detail={detailOf(gym)}
                                        imageUrl={gym.coverUrl}
                                        actions={
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    router.post(
                                                        request.url(gym.slug),
                                                        {},
                                                        {
                                                            ...options,
                                                            onSuccess: () =>
                                                                setSearch(''),
                                                            onError,
                                                        },
                                                    )
                                                }
                                            >
                                                <Send aria-hidden="true" />
                                                Chiedi di allenare qui
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

TrainerGyms.layout = { section: 'gyms' };
