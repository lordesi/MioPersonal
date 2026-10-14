import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import AdminCityController from '@/actions/App/Http/Controllers/Admin/AdminCityController';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AdminCity } from '@/types';

type CityDialogProps = {
    /** Leave it out to add a new city. */
    city?: AdminCity;
    /** The 20 regions, for the menu. */
    regions: string[];
    /** The button that opens the window. */
    trigger: ReactNode;
};

/** "+ Aggiungi" and "Modifica" of a city, saved on the server. */
export default function CityDialog({
    city,
    regions,
    trigger,
}: CityDialogProps) {
    const [open, setOpen] = useState(false);
    const [region, setRegion] = useState('');
    const [active, setActive] = useState(true);

    const action = city
        ? AdminCityController.update.form(city.id)
        : AdminCityController.store.form();

    // Every time it opens it starts from the saved values.
    const changeOpen = (next: boolean) => {
        setOpen(next);

        if (next) {
            setRegion(city?.region ?? '');
            setActive(city?.isActive ?? true);
        }
    };

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {city ? `Modifica ${city.name}` : 'Nuova città'}
                    </DialogTitle>
                    <DialogDescription>
                        {city
                            ? `Indirizzo della ricerca: /personal-trainer/${city.slug} (non cambia se rinomini la città).`
                            : 'Compare nelle tendine della ricerca e della registrazione.'}
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
                                        defaultValue={city?.name}
                                        required
                                        maxLength={100}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.name}
                                        className="h-11 text-base md:text-base"
                                    />
                                )}
                            </FormField>

                            <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                                <FormField
                                    label="Provincia"
                                    hint="Sigla, es. MI"
                                    error={errors.province_code}
                                >
                                    {({ id, describedBy }) => (
                                        <Input
                                            id={id}
                                            name="province_code"
                                            defaultValue={city?.provinceCode}
                                            required
                                            maxLength={2}
                                            aria-describedby={describedBy}
                                            aria-invalid={
                                                !!errors.province_code
                                            }
                                            className="h-11 text-base uppercase md:text-base"
                                        />
                                    )}
                                </FormField>
                                <FormField
                                    label="Regione"
                                    error={errors.region}
                                >
                                    {({ id, describedBy }) => (
                                        <Select
                                            value={region}
                                            onValueChange={setRegion}
                                        >
                                            <SelectTrigger
                                                id={id}
                                                aria-describedby={describedBy}
                                                aria-invalid={!!errors.region}
                                                className="w-full bg-background data-[size=default]:h-11"
                                            >
                                                <SelectValue placeholder="Scegli la regione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {regions.map((name) => (
                                                    <SelectItem
                                                        key={name}
                                                        value={name}
                                                    >
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </FormField>
                                {/* The menu is a button: this input sends the choice. */}
                                <input
                                    type="hidden"
                                    name="region"
                                    value={region}
                                />
                            </div>

                            <FormField
                                label="Coordinate"
                                hint="Su Google Maps: tasto destro sulla città, poi clicca le coordinate per copiarle e incollale qui."
                                error={errors.coordinates}
                            >
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        name="coordinates"
                                        defaultValue={city?.coordinates}
                                        required
                                        placeholder="45.4642, 9.1900"
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.coordinates}
                                        className="h-11 text-base tabular-nums md:text-base"
                                    />
                                )}
                            </FormField>

                            {city && (
                                <>
                                    <SwitchRow
                                        label="Visibile"
                                        description="Se la nascondi, sparisce dalle tendine e la sua pagina di ricerca non esiste più."
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
                                    {city ? 'Salva' : 'Aggiungi'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
