import { Award } from 'lucide-react';
import type { TrainerProfile } from '@/types';

export default function Certifications({
    certifications,
}: {
    certifications: TrainerProfile['certifications'];
}) {
    return (
        <section
            aria-labelledby="certifications-title"
            className="flex flex-col gap-3 md:gap-4"
        >
            <h2
                id="certifications-title"
                className="text-xl font-semibold tracking-tight md:text-2xl"
            >
                Certificazioni
            </h2>
            <ul className="flex flex-col gap-3">
                {certifications.map((certification) => (
                    <li
                        key={certification.title}
                        className="flex items-start gap-3"
                    >
                        <Award
                            aria-hidden="true"
                            className="size-4.5 shrink-0 md:size-5"
                        />
                        <span className="flex flex-col">
                            <span className="text-sm font-semibold md:text-base">
                                {certification.title}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {certification.issuer}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
