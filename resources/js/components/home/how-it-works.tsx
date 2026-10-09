import { Dumbbell, Search, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ResponsiveText from '@/components/shared/responsive-text';

const steps: {
    icon: LucideIcon;
    title: string;
    mobile: string;
    desktop: string;
}[] = [
    {
        icon: Search,
        title: 'Cerca',
        mobile: 'Filtra per disciplina, zona e modalità. Guardi profili e prezzi senza registrarti.',
        desktop:
            'Filtra per disciplina, zona e modalità. Guardi profili, servizi e prezzi indicativi senza registrarti.',
    },
    {
        icon: Send,
        title: 'Richiedi una seduta',
        mobile: 'Scegli il servizio e proponi uno o due giorni. Ti registri solo ora.',
        desktop:
            'Scegli il servizio e proponi uno o due giorni con la fascia oraria. Ti registri solo in questo momento.',
    },
    {
        icon: Dumbbell,
        title: 'Allenati',
        mobile: 'Il trainer conferma e vi scambiate i contatti. Poi lasci una recensione.',
        desktop:
            'Il trainer conferma e vi scambiate i contatti. Dopo la seduta puoi lasciare una recensione.',
    },
];

/** Three steps: cards side by side on desktop, rows on mobile. */
export default function HowItWorks() {
    return (
        <section
            id="come-funziona"
            aria-labelledby="how-title"
            className="bg-secondary"
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 md:gap-8 md:px-8 md:py-20">
                <h2
                    id="how-title"
                    className="text-2xl font-semibold tracking-tight md:text-3xl"
                >
                    Come funziona
                </h2>
                <ol className="grid gap-3 md:grid-cols-3 md:gap-6">
                    {steps.map((step, index) => (
                        <li
                            key={step.title}
                            className="flex gap-3.5 rounded-xl border bg-card p-4 md:flex-col md:gap-3 md:p-6"
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <step.icon
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </span>
                            <div className="flex flex-col gap-1 md:gap-3">
                                <span className="hidden text-xs font-medium text-muted-foreground uppercase tabular-nums md:block">
                                    Passo {index + 1}
                                </span>
                                <h3 className="text-lg leading-7 font-semibold md:text-xl md:tracking-tight">
                                    <span className="md:hidden">
                                        {index + 1}.{' '}
                                    </span>
                                    {step.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    <ResponsiveText
                                        mobile={step.mobile}
                                        desktop={step.desktop}
                                    />
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
