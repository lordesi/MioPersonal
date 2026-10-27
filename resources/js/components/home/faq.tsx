import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { show as contactPage } from '@/routes/contact';

const questions = [
    {
        question: 'Quanto costa usare MioPersonal?',
        answer: 'Tutte le funzionalità attualmente presenti su MioPersonal sono gratuite.',
    },
    {
        question: 'Devo registrarmi per cercare un trainer?',
        answer: 'Registrarsi non è necessario per cercare e confrontare trainer. Ti registri solo nel momento in cui invii la prima richiesta di seduta.',
    },
    {
        question: 'Come prenoto una seduta?',
        answer: 'Una volta trovato il trainer migliore per te, scegli uno dei servizi offerti e prenota la seduta. Il trainer ha 24 ore per confermare la prenotazione.',
    },
    {
        question: 'Come vengono verificati i trainer?',
        answer: 'Il nostro team verifica e approva ogni profilo dopo aver controllato le informazioni indicate dai trainer.',
    },
];

/** "Domande frequenti": one answer open at a time, the first one at the start. */
export default function Faq() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section
            id="faq"
            aria-labelledby="faq-title"
            className="mx-auto grid w-full max-w-7xl grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-6 px-4 pb-10 md:gap-10 md:px-8 md:pb-20"
        >
            <div className="flex flex-col gap-2.5">
                <h2
                    id="faq-title"
                    className="text-2xl font-semibold tracking-tight md:text-3xl"
                >
                    Domande frequenti
                </h2>
                <p className="text-muted-foreground">
                    Hai altre domande?{' '}
                    <Link
                        href={contactPage()}
                        className="text-foreground underline underline-offset-2"
                    >
                        Scrivici
                    </Link>
                    .
                </p>
            </div>

            <div className="flex flex-col border-t">
                {questions.map((item, index) => (
                    <Collapsible
                        key={item.question}
                        open={openIndex === index}
                        onOpenChange={(open) =>
                            setOpenIndex(open ? index : null)
                        }
                        className="border-b"
                    >
                        <h3>
                            <CollapsibleTrigger className="group flex min-h-15 w-full items-center justify-between gap-4 py-3.5 text-left font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                                {item.question}
                                <ChevronDown
                                    aria-hidden="true"
                                    className="size-4.5 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                                />
                            </CollapsibleTrigger>
                        </h3>
                        <CollapsibleContent>
                            <p className="pr-8 pb-4.5 text-[15px] leading-[22px] text-muted-foreground">
                                {item.answer}
                            </p>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </div>
        </section>
    );
}
