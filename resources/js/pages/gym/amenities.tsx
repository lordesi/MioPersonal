import { Head, Link, router } from '@inertiajs/react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import InputError from '@/components/input-error';
import PageHeading from '@/components/trainer/area/page-heading';
import Panel from '@/components/trainer/area/panel';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/gym/amenities';
import photo from '@/routes/gym/amenities/photo';
import { edit as editProfile } from '@/routes/gym/profile';

type Amenity = {
    value: string;
    label: string;
    description: string;
    photoUrl: string | null;
};

type GymAmenitiesProps = {
    /** The services ticked in the profile. */
    amenities: Amenity[];
    descriptionMax: number;
};

/**
 * "Servizi": a description and a photo for each service ticked in the
 * profile (e.g. the Turkish bath). Each card is saved on its own, public at once.
 */
export default function GymAmenities({
    amenities,
    descriptionMax,
}: GymAmenitiesProps) {
    return (
        <>
            <Head title="Servizi" />

            <PageHeading
                title="Servizi"
                description="Racconta i tuoi servizi con una foto e due righe: compaiono sul profilo pubblico."
            />

            {amenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Scegli prima i servizi in{' '}
                    <Link
                        href={editProfile()}
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        Modifica profilo
                    </Link>
                    .
                </p>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {amenities.map((amenity) => (
                        <AmenityCard
                            key={amenity.value}
                            amenity={amenity}
                            descriptionMax={descriptionMax}
                        />
                    ))}
                </div>
            )}

            <p className="text-sm text-muted-foreground">
                Per aggiungere o togliere un servizio vai in{' '}
                <Link
                    href={editProfile()}
                    className="font-medium text-foreground underline underline-offset-4"
                >
                    Modifica profilo
                </Link>
                : togliendolo, anche la sua foto e la descrizione vengono
                eliminate.
            </p>
        </>
    );
}

function AmenityCard({
    amenity,
    descriptionMax,
}: {
    amenity: Amenity;
    descriptionMax: number;
}) {
    const inputId = useId();
    const textId = useId();
    const [description, setDescription] = useState(amenity.description);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const changed = description !== amenity.description || file !== null;
    const shownPhoto = preview ?? amenity.photoUrl;

    const choose = (next: File | null) => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setFile(next);
        setPreview(next ? URL.createObjectURL(next) : null);
    };

    const save = (event: React.FormEvent) => {
        event.preventDefault();

        router.post(
            update.url(amenity.value),
            { description, ...(file ? { photo: file } : {}) },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onSuccess: () => {
                    choose(null);
                    setErrors({});
                },
                onError: (next) => setErrors(next as Record<string, string>),
            },
        );
    };

    const removePhoto = () => {
        if (file) {
            choose(null);

            return;
        }

        router.delete(photo.destroy.url(amenity.value), {
            preserveScroll: true,
        });
    };

    return (
        <Panel title={amenity.label}>
            <form onSubmit={save} className="flex flex-col gap-3">
                {shownPhoto ? (
                    <div className="relative overflow-hidden rounded-2xl">
                        <img
                            src={shownPhoto}
                            alt={amenity.label}
                            className="aspect-16/9 w-full object-cover"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            aria-label={`Togli la foto di ${amenity.label}`}
                            onClick={removePhoto}
                            className="absolute right-2 bottom-2 size-8"
                        >
                            <Trash2 aria-hidden="true" />
                        </Button>
                    </div>
                ) : (
                    <label
                        htmlFor={inputId}
                        className="flex aspect-16/9 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-muted/40 text-sm text-muted-foreground hover:bg-muted"
                    >
                        <ImagePlus aria-hidden="true" className="size-6" />
                        Aggiungi una foto (JPG o PNG, almeno 800 × 500 px)
                    </label>
                )}
                {shownPhoto && (
                    <label
                        htmlFor={inputId}
                        className="cursor-pointer self-start text-sm font-medium underline underline-offset-4"
                    >
                        Cambia foto
                    </label>
                )}
                <input
                    id={inputId}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(event) => {
                        choose(event.target.files?.[0] ?? null);
                        event.target.value = '';
                    }}
                />
                <InputError message={errors.photo} />

                <label htmlFor={textId} className="text-sm font-medium">
                    Descrizione
                </label>
                <Textarea
                    id={textId}
                    rows={4}
                    maxLength={descriptionMax}
                    placeholder={`Es. ${amenity.label}: com’è, quando si può usare, se è incluso nell’abbonamento.`}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {description.length} / {descriptionMax}
                    </span>
                    <Button type="submit" disabled={!changed || saving}>
                        {saving && <Spinner />}
                        Salva
                    </Button>
                </div>
                <InputError message={errors.description} />
            </form>
        </Panel>
    );
}

GymAmenities.layout = { section: 'amenities' };
