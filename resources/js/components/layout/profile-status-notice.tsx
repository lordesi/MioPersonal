import { Link } from '@inertiajs/react';
import { CircleAlert, Clock, PencilLine } from 'lucide-react';
import {
    brandButtonClassName,
    softButtonClassName,
} from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';
import { register } from '@/routes/trainer';
import type { TrainerAreaData } from '@/types';

type ProfileStatusNoticeProps = TrainerAreaData['profile'] & {
    previewHref: string | null;
};

/**
 * At the top of every page of the trainer area until the team approves the
 * profile: until then it doesn't show up in the search. A dark card with
 * the turquoise outline, as the rest of the new trainer area.
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
            icon: PencilLine,
            title: 'Completa il tuo profilo',
            text: 'Finché non lo invii e il nostro team non lo approva, i clienti non ti trovano.',
        },
        review: {
            icon: Clock,
            title: 'Il tuo profilo è in revisione',
            text: 'Non compare ancora nella ricerca. Ti scriviamo appena è online.',
        },
        changes: {
            icon: CircleAlert,
            title: 'Il nostro team ti chiede di sistemare il profilo',
            text: message ?? 'Correggi i punti indicati e invialo di nuovo.',
        },
        rejected: {
            icon: CircleAlert,
            title: 'Il tuo profilo non è stato approvato',
            text: message ?? 'Per domande scrivici dalla pagina Contatti.',
        },
    }[status];

    const action = status === 'missing' || status === 'changes';
    const Icon = content.icon;

    return (
        <section
            role="status"
            className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[22px] bg-[#121212] p-4 shadow-[inset_0_0_0_1.5px_#42d7d9]"
        >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
                <strong className="text-[17px] leading-5.5 font-semibold">
                    {content.title}
                </strong>
                <span className="text-[13px] leading-4.5 text-muted-foreground">
                    {content.text}
                </span>
            </span>
            <span className="flex flex-wrap gap-2">
                {previewHref && status !== 'missing' && (
                    <a href={previewHref} className={softButtonClassName}>
                        Vedi l’anteprima
                    </a>
                )}
                {action && (
                    <Link
                        href={register()}
                        className={cn(brandButtonClassName, 'h-10')}
                    >
                        {status === 'missing'
                            ? 'Completa il profilo'
                            : 'Modifica il profilo'}
                    </Link>
                )}
            </span>
        </section>
    );
}
