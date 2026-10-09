import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { padNumber, questions } from '@/lib/quiz';
import type { QuizQuestion } from '@/lib/quiz';
import { searchUrl } from '@/lib/search';

/** Two example answers under each question, e.g. "Rimettermi in forma · Diventare più forte". */
function examples(question: QuizQuestion): string {
    return question.kind === 'zone'
        ? 'Quartiere, via o CAP'
        : question.options
              .slice(0, 2)
              .map((option) => option.label)
              .join(' · ');
}

const pill =
    'flex h-7 items-center rounded-full border border-current px-2.5 text-xs font-medium opacity-85';

/** First screen: what the quiz asks and the "Inizia il quiz" button. */
export default function QuizIntro({ onStart }: { onStart: () => void }) {
    return (
        <>
            {/* Mobile */}
            <section
                aria-labelledby="quiz-intro-mobile"
                className="flex flex-col gap-4.5 bg-primary px-4 pt-7 pb-8 text-primary-foreground md:hidden"
            >
                <span className="text-xs leading-4 font-semibold tracking-[0.08em] uppercase opacity-60">
                    Quiz · Trova il tuo trainer
                </span>
                <h1
                    id="quiz-intro-mobile"
                    className="text-[44px] leading-11 font-bold tracking-[-0.035em]"
                >
                    Il trainer giusto, in un minuto.
                </h1>
                <div className="flex flex-wrap gap-1.5">
                    <span className={pill}>7 domande</span>
                    <span className={pill}>1 minuto</span>
                    <span className={pill}>Senza registrarti</span>
                </div>
            </section>

            <div className="flex flex-1 flex-col gap-3.5 px-4 py-6 md:hidden">
                <h2 className="text-lg font-semibold">Cosa ti chiediamo</h2>
                <ol className="flex flex-col gap-2">
                    {questions.map((question, index) => (
                        <li
                            key={question.key}
                            className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                        >
                            <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-muted">
                                <question.icon
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                            </span>
                            <span className="flex min-w-0 flex-col">
                                <span className="text-[15px] leading-5 font-semibold">
                                    {question.category}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {examples(question)}
                                </span>
                            </span>
                            <span className="ml-auto text-xs font-semibold text-muted-foreground tabular-nums">
                                {padNumber(index + 1)}
                            </span>
                        </li>
                    ))}
                </ol>
                <p className="mt-1 text-xs leading-[18px] text-muted-foreground">
                    Non ti chiediamo dati sulla salute.
                </p>
            </div>

            <div className="sticky bottom-0 flex flex-col gap-1.5 border-t bg-background px-4 py-3 md:hidden">
                <Button
                    type="button"
                    onClick={onStart}
                    className="h-13 text-[17px] font-semibold"
                >
                    Inizia il quiz
                    <ArrowRight aria-hidden="true" />
                </Button>
                <Link
                    href={searchUrl()}
                    className="flex min-h-10 items-center justify-center text-sm font-medium"
                >
                    Preferisco cercare da solo
                </Link>
            </div>

            {/* Desktop */}
            <section
                aria-labelledby="quiz-intro"
                className="hidden max-w-190 flex-col gap-7 md:flex"
            >
                <div className="flex flex-col gap-2.5">
                    <h1
                        id="quiz-intro"
                        className="text-[40px] leading-11 font-bold tracking-[-0.03em]"
                    >
                        Rispondi a 7 domande, ti proponiamo 3 trainer.
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Mettiamo insieme obiettivo, orari, zona e budget e ti
                        diciamo quanto ogni trainer è compatibile con te.
                    </p>
                </div>

                <ol className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-2.5">
                    {questions.map((question, index) => (
                        <li
                            key={question.key}
                            className="flex items-center gap-3 rounded-[14px] border bg-card p-3.5"
                        >
                            <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-muted">
                                <question.icon
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </span>
                            <span className="flex min-w-0 flex-col">
                                <span className="text-[15px] leading-[22px] font-semibold">
                                    <span className="font-medium text-muted-foreground tabular-nums">
                                        {padNumber(index + 1)}{' '}
                                    </span>
                                    {question.category}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {examples(question)}
                                </span>
                            </span>
                        </li>
                    ))}
                </ol>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="button"
                        onClick={onStart}
                        className="h-14 rounded-[10px] px-8 text-[17px] font-semibold has-[>svg]:px-8"
                    >
                        Inizia il quiz
                        <ArrowRight aria-hidden="true" />
                    </Button>
                    <Link
                        href={searchUrl()}
                        className="flex h-14 items-center px-4 text-[15px] font-medium"
                    >
                        Preferisco cercare da solo
                    </Link>
                </div>
            </section>
        </>
    );
}
