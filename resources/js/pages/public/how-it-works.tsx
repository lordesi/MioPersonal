import { Head, Link } from '@inertiajs/react';
import FaqList from '@/components/seo/faq-list';
import type { FaqItem } from '@/components/seo/faq-list';
import { Button } from '@/components/ui/button';
import { searchUrl } from '@/lib/search';
import { home } from '@/routes';
import { register as trainerRegister } from '@/routes/trainer';

type HowItWorksProps = {
    /** "MioPersonal è la piattaforma italiana…" (App\Support\HowItWorks). */
    summary: string;
    /** The same answers as the FAQPage JSON-LD and /llms.txt. */
    faq: FaqItem[];
};

/**
 * "Come funziona": what MioPersonal is, in plain words. The page people,
 * search engines and AI assistants read when they ask about it.
 */
export default function HowItWorks({ summary, faq }: HowItWorksProps) {
    return (
        <div className="mx-auto flex w-full max-w-300 flex-col gap-8 px-4 pt-5 pb-10 md:gap-10 md:px-8 md:pt-10 md:pb-20">
            <Head title="Come funziona MioPersonal" />

            <div className="flex max-w-195 flex-col gap-6">
                <nav
                    aria-label="Percorso"
                    className="text-sm text-muted-foreground"
                >
                    <Link href={home()} className="hover:underline">
                        Home
                    </Link>{' '}
                    /{' '}
                    <span aria-current="page" className="text-foreground">
                        Come funziona
                    </span>
                </nav>

                <div className="flex flex-col gap-3">
                    <h1 className="text-3xl leading-9 font-bold tracking-tighter md:text-[44px] md:leading-12">
                        Come funziona MioPersonal
                    </h1>
                    <p className="text-lg text-muted-foreground">{summary}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        asChild
                        className="h-11 rounded-xl px-5 font-semibold"
                    >
                        <Link href={searchUrl()}>
                            Cerca un personal trainer
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 rounded-xl px-5 font-semibold"
                    >
                        <Link href={trainerRegister()}>Sei un trainer?</Link>
                    </Button>
                </div>
            </div>

            <FaqList items={faq} className="max-w-195" />
        </div>
    );
}
