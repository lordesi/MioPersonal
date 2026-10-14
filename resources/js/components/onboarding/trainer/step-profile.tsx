import { ImageUp, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import FormField from '@/components/auth/form-field';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    BIO_MAX,
    BIO_MIN,
    experienceOptions,
    HEADLINE_MAX,
} from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/** The chosen file, or the photo already saved. */
function usePhotoPreview(draft: TrainerDraft): string | null {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!draft.photo) {
            setUrl(null);

            return;
        }

        const objectUrl = URL.createObjectURL(draft.photo);
        setUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [draft.photo]);

    return url ?? draft.photoUrl;
}

/** Step 2: photo, headline, bio and years of experience, all required. */
export default function StepProfile({ draft, update }: StepProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const preview = usePhotoPreview(draft);

    return (
        <>
            <StepTitle
                title="Il tuo profilo pubblico"
                description="È la prima cosa che vedono i clienti, anche da Google. Tutti i campi sono obbligatori."
            />

            <div className="flex flex-wrap items-center gap-4">
                {preview ? (
                    <img
                        src={preview}
                        alt="Foto profilo"
                        className="size-24 rounded-xl border object-cover"
                    />
                ) : (
                    <div className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground">
                        <UserRound aria-hidden="true" className="size-7" />
                        <span className="text-xs">Foto profilo</span>
                    </div>
                )}
                <div className="flex max-w-80 flex-col items-start gap-1.5">
                    {/* Hidden: the button below opens it. Sent with the whole registration. */}
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(event) =>
                            update({ photo: event.target.files?.[0] ?? null })
                        }
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInput.current?.click()}
                    >
                        <ImageUp aria-hidden="true" />
                        {preview ? 'Cambia foto' : 'Carica una foto'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Obbligatoria. JPG o PNG, almeno 400 × 400 px. Viso ben
                        visibile, luce naturale.
                    </span>
                </div>
            </div>

            <FormField
                label="Titolo del profilo"
                hint="Una riga. Compare sotto il tuo nome."
                counter={{ length: draft.headline.length, max: HEADLINE_MAX }}
            >
                {({ id, describedBy }) => (
                    <Input
                        id={id}
                        aria-describedby={describedBy}
                        required
                        maxLength={HEADLINE_MAX}
                        placeholder="Personal trainer · Functional e Pilates"
                        value={draft.headline}
                        onChange={(event) =>
                            update({ headline: event.target.value })
                        }
                        className="h-11 text-base md:text-base"
                    />
                )}
            </FormField>

            <FormField
                label="Chi sei e come lavori"
                hint={`Almeno ${BIO_MIN} caratteri. Non inserire contatti: arrivano al cliente dopo l'accettazione.`}
                counter={{ length: draft.bio.length, max: BIO_MAX }}
            >
                {({ id, describedBy }) => (
                    <Textarea
                        id={id}
                        aria-describedby={describedBy}
                        required
                        rows={6}
                        maxLength={BIO_MAX}
                        placeholder="Chi alleni di solito, che metodo usi, cosa succede nella prima seduta…"
                        value={draft.bio}
                        onChange={(event) =>
                            update({ bio: event.target.value })
                        }
                        className="text-base md:text-base"
                    />
                )}
            </FormField>

            <FormField label="Anni di esperienza">
                {({ id }) => (
                    <Select
                        // '' shows the placeholder "Scegli".
                        value={draft.experience}
                        onValueChange={(experience) =>
                            update({
                                experience:
                                    experience as TrainerDraft['experience'],
                            })
                        }
                    >
                        <SelectTrigger
                            id={id}
                            aria-required="true"
                            className="h-11 w-full sm:w-64"
                        >
                            <SelectValue placeholder="Scegli" />
                        </SelectTrigger>
                        <SelectContent>
                            {experienceOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </FormField>
        </>
    );
}
