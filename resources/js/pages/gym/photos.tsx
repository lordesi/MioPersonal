import { Head, Link, router } from '@inertiajs/react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import InputError from '@/components/input-error';
import Panel from '@/components/trainer/area/panel';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cover, destroy, store } from '@/routes/gym/photos';
import { edit as editProfile } from '@/routes/gym/profile';

type GymPhotosProps = {
    cover: string | null;
    photos: { id: number; url: string }[];
    max: number;
};

/** "Foto": the cover and the gallery, each change public at once. */
export default function GymPhotos({
    cover: coverUrl,
    photos,
    max,
}: GymPhotosProps) {
    const inputId = useId();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const room = max - photos.length;

    const upload = (files: File[]) => {
        if (files.length === 0) {
            return;
        }

        router.post(
            store.url(),
            { photos: files },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setUploading(true),
                onFinish: () => setUploading(false),
                onSuccess: () => setError(undefined),
                onError: (errors) =>
                    setError(Object.values(errors)[0] as string | undefined),
            },
        );
    };

    return (
        <>
            <Head title="Foto" />

            <PageHeading
                title="Foto"
                description={`La copertina e fino a ${max} foto nella galleria.`}
            />

            <Panel
                title="Copertina"
                action={
                    <Link
                        href={editProfile()}
                        className="text-sm font-medium underline underline-offset-4"
                    >
                        Cambia da “Modifica profilo”
                    </Link>
                }
            >
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt="Copertina della palestra"
                        className="aspect-[16/7] w-full rounded-2xl object-cover"
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Nessuna copertina: aggiungila da “Modifica profilo”.
                    </p>
                )}
            </Panel>

            <Panel
                title={`Galleria · ${photos.length} di ${max}`}
                action={
                    room > 0 ? (
                        <>
                            <Button asChild disabled={uploading}>
                                <label
                                    htmlFor={inputId}
                                    className="cursor-pointer"
                                >
                                    {uploading ? (
                                        <Spinner />
                                    ) : (
                                        <ImagePlus aria-hidden="true" />
                                    )}
                                    Aggiungi foto
                                </label>
                            </Button>
                            <input
                                id={inputId}
                                type="file"
                                multiple
                                accept="image/jpeg,image/png"
                                className="sr-only"
                                onChange={(event) => {
                                    upload(
                                        Array.from(
                                            event.target.files ?? [],
                                        ).slice(0, room),
                                    );
                                    event.target.value = '';
                                }}
                            />
                        </>
                    ) : undefined
                }
            >
                <InputError message={error} />
                {photos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Sala pesi, corsi, spogliatoi, ingresso: le palestre con
                        più foto ricevono più visite.
                    </p>
                ) : (
                    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {photos.map((photo, index) => (
                            <li
                                key={photo.id}
                                className="group relative overflow-hidden rounded-2xl"
                            >
                                <img
                                    src={photo.url}
                                    alt={`Foto ${index + 1}`}
                                    className="aspect-4/3 w-full object-cover"
                                />
                                <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() =>
                                            router.post(
                                                cover.url(photo.id),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Star aria-hidden="true" />
                                        Copertina
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        aria-label={`Elimina la foto ${index + 1}`}
                                        onClick={() =>
                                            router.delete(
                                                destroy.url(photo.id),
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="size-8"
                                    >
                                        <Trash2 aria-hidden="true" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </>
    );
}

GymPhotos.layout = { section: 'photos' };
