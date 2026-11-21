import { Camera, Plus, X } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { useObjectUrls } from '@/components/gym/gym-form-fields';
import type { GymDraft } from '@/components/onboarding/gym/draft';
import { MAX_REGISTRATION_PHOTOS } from '@/components/onboarding/gym/draft';
import {
    DarkError,
    Optional,
    Section,
} from '@/components/onboarding/dark-fields';
import { cn } from '@/lib/utils';
import { errorOf } from '@/lib/validation-message';

type StepPhotosProps = {
    draft: GymDraft;
    update: (changes: Partial<GymDraft>) => void;
    errors: Partial<Record<string, string>>;
};

const ACCEPT = 'image/jpeg,image/png';

/** Only JPG and PNG, as the server (GymProfileRequest). */
const isImage = (file: File) => ['image/jpeg', 'image/png'].includes(file.type);

/** Step 4, "Le foto": the cover (required) and up to 6 more. */
export default function StepPhotos({ draft, update, errors }: StepPhotosProps) {
    const coverInputId = useId();
    const galleryInputId = useId();
    const coverInput = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const coverFiles = useMemo(
        () => (draft.cover ? [draft.cover] : []),
        [draft.cover],
    );
    const [coverPreview] = useObjectUrls(coverFiles);
    const galleryPreviews = useObjectUrls(draft.gallery);
    const cover = coverPreview ?? draft.coverUrl;
    const free = MAX_REGISTRATION_PHOTOS - draft.gallery.length;

    return (
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-14">
            <Section title="Copertina" className="gap-3 md:gap-3.5">
                <p className="sr-only">
                    JPG o PNG, almeno 800 × 500 px, massimo 5 MB.
                </p>
                {cover ? (
                    <div className="relative h-75 overflow-hidden rounded-[38px] md:h-85">
                        <img
                            src={cover}
                            alt="Copertina scelta"
                            className="size-full object-cover"
                        />
                        <div className="absolute inset-x-4 bottom-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => coverInput.current?.click()}
                                className="flex h-10 items-center rounded-full bg-[rgba(10,10,10,0.7)] px-4 text-[15px] font-semibold shadow-[inset_0_0_0_1px_var(--foreground)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                Cambia
                            </button>
                            {draft.cover && (
                                <button
                                    type="button"
                                    onClick={() => update({ cover: null })}
                                    className="flex h-10 items-center rounded-full bg-[rgba(10,10,10,0.7)] px-4 text-[15px] font-semibold shadow-[inset_0_0_0_1px_var(--foreground)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    Rimuovi
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <label
                        htmlFor={coverInputId}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => {
                            event.preventDefault();
                            setDragging(false);
                            const file = Array.from(
                                event.dataTransfer.files,
                            ).find(isImage);

                            if (file) {
                                update({ cover: file });
                            }
                        }}
                        className={cn(
                            'flex h-75 cursor-pointer flex-col items-center justify-center gap-3 rounded-[38px] border-[1.5px] border-dashed border-field bg-muted px-6 text-center outline-none hover:border-brand has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 md:h-85',
                            dragging && 'border-brand bg-brand/10',
                        )}
                    >
                        <span className="flex size-14 items-center justify-center rounded-full border border-brand text-brand">
                            <Camera aria-hidden="true" className="size-6" />
                        </span>
                        <span className="text-[17px] font-semibold">
                            <span className="md:hidden">
                                Scegli la foto di copertina
                            </span>
                            <span className="hidden md:inline">
                                Trascina qui la foto o{' '}
                                <span className="text-brand underline underline-offset-3">
                                    sceglila
                                </span>
                            </span>
                        </span>
                        <span className="text-[13px] leading-4.5 text-muted-foreground">
                            È la prima che vedono i clienti nella ricerca e in
                            cima al profilo
                        </span>
                    </label>
                )}
                <input
                    ref={coverInput}
                    id={coverInputId}
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                            update({ cover: file });
                        }

                        event.target.value = '';
                    }}
                />
                <p className="text-[13px] leading-4.5 text-muted-foreground">
                    JPG o PNG, almeno 800 × 500 px, massimo 5 MB.
                </p>
                <DarkError message={errors.cover} />
            </Section>

            <Section
                title={
                    <>
                        Altre foto <Optional>facoltative</Optional>
                    </>
                }
                aside={
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                        {draft.gallery.length} di {MAX_REGISTRATION_PHOTOS}
                    </span>
                }
                className="gap-3 md:gap-3.5"
            >
                <ul className="grid grid-cols-3 gap-2">
                    {galleryPreviews.map((url, index) => (
                        <li
                            key={url}
                            className="relative h-29 overflow-hidden rounded-[20px]"
                        >
                            <img
                                src={url}
                                alt={`Foto ${index + 1}`}
                                className="size-full object-cover"
                            />
                            <button
                                type="button"
                                aria-label={`Togli la foto ${index + 1}`}
                                onClick={() =>
                                    update({
                                        gallery: draft.gallery.filter(
                                            (_, i) => i !== index,
                                        ),
                                    })
                                }
                                className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-[rgba(10,10,10,0.7)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        </li>
                    ))}
                    {free > 0 && (
                        <li>
                            <label
                                htmlFor={galleryInputId}
                                className="flex h-29 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[20px] border border-brand text-[13px] font-semibold text-brand hover:bg-brand/10 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
                            >
                                <Plus aria-hidden="true" className="size-5.5" />
                                Aggiungi
                                <input
                                    id={galleryInputId}
                                    type="file"
                                    multiple
                                    accept={ACCEPT}
                                    className="sr-only"
                                    onChange={(event) => {
                                        const files = Array.from(
                                            event.target.files ?? [],
                                        );
                                        update({
                                            gallery: [
                                                ...draft.gallery,
                                                ...files,
                                            ].slice(0, MAX_REGISTRATION_PHOTOS),
                                        });
                                        event.target.value = '';
                                    }}
                                />
                            </label>
                        </li>
                    )}
                    {/* Empty places: 3 tiles on phones, 6 on desktop. */}
                    {Array.from({ length: Math.max(0, free - 1) }, (_, i) => (
                        <li
                            key={`empty-${i}`}
                            aria-hidden="true"
                            className={cn(
                                'h-29 rounded-[20px] border border-dashed border-border',
                                draft.gallery.length + 1 + i >= 3 &&
                                    'hidden md:block',
                            )}
                        />
                    ))}
                </ul>
                <DarkError message={errorOf(errors, 'gallery')} />
            </Section>
        </div>
    );
}
