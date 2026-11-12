import { Link, router } from '@inertiajs/react';
import { Flame } from 'lucide-react';
import { useState } from 'react';
import ClientProgressController from '@/actions/App/Http/Controllers/ClientProgressController';
import Panel from '@/components/trainer/area/panel';
import { cn } from '@/lib/utils';
import type { ClientProgressSummary } from '@/types';

type GoalCardProps = {
    progress: ClientProgressSummary;
    /** Without a trainer, a week behind the goal suggests one. */
    hasTrainer: boolean;
    searchHref: string;
};

const choices = [1, 2, 3, 4, 5, 6, 7];

/**
 * "Obiettivo della settimana": a ring with the trainings of this week out of
 * the goal, and the weeks in a row with the goal reached. Weeks, not days:
 * a day of rest never breaks anything. Without a goal, the client picks one
 * here (the same answer as "Quante volte a settimana" in "Su di te").
 */
export default function GoalCard({
    progress,
    hasTrainer,
    searchHref,
}: GoalCardProps) {
    const [choosing, setChoosing] = useState(false);
    const goal = progress.goal;

    const choose = (sessions: number) =>
        router.put(
            ClientProgressController.updateGoal.url(),
            { sessions_per_week: sessions },
            { preserveScroll: true, onSuccess: () => setChoosing(false) },
        );

    if (goal === null || choosing) {
        return (
            <Panel title="Il tuo obiettivo" className="gap-3">
                <p className="text-sm text-muted-foreground">
                    Quante volte vuoi allenarti a settimana? Conta tutto:
                    sedute, corsi e quello che fai da solo.
                </p>
                <div
                    role="group"
                    aria-label="Allenamenti a settimana"
                    className="flex flex-wrap gap-2"
                >
                    {choices.map((choice) => (
                        <button
                            key={choice}
                            type="button"
                            onClick={() => choose(choice)}
                            aria-pressed={goal === choice}
                            className={cn(
                                'flex size-10 items-center justify-center rounded-full border text-sm font-semibold tabular-nums hover:bg-secondary',
                                goal === choice &&
                                    'border-foreground bg-foreground text-background hover:bg-foreground/90',
                            )}
                        >
                            {choice}
                        </button>
                    ))}
                </div>
                {choosing && (
                    <button
                        type="button"
                        onClick={() => setChoosing(false)}
                        className="self-start text-[13px] font-semibold hover:underline"
                    >
                        Annulla
                    </button>
                )}
            </Panel>
        );
    }

    const done = Math.min(progress.thisWeek, goal);
    const reached = progress.thisWeek >= goal;
    // Less than half of the goal done: a gentle hint, never a reproach.
    const behind = !reached && progress.thisWeek * 2 < goal;

    return (
        <Panel
            title="Obiettivo della settimana"
            className="gap-3.5"
            action={
                <button
                    type="button"
                    onClick={() => setChoosing(true)}
                    className="text-[13px] leading-4.5 font-semibold hover:underline"
                >
                    Cambia
                </button>
            }
        >
            <div className="flex items-center gap-4">
                <Ring value={done} max={goal} />
                <div className="flex flex-col gap-1">
                    <span className="text-[17px] leading-6 font-bold tabular-nums">
                        {reached
                            ? 'Obiettivo raggiunto'
                            : `${progress.thisWeek} di ${goal} questa settimana`}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                        <Flame aria-hidden="true" className="size-4" />
                        {progress.streak === 0
                            ? 'Nessuna settimana di fila, per ora'
                            : progress.streak === 1
                              ? '1 settimana centrata'
                              : `${progress.streak} settimane di fila`}
                    </span>
                </div>
            </div>

            {behind && !hasTrainer && (
                <p className="rounded-2xl bg-secondary/70 p-3 text-sm">
                    Un trainer ti aiuta a tenere il ritmo.{' '}
                    <Link
                        href={searchHref}
                        className="font-semibold underline-offset-2 hover:underline"
                    >
                        Trova il tuo
                    </Link>
                </p>
            )}
        </Panel>
    );
}

/** The trainings of the week out of the goal. */
function Ring({ value, max }: { value: number; max: number }) {
    const radius = 26;
    const length = 2 * Math.PI * radius;

    return (
        <span className="relative flex size-16 flex-none items-center justify-center">
            <svg
                viewBox="0 0 64 64"
                className="size-16 -rotate-90"
                aria-hidden="true"
            >
                <circle
                    cx={32}
                    cy={32}
                    r={radius}
                    fill="none"
                    strokeWidth={6}
                    className="stroke-secondary"
                />
                <circle
                    cx={32}
                    cy={32}
                    r={radius}
                    fill="none"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={length}
                    strokeDashoffset={length * (1 - value / max)}
                    className="stroke-primary transition-[stroke-dashoffset] motion-reduce:transition-none"
                />
            </svg>
            <span className="absolute text-sm font-bold tabular-nums">
                {value}/{max}
            </span>
        </span>
    );
}
