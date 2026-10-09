import { Check } from 'lucide-react';

const checks = [
    {
        title: 'Identità verificata',
        text: 'Controlliamo un documento prima di pubblicare il profilo.',
    },
    {
        title: 'Certificazioni controllate',
        text: 'Il nostro team guarda gli attestati caricati, che restano privati.',
    },
    {
        title: 'Recensioni vere',
        text: 'Le lascia solo chi ha svolto una seduta con quel trainer.',
    },
    {
        title: 'Profilo segnalabile',
        text: 'Se qualcosa non torna, ce lo dici con un clic e lo verifichiamo.',
    },
];

export default function TrainerVerification() {
    return (
        <section
            aria-labelledby="verification-title"
            className="mx-auto grid w-full max-w-7xl items-start gap-4 px-4 py-10 md:px-8 md:py-20 lg:grid-cols-2 lg:gap-10"
        >
            <div className="flex flex-col gap-2.5">
                <h2
                    id="verification-title"
                    className="text-2xl font-semibold tracking-tight md:text-3xl"
                >
                    Come verifichiamo i trainer
                </h2>
                <p className="hidden text-base text-muted-foreground md:block">
                    Ogni trainer viene approvato dal nostro team prima di
                    comparire nelle ricerche.
                </p>
            </div>
            <ul className="grid gap-3.5 sm:grid-cols-2 md:gap-5">
                {checks.map((check) => (
                    <li key={check.title} className="flex gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check aria-hidden="true" className="size-3.5" />
                        </span>
                        <span className="flex flex-col">
                            <span className="text-[15px] leading-[22px] font-semibold">
                                {check.title}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {check.text}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
