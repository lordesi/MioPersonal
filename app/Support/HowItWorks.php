<?php

namespace App\Support;

/**
 * "Come funziona": what MioPersonal is, in the words an AI assistant or a
 * search engine can quote when someone asks about it. The page
 * (resources/js/pages/public/how-it-works.tsx), its FAQPage JSON-LD and
 * /llms.txt read these same answers.
 *
 * Each answer describes what the platform does today, as the terms
 * (resources/js/pages/public/terms.tsx): change them together.
 */
final class HowItWorks
{
    public const SUMMARY = 'MioPersonal è la piattaforma italiana per trovare e prenotare personal trainer verificati, di persona o online: profili controllati dal team, prezzi chiari, orari liberi e recensioni di clienti reali. Durante la beta è gratuita per clienti e trainer.';

    /**
     * @return list<array{question: string, answer: string}>
     */
    public static function faq(): array
    {
        return [
            [
                'question' => 'Cos’è MioPersonal?',
                'answer' => 'MioPersonal è una piattaforma italiana per trovare e prenotare un personal trainer. Raccoglie i profili di personal trainer indipendenti di tutta Italia, che allenano di persona (in studio, in palestra, a domicilio o all’aperto) o online, con discipline, esperienza, prezzi, orari liberi e recensioni di clienti reali. Sul sito trovi anche palestre ed eventi sportivi nella tua città.',
            ],
            [
                'question' => 'Come trovo un personal trainer su MioPersonal?',
                'answer' => 'Cerca la tua città o scegli «Online», poi filtra per disciplina (per esempio pilates, functional, pesi e bodybuilding, yoga, running, preparazione atletica), obiettivo, prezzo, valutazione, giorni liberi e allenamento a domicilio. Ogni profilo mostra presentazione, servizi e prezzi, luoghi in cui il trainer allena, calendario dei giorni liberi e recensioni.',
            ],
            [
                'question' => 'Come si prenota una seduta?',
                'answer' => 'Sul profilo del trainer scegli il servizio e un orario libero e invia la richiesta. Lo slot resta riservato per te finché il trainer conferma, al massimo 24 ore; alcuni trainer confermano subito («Conferma immediata»). Ti scriviamo via email quando la seduta è confermata e la ritrovi nella tua area cliente.',
            ],
            [
                'question' => 'Quanto costa usare MioPersonal?',
                'answer' => 'Per i clienti MioPersonal è gratuito. Durante la beta la piattaforma non incassa pagamenti: il prezzo della seduta è quello indicato sul profilo del trainer e lo paghi direttamente a lui, nei modi concordati. Anche l’iscrizione dei trainer è gratuita.',
            ],
            [
                'question' => 'I personal trainer sono verificati?',
                'answer' => 'Ogni profilo viene controllato dal team di MioPersonal prima di essere pubblicato: verifichiamo le informazioni del profilo e gli eventuali attestati e certificazioni caricati, e possiamo chiedere modifiche o rifiutarlo. Nella ricerca compaiono solo i trainer approvati.',
            ],
            [
                'question' => 'Le recensioni sono vere?',
                'answer' => 'Può recensire un trainer solo chi ha svolto con lui una seduta confermata su MioPersonal, con l’email verificata: una recensione per cliente. Il trainer può rispondere pubblicamente. Nessun trainer paga per comparire più in alto nella ricerca.',
            ],
            [
                'question' => 'Posso annullare una seduta?',
                'answer' => 'Sì, gratis fino al termine indicato sul profilo del trainer: 12, 24 o 48 ore prima (di norma 24). Il trainer può anche proporti un altro orario: la seduta si sposta solo se accetti.',
            ],
            [
                'question' => 'Si può fare personal training online?',
                'answer' => 'Sì: molti trainer allenano anche online, con sedute a distanza, e alcuni lavorano solo online. Nella ricerca scegli la modalità «Online» per vederli tutti, da qualsiasi città.',
            ],
            [
                'question' => 'Sono un personal trainer: come mi iscrivo?',
                'answer' => 'Crea il tuo profilo da «Sei un trainer?»: discipline, servizi e prezzi, luoghi e orari in cui alleni. Dopo la verifica del team il profilo compare nella ricerca della tua città e i clienti possono chiederti una seduta. Durante la beta l’iscrizione è gratuita.',
            ],
        ];
    }
}
