import { Head, Link, router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import BrandLogo from '@/components/layout/brand-logo';
import QuizAside from '@/components/quiz/quiz-aside';
import QuizIntro from '@/components/quiz/quiz-intro';
import QuizProgress from '@/components/quiz/quiz-progress';
import QuizQuestion from '@/components/quiz/quiz-question';
import QuizResults from '@/components/quiz/quiz-results';
import { emptyAnswers, questions, zoneLabelOf } from '@/lib/quiz';
import type { QuizStep } from '@/lib/quiz';
import { searchUrl } from '@/lib/search';
import { results as resultsRoute, show } from '@/routes/quiz';
import type { QuizAnswers, QuizMatch } from '@/types';

type QuizProps = {
    /** Sent back by the server with the results, null on the intro. */
    answers: QuizAnswers | null;
    results: QuizMatch[] | null;
};

/**
 * The answers stay in this page while the user goes through the questions.
 * Only at the end they go to the server (in the URL), which sends back the
 * 3 trainers. No account needed, nothing is saved.
 */
export default function Quiz({ answers: savedAnswers, results }: QuizProps) {
    const [step, setStep] = useState<QuizStep>(results ? 'results' : 'intro');
    const [answers, setAnswers] = useState<QuizAnswers>(
        savedAnswers ?? emptyAnswers,
    );
    const [zoneLabel, setZoneLabel] = useState(
        zoneLabelOf(savedAnswers?.zone ?? null),
    );
    const [processing, setProcessing] = useState(false);

    const goTo = (next: QuizStep) => {
        setStep(next);
        window.scrollTo({ top: 0 });
    };

    const update = (changes: Partial<QuizAnswers>, label?: string | null) => {
        setAnswers({ ...answers, ...changes });

        if (label !== undefined) {
            setZoneLabel(label);
        }
    };

    const showResults = () =>
        router.get(
            resultsRoute.url({ query: answers }),
            {},
            {
                // Keep the answers and the zone name of this page.
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => goTo('results'),
            },
        );

    const next = () => {
        if (typeof step !== 'number') {
            return;
        }

        if (step < questions.length) {
            goTo(step + 1);
        } else {
            showResults();
        }
    };

    const back = () => {
        if (typeof step === 'number') {
            goTo(step > 1 ? step - 1 : 'intro');
        }
    };

    const restart = () => {
        setAnswers(emptyAnswers);
        setZoneLabel(null);
        goTo('intro');
        // Back to /quiz, so reloading the page doesn't show the old results.
        router.get(show.url(), {}, { preserveState: true, replace: true });
    };

    const exitHref = searchUrl();

    return (
        <div className="flex min-h-screen flex-col bg-background md:flex-row md:flex-wrap">
            <Head title="Trova il tuo trainer" />

            {/* Mobile header: logo and "Esci dal quiz". */}
            <header className="flex h-15 items-center justify-between bg-primary pr-2 pl-4 text-primary-foreground md:hidden">
                <BrandLogo className="text-primary-foreground" />
                <Link
                    href={exitHref}
                    aria-label="Esci dal quiz"
                    className="flex size-11 items-center justify-center rounded-lg"
                >
                    <X aria-hidden="true" className="size-5" />
                </Link>
            </header>

            <QuizAside
                step={step}
                answers={answers}
                zoneLabel={zoneLabel}
                onEdit={() => goTo(1)}
            />

            <main className="flex min-w-0 flex-1 flex-col md:flex-[999_1_560px] md:gap-7 md:px-14 md:pt-8 md:pb-10">
                <div className="hidden min-h-10 items-center gap-4 md:flex">
                    {typeof step === 'number' && (
                        <QuizProgress
                            step={step}
                            total={questions.length}
                            className="flex-1"
                        />
                    )}
                    <Link
                        href={exitHref}
                        className="ml-auto flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium"
                    >
                        Esci
                        <X aria-hidden="true" className="size-4" />
                    </Link>
                </div>

                {step === 'intro' && <QuizIntro onStart={() => goTo(1)} />}

                {typeof step === 'number' && (
                    <QuizQuestion
                        // A new component for each question: the zone search starts empty.
                        key={step}
                        step={step}
                        answers={answers}
                        zoneLabel={zoneLabel}
                        onChange={update}
                        onBack={back}
                        onNext={next}
                        processing={processing}
                    />
                )}

                {step === 'results' && results && (
                    <QuizResults
                        results={results}
                        answers={answers}
                        zoneLabel={zoneLabel}
                        onEdit={() => goTo(1)}
                        onRestart={restart}
                    />
                )}
            </main>
        </div>
    );
}
