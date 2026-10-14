import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import AdminDisciplineController from '@/actions/App/Http/Controllers/Admin/AdminDisciplineController';
import FormField from '@/components/auth/form-field';
import SwitchRow from '@/components/shared/switch-row';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { AdminDiscipline } from '@/types';

type DisciplineDialogProps = {
    /** Leave it out to add a new discipline. */
    discipline?: AdminDiscipline;
    /** The button that opens the window. */
    trigger: ReactNode;
};

/** "+ Aggiungi" and "Modifica" of a discipline, saved on the server. */
export default function DisciplineDialog({
    discipline,
    trigger,
}: DisciplineDialogProps) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(true);

    const action = discipline
        ? AdminDisciplineController.update.form(discipline.id)
        : AdminDisciplineController.store.form();

    // Every time it opens it starts from the saved values.
    const changeOpen = (next: boolean) => {
        setOpen(next);

        if (next) {
            setActive(discipline?.isActive ?? true);
        }
    };

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {discipline
                            ? 'Modifica disciplina'
                            : 'Nuova disciplina'}
                    </DialogTitle>
                    <DialogDescription>
                        Compare nei filtri della ricerca e nella registrazione
                        dei trainer.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...action}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="flex flex-col gap-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <FormField label="Nome" error={errors.name}>
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        name="name"
                                        defaultValue={discipline?.name}
                                        required
                                        maxLength={100}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.name}
                                        className="h-11 text-base md:text-base"
                                    />
                                )}
                            </FormField>

                            {discipline && (
                                <>
                                    <SwitchRow
                                        label="Visibile"
                                        description="Se la nascondi, sparisce da ricerca e registrazione. I trainer che la usano la tengono."
                                        checked={active}
                                        onCheckedChange={setActive}
                                    />
                                    <input
                                        type="hidden"
                                        name="is_active"
                                        value={active ? '1' : '0'}
                                    />
                                </>
                            )}

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Annulla
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="font-semibold"
                                >
                                    {discipline ? 'Salva' : 'Aggiungi'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
