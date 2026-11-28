import { router } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import TrainerPhotoController from '@/actions/App/Http/Controllers/TrainerPhotoController';
import { Section } from '@/components/onboarding/dark-fields';
import { Counter } from '@/components/onboarding/trainer/dark-bits';
import { Spinner } from '@/components/ui/spinner';
import { shrinkImage } from '@/lib/image';

export type GalleryPhoto = { id: number; url: string };

type GalleryPhotosProps = {
    photos: GalleryPhoto[];
    /** TrainerProfile::MAX_GALLERY_PHOTOS */
    max: number;
    /** The title only for screen readers: a section around it shows it. */
    hideTitle?: boolean;
};

/**
 * "Foto della galleria" (section 2 of "Modifica profilo"): the photos of the
 * carousel after the profile photo. Each action (add, delete) is saved right
 * away by TrainerPhotoController, not with "Salva modifiche".
 */
export default function GalleryPhotos({
    photos,
    max,
    hideTitle = false,
}: GalleryPhotosProps) {
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
        <Section
            title="Foto della galleria"
            hideTitle={hideTitle}
            description="JPG o PNG, almeno 800 × 500 px."
            aside={
                <Counter>
                    {photos.length} di {max}
                </Counter>
            }
        >
            {message && (
                <p role="alert" className="text-[15px] text-destructive">
                    {message}
                </p>
            )}

            <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {photos.map((photo, index) => (
                    <li
                        key={photo.id}
                        className="relative aspect-8/5 overflow-hidden rounded-[20px] bg-[#262626]"
                    >
                        <img
                            src={photo.url}
                            alt={`Foto ${index + 1} della galleria`}
                            className="size-full object-cover"
                        />
                        {/* Deleted right away, without asking: it's only a gallery photo. */}
                        <button
                            type="button"
                            aria-label={`Rimuovi foto ${index + 1}`}
                            onClick={() => remove(photo)}
                            className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-[rgba(10,10,10,0.7)] text-foreground shadow-[inset_0_0_0_1px_var(--field)] hover:bg-[#0a0a0a]"
                        >
                            <X aria-hidden="true" className="size-3.5" />
                        </button>
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
                        <button
                            type="button"
                            disabled={uploading}
                            onClick={() => fileInput.current?.click()}
                            className="flex aspect-8/5 w-full flex-col items-center justify-center gap-1.5 rounded-[20px] border border-dashed border-field bg-transparent text-[15px] font-semibold text-foreground transition-colors hover:border-brand hover:text-brand disabled:cursor-default"
                        >
                            {uploading ? (
                                <Spinner />
                            ) : (
                                <Plus aria-hidden="true" className="size-5.5" />
                            )}
                            {uploading ? 'Caricamento…' : 'Aggiungi foto'}
                        </button>
                    </li>
                )}
            </ul>

            {photos.length === 0 && (
                <p className="text-[13px] leading-4.5 text-muted-foreground">
                    I profili con più di una foto ricevono più visite.
                </p>
            )}
        </Section>
    );
}
