import { Award, Download, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Panel from '@/components/trainer/area/panel';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { formatDayMonthYear } from '@/lib/format';
import { canvasFile, download, drawAchievementStory } from '@/lib/story-image';
import type { ClientAchievements, EarnedAchievement } from '@/types';

/** The ones reached shown before "Mostra tutti". */
const SHOWN = 3;

/**
 * "Traguardi": the ones reached, each with "Condividi" (an image for the
 * stories, with the trainer's name and link when there is one), and how far
 * the next one is. Milestones, not points: no levels, no rankings.
 */
export default function AchievementsPanel({
    achievements,
}: {
    achievements: ClientAchievements;
}) {
    const [all, setAll] = useState(false);
    const { earned, next } = achievements;
    const shown = all ? earned : earned.slice(0, SHOWN);

    if (earned.length === 0 && next === null) {
        return null;
    }

    return (
        <Panel title="Traguardi" className="gap-3">
            {next && (
                <div className="flex flex-col gap-2 rounded-2xl bg-secondary/70 p-3.5">
                    <span className="flex items-baseline justify-between gap-3 text-sm">
                        <span>
                            Prossimo:{' '}
                            <span className="font-semibold">{next.title}</span>
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                            {next.current}/{next.target}
                        </span>
                    </span>
                    <div
                        role="progressbar"
                        aria-label={`Verso ${next.title}`}
                        aria-valuemin={0}
                        aria-valuemax={next.target}
                        aria-valuenow={next.current}
                        className="h-2 overflow-hidden rounded-full bg-border"
                    >
                        <div
                            style={{
                                width: `${(next.current / next.target) * 100}%`,
                            }}
                            className="h-full rounded-full bg-primary"
                        />
                    </div>
                </div>
            )}

            {earned.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    La prima seduta o il primo allenamento segnato è già un
                    traguardo.
                </p>
            ) : (
                <ul className="flex flex-col divide-y">
                    {shown.map((achievement) => (
                        <AchievementRow
                            key={achievement.key}
                            achievement={achievement}
                            siteLink={achievements.siteLink}
                        />
                    ))}
                </ul>
            )}

            {earned.length > SHOWN && (
                <button
                    type="button"
                    onClick={() => setAll(!all)}
                    className="self-start text-[13px] font-semibold hover:underline"
                >
                    {all ? 'Mostra meno' : `Mostra tutti (${earned.length})`}
                </button>
            )}
        </Panel>
    );
}

function AchievementRow({
    achievement,
    siteLink,
}: {
    achievement: EarnedAchievement;
    siteLink: string;
}) {
    return (
        <li className="flex items-center gap-3 py-2.5">
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Award aria-hidden="true" className="size-4.5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold">
                    {achievement.title}
                </span>
                <span className="text-xs text-muted-foreground">
                    {formatDayMonthYear(achievement.earnedAt)}
                    {achievement.trainer &&
                        ` · con ${achievement.trainer.name}`}
                </span>
            </span>
            <ShareDialog achievement={achievement} siteLink={siteLink} />
        </li>
    );
}

/**
 * The image for the stories, drawn when the dialog opens: sharing then
 * happens right on the tap, as the phones want.
 */
function ShareDialog({
    achievement,
    siteLink,
}: {
    achievement: EarnedAchievement;
    siteLink: string;
}) {
    const [open, setOpen] = useState(false);
    const [ready, setReady] = useState(false);
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!open) {
            setReady(false);

            return;
        }

        // The canvas is mounted in the next frame, with the dialog.
        const frame = requestAnimationFrame(() => {
            if (!canvas.current) {
                return;
            }

            drawAchievementStory(canvas.current, {
                title: achievement.title,
                description: achievement.description,
                date: formatDayMonthYear(achievement.earnedAt),
                trainerName: achievement.trainer?.name ?? null,
                link: achievement.trainer?.link ?? siteLink,
            })
                .then(() => setReady(true))
                .catch(() =>
                    toast.error('Non siamo riusciti a creare l’immagine.'),
                );
        });

        return () => cancelAnimationFrame(frame);
    }, [open, achievement, siteLink]);

    const file = () =>
        canvas.current
            ? canvasFile(canvas.current, 'miopersonal-traguardo.png')
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Condividi ${achievement.title}`}
                    className="h-8.5 rounded-lg"
                >
                    <Share2 aria-hidden="true" />
                    Condividi
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{achievement.title}</DialogTitle>
                    <DialogDescription>
                        Un'immagine per le storie di Instagram
                        {achievement.trainer
                            ? `, con il link al profilo di ${achievement.trainer.name}.`
                            : '.'}
                    </DialogDescription>
                </DialogHeader>
                <canvas
                    ref={canvas}
                    aria-label={`Immagine del traguardo ${achievement.title}`}
                    className="mx-auto aspect-[9/16] w-full max-w-60 rounded-xl border bg-sidebar"
                />
                <div className="flex gap-2">
                    <Button
                        type="button"
                        className="flex-1"
                        disabled={!ready}
                        onClick={share}
                    >
                        <Share2 aria-hidden="true" />
                        Condividi
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        disabled={!ready}
                        onClick={save}
                    >
                        <Download aria-hidden="true" />
                        Salva
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
