import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { register } from '@/routes/trainer';
import type { TrainerAreaData } from '@/types';

type ProfileStatusNoticeProps = TrainerAreaData['profile'] & {
    previewHref: string | null;
};

/**
 * At the top of every page of the trainer area until the team approves the
 * profile: until then it doesn't show up in the search.
 */
export default function ProfileStatusNotice({
    status,
    message,
    previewHref,
}: ProfileStatusNoticeProps) {
    if (status === 'approved') {
        return null;
    }

    const content = {
        missing: {
            title: 'Completa il tuo profilo',
            text: 'Finché non lo invii e il nostro team non lo approva, i clienti non ti trovano.',
        },
        review: {
            title: 'Il tuo profilo è in revisione',
            text: 'Non compare ancora nella ricerca. Ti scriviamo appena è online.',
        },
        changes: {
            title: 'Il nostro team ti chiede di sistemare il profilo',
            text: message ?? 'Correggi i punti indicati e invialo di nuovo.',
        },
        rejected: {
            title: 'Il tuo profilo non è stato approvato',
            text: message ?? 'Per domande scrivici dalla pagina Contatti.',
        },
    }[status];

    const action = status === 'missing' || status === 'changes';

    return (
        <section
            role="status"
            className="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-foreground bg-card px-4 py-3.5"
        >
            <span className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                <strong className="text-[15px]">{content.title}</strong>
                <span className="text-sm text-muted-foreground">
                    {content.text}
                </span>
            </span>
            <span className="flex flex-wrap gap-2">
                {previewHref && status !== 'missing' && (
                    <Button asChild variant="outline" className="h-10">
                        <Link href={previewHref}>Vedi l’anteprima</Link>
                    </Button>
                )}
                {action && (
                    <Button asChild className="h-10 font-semibold">
                        <Link href={register()}>
                            {status === 'missing'
                                ? 'Completa il profilo'
                                : 'Modifica il profilo'}
                        </Link>
                    </Button>
                )}
            </span>
        </section>
    );
}
