import TrainerMiniCard from '@/components/trainer/trainer-mini-card';
import type { TrainerProfile } from '@/types';

// TODO: point to the report form once it exists.
const REPORT_HREF = '#';

/** Similar trainers (grid on desktop, carousel on mobile) and the report link. */
export default function SimilarTrainers({
    trainers,
}: {
    trainers: TrainerProfile['similarTrainers'];
}) {
    return (
        <section
            aria-labelledby="similar-title"
            className="flex flex-col gap-3"
        >
            <h2
                id="similar-title"
                className="text-xl font-semibold tracking-tight md:text-2xl"
            >
                Trainer simili
            </h2>
            <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] md:gap-3 md:px-0">
                {trainers.map((trainer) => (
                    <TrainerMiniCard
                        key={trainer.name}
                        name={trainer.name}
                        href={trainer.href}
                        subtitle={trainer.subtitle}
                        detail={trainer.detail}
                        className="w-62.5 shrink-0 md:w-auto"
                    />
                ))}
            </div>
            <a
                href={REPORT_HREF}
                className="inline-flex min-h-8 self-start text-[13px] text-muted-foreground underline md:text-sm"
            >
                Segnala questo profilo
            </a>
        </section>
    );
}
