import { Link } from '@inertiajs/react';
import { ArrowRight, Check } from 'lucide-react';
import ResponsiveText from '@/components/shared/responsive-text';

// TODO: point to the trainer registration and info pages once they exist.
const REGISTER_TRAINER_HREF = '#';
const LEARN_MORE_HREF = '#';

const benefits = [
    {
        mobile: 'Profilo trovabile anche su Google',
        desktop: 'Profilo pubblico, trovabile anche su Google',
    },
    {
        mobile: 'Accetti o rifiuti ogni richiesta',
        desktop: 'Accetti o rifiuti ogni richiesta, decidi tu',
    },
    {
        mobile: 'Nessuna commissione sulle sedute',
        desktop: 'Nessuna commissione sulle sedute',
    },
];

export default function ForTrainers() {
    return (
        <section
            id="per-i-trainer"
            aria-labelledby="for-trainers-title"
            className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-8 md:pb-20"
        >
            <div className="grid items-center gap-4 rounded-xl bg-primary p-6 text-primary-foreground md:p-12 lg:grid-cols-2 lg:gap-10">
                <div className="flex flex-col gap-4">
                    <span className="text-xs font-medium text-primary-foreground/70 uppercase">
                        Per i personal trainer
                    </span>
                    <h2
                        id="for-trainers-title"
                        className="text-2xl font-bold tracking-tight md:text-4xl md:leading-10"
                    >
                        Nuovi clienti nella tua zona, senza costi.
                    </h2>
                    <p className="text-base text-primary-foreground/80 md:text-lg md:leading-7">
                        <ResponsiveText
                            mobile="Crea il tuo profilo e ricevi le richieste di seduta via email. Durante la beta è tutto gratuito."
                            desktop="Crea il tuo profilo, indica discipline, zone e servizi, e ricevi le richieste di seduta."
                        />
                    </p>
                </div>
                <div className="flex flex-col gap-4 md:gap-5">
                    <ul className="flex flex-col gap-2.5 text-sm md:gap-3">
                        {benefits.map((benefit) => (
                            <li
                                key={benefit.desktop}
                                className="flex items-center gap-2.5"
                            >
                                <Check
                                    aria-hidden="true"
                                    className="size-4 shrink-0"
                                />
                                <ResponsiveText
                                    mobile={benefit.mobile}
                                    desktop={benefit.desktop}
                                />
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                        <Link
                            href={REGISTER_TRAINER_HREF}
                            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-foreground px-6 text-sm font-medium text-primary"
                        >
                            Crea il tuo profilo gratis
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                        <Link
                            href={LEARN_MORE_HREF}
                            className="hidden h-11 items-center justify-center rounded-lg border border-current px-6 text-sm font-medium md:flex"
                        >
                            Scopri di più
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
