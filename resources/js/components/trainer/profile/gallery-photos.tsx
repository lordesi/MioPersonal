import { router } from '@inertiajs/react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import TrainerPhotoController from '@/actions/App/Http/Controllers/TrainerPhotoController';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { shrinkImage } from '@/lib/image';

export type GalleryPhoto = { id: number; url: string };

type GalleryPhotosProps = {
    photos: GalleryPhoto[];
    /** TrainerProfile::MAX_GALLERY_PHOTOS */
    max: number;
};

/**
 * "Foto della galleria": the photos of the carousel after the profile
 * photo. Each action (add, delete) is saved right away by
 * TrainerPhotoController, not with "Salva modifiche".
 */
export default function GalleryPhotos({ photos, max }: GalleryPhotosProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const room = max - photos.length;

    const showFirstError = (errors: Record<string, string>) =>
        setMessage(Object.values(errors)[0] ?? 'Riprova tra poco.');

    const add = async (list: FileList | null) => {
        const chosen = Array.from(list ?? []);

        if (chosen.length === 0) {
            return;
        }

        setUploading(true);
        setMessage(
            chosen.length > room
                ? `Puoi aggiungere ancora ${room} foto: carichiamo le prime ${room}.`
                : null,
        );

        // Smaller files: faster upload, lighter profile page.
        const files = await Promise.all(
            chosen.slice(0, room).map((file) => shrinkImage(file)),
        );

        router.post(
            TrainerPhotoController.store.url(),
            { photos: files },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: showFirstError,
                onFinish: () => setUploading(false),
            },
        );
    };

    const remove = (photo: GalleryPhoto) =>
        router.delete(TrainerPhotoController.destroy.url(photo.id), {
            preserveScroll: true,
            onError: showFirstError,
        });

    return (
        <section
            aria-labelledby="gallery-title"
            className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:p-5"
        >
            <h2 id="gallery-title" className="text-lg font-semibold">
                Foto della galleria{' '}
                <span className="text-sm font-normal text-muted-foreground tabular-nums">
                    {photos.length} di {max}
                </span>
            </h2>

            {message && (
                <p role="alert" className="text-sm text-destructive">
                    {message}
                </p>
            )}

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo, index) => (
                    <li
                        key={photo.id}
                        className="relative aspect-4/3 overflow-hidden rounded-lg border bg-muted"
                    >
                        <img
                            src={photo.url}
                            alt={`Foto ${index + 1} della galleria`}
                            className="size-full object-cover"
                        />
                        {/* Deleted right away, without asking: it's only a gallery photo. */}
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            aria-label={`Elimina la foto ${index + 1}`}
                            onClick={() => remove(photo)}
                            className="absolute right-2 bottom-2 size-8 rounded-full shadow-sm"
                        >
                            <Trash2 />
                        </Button>
                    </li>
                ))}

                {room > 0 && (
                    <li>
                        {/* Hidden: the button below opens it. */}
                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/jpeg,image/png"
                            multiple
                            className="hidden"
                            onChange={(event) => {
                                void add(event.target.files);
                                // The same file can be chosen again after an error.
                                event.target.value = '';
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            disabled={uploading}
                            onClick={() => fileInput.current?.click()}
                            className="flex aspect-4/3 h-auto w-full flex-col gap-2 rounded-lg border-dashed text-muted-foreground"
                        >
                            {uploading ? (
                                <Spinner />
                            ) : (
                                <ImagePlus
                                    aria-hidden="true"
                                    className="size-6"
                                />
                            )}
                            {uploading ? 'Caricamento…' : 'Aggiungi foto'}
                        </Button>
                    </li>
                )}
            </ul>

            <p className="text-xs text-muted-foreground">
                JPG o PNG, almeno 800 × 500 px. Puoi sceglierne più di una
                insieme.
            </p>
        </section>
    );
}
