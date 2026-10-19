const steps = [
    {
        title: 'Cerca',
        text: 'Filtra per disciplina, zona e modalità. Guardi profili, servizi e prezzi indicativi senza registrarti.',
    },
    {
        title: 'Richiedi una seduta',
        text: 'Scegli il servizio e proponi uno o due giorni con la fascia oraria. Ti registri solo in questo momento.',
    },
    {
        title: 'Allenati',
        text: 'Il trainer conferma e vi scambiate i contatti. Dopo la seduta puoi lasciare una recensione.',
    },
];

/** Three numbered steps: cards side by side on desktop, one under the other on mobile. */
export default function HowItWorks() {
    return (
        <section
            id="come-funziona"
            aria-labelledby="how-title"
            className="my-10 bg-secondary"
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:gap-8 md:px-8 md:py-18">
                <div className="flex flex-col gap-1.5">
                    <h2
                        id="how-title"
                        className="text-2xl font-semibold tracking-tight md:text-3xl"
                    >
                        Come funziona
                    </h2>
                    <p className="text-muted-foreground">
                        Dalla ricerca al primo allenamento, in tre passi.
                    </p>
                </div>
                <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3 md:gap-6">
                    {steps.map((step, index) => (
                        <li
                            key={step.title}
                            className="flex flex-col gap-3 rounded-xl border bg-card p-5 md:p-6"
                        >
                            <span className="flex items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground tabular-nums">
                                    {index + 1}
                                </span>
                                <h3 className="text-xl font-semibold tracking-tight">
                                    {step.title}
                                </h3>
                            </span>
                            <p className="text-[15px] leading-[22px] text-muted-foreground">
                                {step.text}
                            </p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
