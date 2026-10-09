import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import ResponsiveText from '@/components/shared/responsive-text';
import { show as quiz } from '@/routes/quiz';

export default function QuizBanner() {
    return (
        <section
            aria-labelledby="quiz-title"
            className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-8 md:pb-20"
        >
            <div className="flex flex-col gap-3 rounded-[18px] bg-primary p-5 text-primary-foreground md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-6 md:px-10 md:py-8">
                <div className="flex flex-col gap-3 md:gap-1.5">
                    <span className="text-xs font-semibold tracking-[0.08em] text-primary-foreground/70 uppercase">
                        Non sai da chi partire?
                    </span>
                    <h2
                        id="quiz-title"
                        className="text-2xl leading-[30px] font-bold tracking-tight md:text-3xl md:leading-9"
                    >
                        7 domande, 3 trainer adatti a te.
                    </h2>
                    <p className="text-sm text-primary-foreground/80 md:text-base">
                        <ResponsiveText
                            mobile="Obiettivo, orari, zona e budget: in un minuto."
                            desktop="Ti diciamo in un minuto chi fa per te."
                        />
                    </p>
                </div>
                <Link
                    href={quiz()}
                    className="flex h-12 items-center justify-center gap-2.5 rounded-lg bg-primary-foreground px-7 text-[15px] font-semibold text-primary md:h-13 md:text-base"
                >
                    Fai il quiz
                    <ArrowRight
                        aria-hidden="true"
                        className="hidden size-4.5 md:block"
                    />
                </Link>
            </div>
        </section>
    );
}
