import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import MatchRing from '@/components/quiz/match-ring';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFieldValidation } from '@/hooks/use-field-validation';
import { formatPrice, formatRating } from '@/lib/format';
import { answerText, questions, reasonTexts } from '@/lib/quiz';
import { searchUrl } from '@/lib/search';
import type { QuizAnswers, QuizMatch } from '@/types';

type QuizResultsProps = {
    results: QuizMatch[];
    answers: QuizAnswers;
    zoneLabel: string | null;
    onEdit: () => void;
    onRestart: () => void;
};

function ratingText(rating: number | null): string {
    return rating === null ? 'Nuovo' : `★ ${formatRating(rating)}`;
}

/** The most compatible trainer, on the dark card. */
function BestMatch({ match }: { match: QuizMatch }) {
    const price = formatPrice(match.priceFromCents);

    return (
        <article className="flex flex-col gap-3.5 rounded-[18px] bg-primary p-5 text-primary-foreground md:flex-row md:flex-wrap md:items-center md:gap-6 md:p-7">
            <div className="flex items-center gap-3.5 md:contents">
                <MatchRing
                    name={match.name}
                    percent={match.matchPercent}
                    onPrimary
                    className="size-21 text-[22px] leading-7 md:size-28 md:text-[28px] md:leading-8"
                />
                {/* Mobile: badge, name and percentage next to the ring. */}
                <div className="flex min-w-0 flex-col gap-0.5 md:hidden">
                    <span className="flex h-5.5 items-center self-start rounded-full bg-primary-foreground px-2 text-[11px] leading-3.5 font-semibold text-primary">
                        Il più adatto
                    </span>
                    <h2 className="text-[22px] leading-7 font-bold tracking-[-0.02em]">
                        {match.name}
                    </h2>
                    <span className="text-[13px] leading-[18px] tabular-nums opacity-75">
                        {match.matchPercent}% compatibile · da {price}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-3.5 md:flex-[1_1_300px] md:gap-2.5">
                <div className="hidden flex-wrap items-baseline gap-x-3.5 gap-y-1.5 md:flex">
                    <span className="flex h-6 items-center rounded-full bg-primary-foreground px-2.5 text-xs font-semibold text-primary">
                        Il più adatto a te
                    </span>
                    <span className="text-sm tabular-nums opacity-75">
                        {ratingText(match.rating)} · {match.area} · da {price}
                    </span>
                </div>
                <div className="hidden flex-wrap items-baseline gap-3.5 md:flex">
                    <h2 className="text-3xl font-bold tracking-tight">
                        {match.name}
                    </h2>
                    <span className="text-3xl font-bold tracking-tight tabular-nums">
                        {match.matchPercent}%
                        <span className="text-sm font-medium opacity-70">
                            {' '}
                            compatibile
                        </span>
                    </span>
                </div>

                <ul className="flex flex-wrap gap-1.5 md:gap-2">
                    {reasonTexts(match.reasons).map((reason) => (
                        <li
                            key={reason}
                            className="flex h-7 items-center gap-1.5 rounded-full border border-primary-foreground/40 px-2.5 text-xs font-medium md:h-7.5 md:px-3 md:text-[13px]"
                        >
                            <Check
                                aria-hidden="true"
                                className="hidden size-3.5 md:block"
                            />
                            {reason}
                        </li>
                    ))}
                </ul>

                <div className="flex flex-wrap gap-2 md:pt-1.5">
                    <Button
                        asChild
                        className="h-12 flex-1 rounded-[10px] bg-primary-foreground text-[15px] font-semibold text-primary hover:bg-primary-foreground/90 md:h-11 md:flex-none md:px-5"
                    >
                        <Link href={match.href}>
                            Prenota · {match.nextSlotLabel}
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="hidden h-11 rounded-[10px] border-current bg-transparent px-5 text-[15px] text-inherit hover:bg-primary-foreground/10 hover:text-inherit md:inline-flex dark:bg-transparent"
                    >
                        <Link href={match.href}>Vedi profilo</Link>
                    </Button>
                </div>
            </div>
        </article>
    );
}

