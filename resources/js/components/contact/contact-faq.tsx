import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

const questions = [
    {
        question: 'Quanto costa usare MioPersonal?',
        answer: 'Durante la beta è gratuito per clienti e trainer. Il prezzo della seduta lo concordi direttamente con il trainer.',
    },
    {
        question: 'Come annullo una prenotazione?',
        answer: 'Da «Le mie prenotazioni»: è gratis fino al termine indicato dal trainer, di solito 24 ore prima.',
    },
    {
        question: 'Come diventa visibile il mio profilo da trainer?',
        answer: 'Dopo la registrazione il nostro team verifica identità e certificazioni, poi lo pubblica e ti avvisa via email.',
    },
    {
        question: 'Come cancello il mio account e i miei dati?',
        answer: 'Scrivici da questa pagina scegliendo «Privacy e dati»: lo facciamo entro 30 giorni.',
    },
];

/** "Prima di scriverci": answers to the most common questions. */
export default function ContactFaq() {
    const titleId = useId();

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-2.5">
            <h2 id={titleId} className="text-xl font-semibold tracking-tight">
                Prima di scriverci
            </h2>
            {questions.map((item) => (
                <Collapsible
                    key={item.question}
                    className="group rounded-xl border bg-card"
                >
                    <CollapsibleTrigger className="flex min-h-13 w-full items-center justify-between gap-3 px-3.5 text-left text-[15px] font-semibold">
                        {item.question}
                        <ChevronDown
                            aria-hidden="true"
                            className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                        />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <p className="px-3.5 pb-3.5 text-sm leading-5.25 text-muted-foreground">
                            {item.answer}
                        </p>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </section>
    );
}
