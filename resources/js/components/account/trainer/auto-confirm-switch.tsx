import { router } from '@inertiajs/react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import TrainerAutoConfirmController from '@/actions/App/Http/Controllers/TrainerAutoConfirmController';
import { AreaSwitch } from '@/components/mp/area-bits';

/**
 * "Conferma automatica" in Impostazioni: the new requests are confirmed at
 * once. Saved at once (TrainerAutoConfirmController); "Disponibilità" has
 * the same switch among the booking rules.
 */
export default function AutoConfirmSwitch({ on }: { on: boolean }) {
    const labelId = useId();
    const noteId = useId();
    const [saving, setSaving] = useState(false);

    const toggle = () =>
        router.patch(
            TrainerAutoConfirmController.url(),
            { auto_confirm: !on },
            {
                preserveScroll: true,
                only: ['autoConfirm'],
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onError: () =>
                    toast.error('Non siamo riusciti a salvare. Riprova.'),
            },
        );

    return (
        <div className="flex min-h-16 items-center gap-3.5 border-b border-separator py-2.5">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <b
                    id={labelId}
                    className="text-[17px] leading-5.5 font-semibold"
                >
                    Conferma automatica
                </b>
                <span
                    id={noteId}
                    className="text-[15px] leading-5 text-muted-foreground"
                >
                    {on
                        ? 'Le nuove richieste si confermano da sole.'
                        : 'Senza risposta in tempo, la richiesta si annulla.'}
                </span>
            </span>
            <AreaSwitch
                checked={on}
                onToggle={toggle}
                disabled={saving}
                labelledBy={labelId}
                describedBy={noteId}
            />
        </div>
    );
}
