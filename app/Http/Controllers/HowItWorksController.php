<?php

namespace App\Http\Controllers;

use App\Support\HowItWorks;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Come funziona": the answers to "cos'è MioPersonal?", for people, search
 * engines and AI assistants, with their FAQPage.
 */
class HowItWorksController extends Controller
{
    public function __invoke(): Response
    {
        $faq = HowItWorks::faq();

        return Inertia::render('public/how-it-works', [
            'summary' => HowItWorks::SUMMARY,
            'faq' => $faq,
            'seo' => Seo::page(
                title: 'Come funziona MioPersonal',
                description: HowItWorks::SUMMARY,
                jsonLd: [
                    Seo::faq($faq),
                    Seo::breadcrumbs(['Home' => route('home'), 'Come funziona' => route('how-it-works')]),
                ],
            ),
        ]);
    }
}
