import { router } from '@inertiajs/react';
import { Plus, Star, X } from 'lucide-react';
import { useRef, useState } from 'react';
import GymCoursePhotoController from '@/actions/App/Http/Controllers/GymCoursePhotoController';
import { Spinner } from '@/components/ui/spinner';
import { shrinkImage } from '@/lib/image';

export type CoursePhoto = { id: number; url: string };

type CoursePhotosProps = {
    courseId: number;
    photos: CoursePhoto[];
    /** GymCourse::MAX_PHOTOS */
    max: number;
};

/**
 * "Foto" of a course in its dialog: each action (add, delete, first) is
 * saved right away by GymCoursePhotoController, not with "Salva". The first
 * photo is the one on the cards.
 */
export default function CoursePhotos({
    courseId,
    photos,
    max,
}: CoursePhotosProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const room = max - photos.length;
    // The dialog stays open: only the photos change.
    const options = {
        preserveScroll: true,
        preserveState: true,
        onError: (errors: Record<string, string>) =>
            setMessage(Object.values(errors)[0] ?? 'Riprova tra poco.'),
    };

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

        // Smaller files: faster upload, lighter pages.
        const files = await Promise.all(
            chosen.slice(0, room).map((file) => shrinkImage(file)),
        );

        router.post(
            GymCoursePhotoController.store.url(courseId),
            { photos: files },
            {
                ...options,
                forceFormData: true,
                onFinish: () => setUploading(false),
            },
        );
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="flex items-center justify-between text-sm font-medium">
                Foto (facoltative)
                <span className="text-xs text-muted-foreground tabular-nums">
                    {photos.length} di {max}
                </span>
            </span>
            {message && (
                <p role="alert" className="text-sm text-destructive">
                    {message}
                </p>
            )}
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                {photos.map((photo, index) => (
                    <li
                        key={photo.id}
                        className="relative aspect-8/5 overflow-hidden rounded-xl bg-muted"
                    >
                        <img
                            src={photo.url}
                            alt={`Foto ${index + 1} del corso`}
                            className="size-full object-cover"
                        />
                        {index === 0 ? (
                            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold shadow-sm">
                                Sulle schede
                            </span>
                        ) : (
                            <button
                                type="button"
                                aria-label={`Metti per prima la foto ${index + 1}`}
                                title="Metti per prima"
                                onClick={() =>
                                    router.post(
                                        GymCoursePhotoController.first.url({
                                            course: courseId,
                                            photo: photo.id,
                                        }),
                                        {},
                                        options,
                                    )
                                }
                                className="absolute bottom-1.5 left-1.5 flex size-7 items-center justify-center rounded-full bg-background text-foreground shadow-sm hover:bg-secondary"
                            >
                                <Star aria-hidden="true" className="size-3.5" />
                            </button>
                        )}
                        <button
                            type="button"
                            aria-label={`Rimuovi foto ${index + 1}`}
                            onClick={() =>
                                router.delete(
                                    GymCoursePhotoController.destroy.url({
                                        course: courseId,
                                        photo: photo.id,
                                    }),
                                    options,
                                )
                            }
                            className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-background text-foreground shadow-sm hover:bg-secondary"
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
                            className="flex aspect-8/5 w-full flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-input bg-muted/50 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-default"
                        >
                            {uploading ? (
                                <Spinner />
                            ) : (
                                <Plus aria-hidden="true" className="size-5" />
                            )}
                            {uploading ? 'Caricamento…' : 'Aggiungi foto'}
                        </button>
                    </li>
                )}
            </ul>
            <p className="text-xs text-muted-foreground">
                JPG o PNG, almeno 800 × 500 px. La prima compare sulle schede
                dei corsi.
            </p>
        </div>
    );
}
