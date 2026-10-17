import TrainerMiniCard from '@/components/trainer/trainer-mini-card';
import type { TrainerProfile } from '@/types';

/** Similar trainers (grid on desktop, carousel on mobile); hidden without any. */
export default function SimilarTrainers({
    trainers,
}: {
    trainers: TrainerProfile['similarTrainers'];
}) {
    if (trainers.length === 0) {
        return null;
    }

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
                        key={trainer.href}
                        name={trainer.name}
                        href={trainer.href}
                        subtitle={trainer.subtitle}
                        detail={trainer.detail}
                        className="w-62.5 shrink-0 md:w-auto"
                    />
                ))}
            </div>
        </section>
    );
}
