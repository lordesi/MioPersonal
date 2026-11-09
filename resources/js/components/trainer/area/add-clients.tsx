import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import TrainerClientRecordsController from '@/actions/App/Http/Controllers/TrainerClientRecordsController';
import FormField from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * "Aggiungi i tuoi clienti": the people the trainer already has, one per
 * line ("Nome Cognome, email o telefono"). Pasting a whole list works.
 * Each one gets a personal link to send.
 */
export default function AddClients({
    defaultOpen = false,
}: {
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [list, setList] = useState('');
    const [error, setError] = useState<string | undefined>();
    const [processing, setProcessing] = useState(false);

    if (!open) {
        return (
            <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl px-4 font-semibold"
                onClick={() => setOpen(true)}
            >
                <Plus />
                Aggiungi clienti
            </Button>
        );
    }

    const save = () =>
        router.post(
            TrainerClientRecordsController.store.url(),
            { list },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setList('');
                    setError(undefined);
                    setOpen(false);
                },
                onError: (errors) => setError(errors.list),
            },
        );

    return (
        <section
            aria-label="Aggiungi clienti"
            className="flex w-full flex-col gap-3 rounded-[20px] border bg-card p-5"
        >
            <FormField
                label="Aggiungi i tuoi clienti"
                error={error}
                hint="Uno per riga: «Nome Cognome, email o telefono». Il contatto è facoltativo. Puoi incollare un’intera lista."
            >
                {({ id, describedBy }) => (
                    <Textarea
                        id={id}
                        rows={5}
                        value={list}
                        placeholder={
                            'Marco Rossi, 333 1234567\nGiulia Bianchi, giulia@example.com\nLuca Verdi'
                        }
                        onChange={(event) => setList(event.target.value)}
                        aria-describedby={describedBy}
                        aria-invalid={!!error}
                        className="rounded-xl px-3.5 py-3 text-[15px] leading-5.5 md:text-[15px]"
                    />
                )}
            </FormField>
            <div className="flex flex-wrap justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl px-4"
                    onClick={() => setOpen(false)}
                >
                    Annulla
                </Button>
                <Button
                    type="button"
                    disabled={list.trim() === '' || processing}
                    className="h-11 rounded-xl px-4.5 font-semibold"
                    onClick={save}
                >
                    Aggiungi
                </Button>
            </div>
        </section>
    );
}
