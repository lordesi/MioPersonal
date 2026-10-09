import { ArrowLeft, ArrowRight } from 'lucide-react';
import OptionCard from '@/components/quiz/option-card';
import QuizProgress from '@/components/quiz/quiz-progress';
import ZoneStep from '@/components/quiz/zone-step';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { isAnswered, padNumber, questions } from '@/lib/quiz';
import type { ChoiceQuestion } from '@/lib/quiz';
import { cn } from '@/lib/utils';
import type { QuizAnswers } from '@/types';

type QuizQuestionProps = {
    /** From 1. */
    step: number;
    answers: QuizAnswers;
    zoneLabel: string | null;
    onChange: (
        changes: Partial<QuizAnswers>,
        zoneLabel?: string | null,
    ) => void;
    onBack: () => void;
    /** Next question, or the results after the last one. */
    onNext: () => void;
    /** True while the results are loading. */
    processing: boolean;
};

/** One question: number, title, answers and the Indietro / Salta / Avanti bar. */
export default function QuizQuestion({
    step,
    answers,
    zoneLabel,
    onChange,
    onBack,
    onNext,
    processing,
}: QuizQuestionProps) {
    const question = questions[step - 1];
    const total = questions.length;
    const isLast = step === total;
    const answered = isAnswered(question, answers);
    const multiple = question.kind === 'multiple';

    /** Multiple choice adds or removes the value, single choice replaces it. */
    const pick = (key: ChoiceQuestion['key'], value: string) => {
        const current = answers[key];
        const next = Array.isArray(current)
            ? current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value]
            : value;

        // The key decides the type: a list for multiple choice, a string otherwise.
        onChange({ [key]: next } as Partial<QuizAnswers>);
    };

    const isPicked = (key: ChoiceQuestion['key'], value: string) => {
        const current = answers[key];

        return Array.isArray(current)
            ? current.includes(value)
            : current === value;
    };

    return (
        <>
            {/* Mobile: dark band with the progress and the number. */}
            <div className="flex flex-col gap-3.5 bg-primary px-4 pt-4 pb-5 text-primary-foreground md:hidden">
                <QuizProgress step={step} total={total} onPrimary />
                <div className="flex items-baseline gap-2.5 tabular-nums">
                    <span className="text-[64px] leading-15 font-bold tracking-[-0.05em]">
                        {padNumber(step)}
                    </span>
                    <span className="text-xl font-semibold opacity-40">
                        / {padNumber(total)}
                    </span>
                    <span className="ml-auto text-[15px] leading-5 font-semibold">
                        {question.category}
                    </span>
                </div>
            </div>

            <section
                aria-labelledby="quiz-domanda"
                className="flex flex-1 flex-col md:max-w-205 md:gap-6"
            >
                <fieldset className="flex min-w-0 flex-col gap-4 px-4 pt-5 pb-6 md:gap-6 md:p-0">
                    <legend className="flex flex-col pb-4 md:pb-6">
                        <span
                            id="quiz-domanda"
                            className="text-[28px] leading-8 font-bold tracking-[-0.03em] md:text-[40px] md:leading-11"
                        >
                            {question.title}
                        </span>
                        <span className="flex items-center gap-2 pt-2 text-sm text-muted-foreground md:pt-2.5 md:text-base">
                            <span>
                                {question.help}
                                {multiple && (
                                    <span className="md:hidden">
                                        {' '}
                                        · Scelta multipla
                                    </span>
                                )}
                            </span>
                            {multiple && (
                                <Badge
                                    variant="outline"
                                    className="hidden h-5.5 rounded-full px-2 text-xs md:inline-flex"
                                >
                                    Scelta multipla
                                </Badge>
                            )}
                        </span>
                    </legend>

                    {question.kind === 'zone' ? (
                        <ZoneStep
                            answers={answers}
                            zoneLabel={zoneLabel}
                            onChange={onChange}
                        />
                    ) : (
                        <div className="grid gap-2 md:grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] md:gap-3">
                            {question.options.map((option) => (
                                <OptionCard
                                    key={option.value}
                                    option={option}
                                    multiple={multiple}
                                    pressed={isPicked(
                                        question.key,
                                        option.value,
                                    )}
                                    onClick={() =>
                                        pick(question.key, option.value)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </fieldset>

                {/* Fixed at the bottom on mobile, under the answers on desktop. */}
                <div className="sticky bottom-0 mt-auto flex items-center gap-2 border-t bg-background px-4 py-3 md:static md:px-0 md:pt-6 md:pb-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        className="size-13 rounded-[10px] text-base md:w-auto md:px-4.5 md:has-[>svg]:px-4.5"
                    >
                        <ArrowLeft aria-hidden="true" />
                        {/* Only the arrow on mobile, but screen readers always hear "Indietro". */}
                        <span className="sr-only md:not-sr-only">Indietro</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onNext}
                        disabled={processing}
                        className="h-13 px-3 text-[15px] text-muted-foreground md:px-4 md:text-base"
                    >
                        Salta
                    </Button>
                    <Button
                        type="button"
                        aria-disabled={!answered}
                        disabled={processing}
                        onClick={() => answered && onNext()}
                        className={cn(
                            'h-13 flex-1 rounded-[10px] text-base font-semibold md:ml-auto md:flex-none md:px-7 md:has-[>svg]:px-7',
                            !answered &&
                                'cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted',
                        )}
                    >
                        {processing && <Spinner />}
                        {isLast ? 'Vedi i risultati' : 'Avanti'}
                        <ArrowRight
                            aria-hidden="true"
                            className="hidden md:block"
                        />
                    </Button>
                </div>
            </section>
        </>
    );
}
