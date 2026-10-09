import { Check } from 'lucide-react';
import BrandLogo from '@/components/layout/brand-logo';
import { Button } from '@/components/ui/button';
import type { QuizStep } from '@/lib/quiz';
import { answerText, padNumber, questions } from '@/lib/quiz';
import { cn } from '@/lib/utils';
import type { QuizAnswers } from '@/types';

type QuizAsideProps = {
    step: QuizStep;
    answers: QuizAnswers;
    zoneLabel: string | null;
    onEdit: () => void;
};

const overline =
    'text-xs leading-4 font-semibold tracking-[0.08em] uppercase opacity-60';

const pill =
    'flex h-7.5 items-center rounded-full border border-current px-3 text-[13px] leading-4 font-medium opacity-85';

/** Dark column on the left (desktop only): what the quiz is, where you are, your answers. */
export default function QuizAside({
    step,
    answers,
    zoneLabel,
    onEdit,
}: QuizAsideProps) {
    const question = typeof step === 'number' ? questions[step - 1] : null;

    return (
        <aside className="hidden max-w-110 flex-[1_1_360px] flex-col gap-9 bg-primary p-10 text-primary-foreground md:flex">
            <BrandLogo className="text-primary-foreground" />

            {step === 'intro' && (
                <div className="flex flex-col gap-5">
                    <span className={overline}>
                        Quiz · Trova il tuo trainer
                    </span>
                    <p className="text-[56px] leading-14 font-bold tracking-[-0.035em]">
                        Il trainer giusto, in un minuto.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className={pill}>7 domande</span>
                        <span className={pill}>Circa 1 minuto</span>
                        <span className={pill}>Senza registrarti</span>
                    </div>
                </div>
            )}

            {question && typeof step === 'number' && (
                <>
                    <div className="flex flex-col gap-1">
                        <span className={overline}>Domanda</span>
                        <div className="flex items-baseline gap-2.5 tabular-nums">
                            <span className="text-[120px] leading-[104px] font-bold tracking-[-0.05em]">
                                {padNumber(step)}
                            </span>
                            <span className="text-[28px] leading-8 font-semibold opacity-40">
                                / {padNumber(questions.length)}
                            </span>
                        </div>
                        <span className="text-xl font-semibold">
                            {question.category}
                        </span>
                    </div>

                    <ol aria-label="Domande del quiz" className="flex flex-col">
                        {questions.map((item, index) => {
                            const number = index + 1;
                            const current = number === step;
                            const value = answerText(item, answers, zoneLabel);
                            const done = value !== '' && !current;

                            return (
                                <li
                                    key={item.key}
                                    aria-current={current ? 'step' : undefined}
                                    className={cn(
                                        'flex items-center gap-3 py-2',
                                        current
                                            ? 'opacity-100'
                                            : done
                                              ? 'opacity-85'
                                              : 'opacity-45',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex size-7 flex-none items-center justify-center rounded-full text-xs leading-none font-semibold tabular-nums',
                                            current
                                                ? 'bg-primary-foreground text-primary'
                                                : done
                                                  ? 'border-[1.5px] border-current'
                                                  : 'border-[1.5px] border-dashed border-current',
                                        )}
                                    >
                                        {done ? (
                                            <Check
                                                aria-label="risposta data"
                                                className="size-3.5"
                                            />
                                        ) : (
                                            padNumber(number)
                                        )}
                                    </span>
                                    <span className="flex min-w-0 flex-col">
                                        <span className="text-sm font-semibold">
                                            {item.category}
                                        </span>
                                        <span className="max-w-70 truncate text-xs opacity-70">
                                            {value ||
                                                (current ? 'In corso' : '—')}
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                </>
            )}

            {step === 'results' && (
                <div className="flex flex-col gap-4">
                    <span className={overline}>Le tue risposte</span>
                    <dl className="flex flex-col gap-3">
                        {questions.map((item) => (
                            <div
                                key={item.key}
                                className="flex flex-col gap-0.5"
                            >
                                <dt className="text-xs opacity-60">
                                    {item.category}
                                </dt>
                                <dd className="text-[15px] leading-[22px] font-semibold">
                                    {answerText(item, answers, zoneLabel) ||
                                        '—'}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onEdit}
                        className="h-10 self-start border-current bg-transparent text-inherit hover:bg-primary-foreground/10 hover:text-inherit dark:bg-transparent"
                    >
                        Modifica le risposte
                    </Button>
                </div>
            )}

            <p className="mt-auto text-xs leading-[18px] opacity-60">
                Non ti chiediamo dati sulla salute. Le risposte servono solo a
                suggerirti i trainer.
            </p>
        </aside>
    );
}
