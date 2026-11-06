import { useId } from 'react';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { ClientAbout as About } from '@/types';

/**
 * "Sul cliente": what the client wrote in "Su di te" of "Completa il tuo
 * profilo", in "Richieste" (to decide) and in "Clienti" (to prepare the
 * session). Only the answers given.
 */
export default function ClientAbout({
    about,
    className,
}: {
    about: About;
    className?: string;
}) {
    const titleId = useId();
    const goal = trainingGoals.find((option) => option.value === about.goal);

    const rows = [
        {
            label: 'Età',
            value: about.age === null ? null : `${about.age} anni`,
        },
        { label: 'Sesso', value: about.sex },
        { label: 'Obiettivo', value: goal?.label ?? null },
        { label: 'Livello', value: about.level },
        { label: 'Si allena da', value: about.experience },
        { label: 'Attività', value: about.activity },
        {
            label: 'Vorrebbe allenarsi',
            value:
                about.sessionsPerWeek === null
                    ? null
                    : `${about.sessionsPerWeek} ${about.sessionsPerWeek === 1 ? 'volta' : 'volte'} a settimana`,
        },
        {
            label: 'Altezza',
            value: about.heightCm === null ? null : `${about.heightCm} cm`,
        },
        {
            label: 'Peso',
            value: about.weightKg === null ? null : `${about.weightKg} kg`,
        },
        {
            label: 'Sport',
            value: about.sports.length === 0 ? null : about.sports.join(', '),
        },
    ].filter((row) => row.value !== null);

    return (
        <section
            aria-labelledby={titleId}
            className={cn('flex flex-col gap-2.5', className)}
        >
            <h3 id={titleId} className="text-[15px] leading-5.5 font-semibold">
                Sul cliente
            </h3>
            {rows.length > 0 && (
                <dl className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-2.5">
                    {rows.map((row) => (
                        <div key={row.label} className="flex flex-col gap-0.5">
                            <dt className="text-xs text-muted-foreground">
                                {row.label}
                            </dt>
                            <dd className="text-sm font-medium">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            {about.note && (
                <p className="rounded-lg bg-muted px-3 py-2.5 text-sm whitespace-pre-line">
                    {about.note}
                </p>
            )}
        </section>
    );
}
