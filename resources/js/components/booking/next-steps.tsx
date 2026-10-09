import { Check } from 'lucide-react';

type NextStepsProps = {
    trainerFirstName: string;
    confirmWithinHours: number;
};

/** "Cosa succede ora": the three steps after a booking request. The first one is already done. */
export default function NextSteps({
    trainerFirstName,
    confirmWithinHours,
}: NextStepsProps) {
    const steps = [
        {
            title: 'Slot riservato',
            text: `Nessun altro può prenotarlo mentre ${trainerFirstName} decide.`,
        },
        {
            title: `${trainerFirstName} conferma entro ${confirmWithinHours} ore`,
            text: "Ricevi un'email con indirizzo e contatti.",
        },
        {
            title: 'Promemoria il giorno prima',
            text: 'Dopo la seduta potrai lasciare una recensione.',
        },
    ];

    return (
        <section
            aria-labelledby="cosa-succede-ora"
            className="flex flex-col gap-3 rounded-[14px] border bg-card p-4.5"
        >
            <h2
                id="cosa-succede-ora"
                className="text-lg leading-[26px] font-semibold tracking-tight"
            >
                Cosa succede ora
            </h2>
            <ol className="flex flex-col gap-3">
                {steps.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                        {index === 0 ? (
                            <span className="flex size-7 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check
                                    aria-label="fatto"
                                    className="size-3.5"
                                    strokeWidth={2.5}
                                />
                            </span>
                        ) : (
                            <span className="flex size-7 flex-none items-center justify-center rounded-full border border-input text-xs font-semibold tabular-nums">
                                {index + 1}
                            </span>
                        )}
                        <span className="flex flex-col text-sm">
                            <span className="font-semibold">{step.title}</span>
                            <span className="text-muted-foreground">
                                {step.text}
                            </span>
                        </span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