/** Second and third trainer. */
function OtherMatch({ match, rank }: { match: QuizMatch; rank: number }) {
    return (
        <article className="flex flex-col gap-3 rounded-[18px] border bg-card p-4 md:gap-3.5 md:p-5">
            <div className="flex items-center gap-3 md:gap-3.5">
                <MatchRing
                    name={match.name}
                    percent={match.matchPercent}
                    className="size-14 text-sm md:size-16 md:text-base"
                />
                <div className="flex min-w-0 flex-col">
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        #{rank} · {match.matchPercent}% compatibile
                    </span>
                    <h2 className="text-[17px] leading-6 font-bold md:text-lg md:leading-[26px] md:tracking-[-0.02em]">
                        {match.name}
                    </h2>
                    <span className="text-xs text-muted-foreground tabular-nums md:text-[13px] md:leading-[18px]">
                        <span className="hidden md:inline">
                            {ratingText(match.rating)} ·{' '}
                        </span>
                        {match.area} · da {formatPrice(match.priceFromCents)}
                    </span>
                </div>
            </div>

            <ul className="hidden flex-wrap gap-1.5 md:flex">
                {reasonTexts(match.reasons).map((reason) => (
                    <li
                        key={reason}
                        className="flex h-6.5 items-center rounded-full bg-secondary px-2.5 text-xs font-medium"
                    >
                        {reason}
                    </li>
                ))}
            </ul>

            <Button
                asChild
                variant="outline"
                className="mt-auto h-11 rounded-[10px] font-semibold md:h-10"
            >
                <Link href={match.href}>
                    Prenota · primo slot {match.nextSlotLabel}
                </Link>
            </Button>
        </article>
    );
}

/** "Ti mandiamo i risultati via email?" */
function EmailResults() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    // Empty or wrong email: Italian message instead of the browser bubble.
    const emailError = useFieldValidation('quiz-email');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        // TODO: send the results by email (no newsletter, as promised).
        setSent(true);
    };

    return (
        <section
            aria-label="Ricevi i risultati"
            className="flex flex-col gap-2.5 rounded-[14px] border bg-card p-3.5 md:p-4.5"
        >
            {sent ? (
                <p role="status" className="text-sm">
                    Fatto: controlla la tua casella di posta.
                </p>
            ) : (
                <form onSubmit={submit} className="flex flex-col gap-2.5">
                    <Label
                        htmlFor="quiz-email"
                        className="text-[15px] font-semibold"
                    >
                        Ti mandiamo i risultati via email?
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        <Input
                            id="quiz-email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="nome@esempio.it"
                            aria-describedby={
                                emailError ? 'quiz-email-error' : undefined
                            }
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="h-11 flex-[1_1_100%] bg-background text-base md:flex-[1_1_220px] md:text-base"
                        />
                        <Button
                            type="submit"
                            className="h-11 px-4.5 font-semibold"
                        >
                            Inviameli
                        </Button>
                    </div>
                    {emailError && (
                        <p
                            id="quiz-email-error"
                            className="text-sm text-destructive"
                        >
                            {emailError}
                        </p>
                    )}
                    <span className="text-xs text-muted-foreground">
                        Solo i risultati del quiz, niente newsletter.
                    </span>
                </form>
            )}
        </section>
    );
}

/** Last screen: the 3 suggested trainers, ordered by compatibility. */
export default function QuizResults({
    results,
    answers,
    zoneLabel,
    onEdit,
    onRestart,
}: QuizResultsProps) {
    const [best, ...others] = results;
    const summary = questions
        .map((question) => answerText(question, answers, zoneLabel))
        .filter((text) => text !== '');

    return (
        <section
            aria-labelledby="quiz-risultati"
            className="flex flex-col gap-4 px-4 pt-6 pb-8 md:max-w-215 md:gap-6 md:p-0"
        >
            <div className="flex flex-col gap-2">
                <h1
                    id="quiz-risultati"
                    className="text-[32px] leading-9 font-bold tracking-[-0.03em] md:text-[40px] md:leading-11"
                >
                    I tuoi 3 trainer
                </h1>
                <p className="hidden text-muted-foreground md:block">
                    Ordinati per compatibilità con le tue risposte. È un
                    suggerimento: guarda sempre il profilo.
                </p>
            </div>

            {/* Mobile: the answers as chips (on desktop they are in the dark column). */}
            {summary.length > 0 && (
                <ul
                    aria-label="Le tue risposte"
                    className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto pb-0.5 md:hidden"
                >
                    {summary.map((text) => (
                        <li
                            key={text}
                            className="flex h-7 shrink-0 items-center rounded-full bg-secondary px-2.5 text-xs font-medium whitespace-nowrap"
                        >
                            {text}
                        </li>
                    ))}
                </ul>
            )}

            {best && <BestMatch match={best} />}

            <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))]">
                {others.map((match, index) => (
                    <OtherMatch
                        key={match.href}
                        match={match}
                        rank={index + 2}
                    />
                ))}
            </div>

            <EmailResults />

            <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onEdit}
                    className="h-11 md:hidden"
                >
                    Modifica risposte
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="hidden h-11 rounded-[10px] px-5 md:inline-flex"
                >
                    <Link href={searchUrl()}>Vedi tutti i trainer</Link>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onRestart}
                    className="h-11"
                >
                    Rifai il quiz
                </Button>
            </div>
        </section>
    );
}
