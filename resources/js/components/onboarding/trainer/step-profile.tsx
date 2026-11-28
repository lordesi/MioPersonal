import { Camera, Plus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
    fieldLabelClassName,
    pillFieldClassName,
} from '@/components/onboarding/dark-fields';
import { ChipRow } from '@/components/onboarding/trainer/dark-bits';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    BIO_MAX,
    BIO_MIN,
    experienceOptions,
    HEADLINE_MAX,
} from '@/components/onboarding/trainer/draft';
import SocialAccountsField from '@/components/trainer/profile/social-accounts-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
    /** The trainer's name: the initials while there is no photo. */
    name: string;
    /** The new photo or the saved one (usePhotoPreview). */
    photo: string | null;
};

const CONTACTS_NOTE =
    'Non inserire contatti: arrivano al cliente dopo l’accettazione.';

/** The chosen file, or the photo already saved. */
export function usePhotoPreview(draft: TrainerDraft): string | null {
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

/**
 * "Foto profilo" (step 2) or "Presentazione" (step 3) of "Diventa trainer":
 * the photo, then headline, bio and years of experience (all required),
 * the socials and, for a guest, the username.
 */
export default function StepProfile({
    part,
    draft,
    update,
    name,
    photo,
    username,
    compact = false,
}: StepProps & {
    /** Left out: both. */
    part?: 'photo' | 'about';
    /** "Presentazione": the username of a guest, on top. */
    username?: ReactNode;
    /** "Modifica profilo": the photo with ✕ to remove it, only "Scatta una foto" under it. */
    compact?: boolean;
}) {
    const picker = (
        <PhotoPicker
            photo={photo}
            name={name}
            compact={compact}
            onChange={(file) => update({ photo: file })}
            onRemove={() => update({ photo: null, photoUrl: null })}
        />
    );

    if (part === 'photo') {
        return picker;
    }

    return (
        <div className="flex flex-col gap-8">
            {part === undefined && picker}
            {username}
            <Presentation draft={draft} update={update} />
        </div>
    );
}

/**
 * The round photo of the design (176px, the turquoise "+"), "Scegli dalla
 * galleria" and "Scatta una foto". Sent with the whole registration.
 * `compact` ("Modifica profilo"): once there is a photo the "+" becomes a
 * ✕ that removes it; only "Scatta una foto" under it.
 */
function PhotoPicker({
    photo,
    name,
    compact,
    onChange,
    onRemove,
}: {
    photo: string | null;
    name: string;
    compact: boolean;
    onChange: (file: File | null) => void;
    onRemove: () => void;
}) {
    const removable = compact && photo !== null;
    const fileInput = useRef<HTMLInputElement>(null);
    const cameraInput = useRef<HTMLInputElement>(null);
    const choose = () => fileInput.current?.click();
    const pick = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.files?.[0] ?? null);
        // The same file can be chosen again after "Rimuovi".
        event.target.value = '';
    };

    return (
        <div className="flex flex-col items-center gap-5 py-2">
            <div className={cn('relative size-44', compact && 'md:size-50')}>
                <button
                    type="button"
                    onClick={choose}
                    aria-label={photo ? 'Cambia la foto' : 'Carica una foto'}
                    className="relative flex size-full items-center justify-center rounded-full border-[1.5px] border-border-strong text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                    {photo ? (
                        <img
                            src={photo}
                            alt={`Foto profilo di ${name || 'te'}`}
                            className="size-full rounded-full object-cover"
                        />
                    ) : (
                        <Camera
                            aria-hidden="true"
                            className="size-15"
                            strokeWidth={1.5}
                        />
                    )}
                    {!removable && (
                        <span aria-hidden="true" className={badgeClassName}>
                            <Plus className="size-5.5" strokeWidth={2.5} />
                        </span>
                    )}
                </button>
                {removable && (
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label="Rimuovi la foto"
                        className={cn(
                            badgeClassName,
                            'right-2 bottom-2 outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        )}
                    >
                        <X
                            aria-hidden="true"
                            className="size-5.5"
                            strokeWidth={2.5}
                        />
                    </button>
                )}
            </div>
            <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={pick}
            />
            <input
                ref={cameraInput}
                type="file"
                accept="image/jpeg,image/png"
                capture="user"
                className="hidden"
                onChange={pick}
            />
            <div className="flex flex-wrap justify-center gap-2">
                {!compact && (
                    <button
                        type="button"
                        onClick={choose}
                        className="h-11 rounded-full border border-input px-5 text-[15px] font-semibold shadow-xs outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Scegli dalla galleria
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => cameraInput.current?.click()}
                    className="h-11 rounded-full px-5 text-[15px] font-semibold outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Scatta una foto
                </button>
                {photo && !compact && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="h-11 rounded-full px-5 text-[15px] font-semibold text-muted-foreground outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Rimuovi
                    </button>
                )}
            </div>
            {!compact && (
                <p className="text-[13px] text-muted-foreground">
                    JPG o PNG, almeno 400 × 400 px
                </p>
            )}
        </div>
    );
}

/** The turquoise circle on the photo: "+" to add, ✕ to remove. */
const badgeClassName =
    'absolute right-1.75 bottom-1.75 flex size-11 items-center justify-center rounded-full bg-brand text-black shadow-[0_0_0_4px_var(--background)]';

/** Headline, bio (at least 60 characters), experience and the socials. */
function Presentation({ draft, update }: Pick<StepProps, 'draft' | 'update'>) {
    const id = useId();
    const bioLength = draft.bio.trim().length;
    const bioOk = bioLength >= BIO_MIN;

    return (
        <>
            <div className="flex flex-col gap-2">
                <label
                    htmlFor={`${id}-headline`}
                    className={fieldLabelClassName}
                >
                    Titolo del profilo
                </label>
                <Input
                    id={`${id}-headline`}
                    aria-describedby={`${id}-headline-hint`}
                    required
                    maxLength={HEADLINE_MAX}
                    placeholder="Es. Personal trainer · Boxe e functional"
                    value={draft.headline}
                    onChange={(event) =>
                        update({ headline: event.target.value })
                    }
                    className={pillFieldClassName}
                />
                <div
                    id={`${id}-headline-hint`}
                    className="flex justify-between gap-3 text-[13px] leading-4.5 text-muted-foreground"
                >
                    <span>Una riga. Compare sotto il tuo nome.</span>
                    <span className="tabular-nums">
                        {draft.headline.length}/{HEADLINE_MAX}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor={`${id}-bio`} className={fieldLabelClassName}>
                    Chi sei e come lavori
                </label>
                <Textarea
                    id={`${id}-bio`}
                    aria-describedby={`${id}-bio-hint`}
                    required
                    rows={5}
                    maxLength={BIO_MAX}
                    placeholder="Chi alleni di solito, che metodo usi, cosa succede nella prima seduta…"
                    value={draft.bio}
                    onChange={(event) => update({ bio: event.target.value })}
                    className="min-h-35 rounded-[14px] border-input bg-card px-4 py-3.5 text-[17px] leading-5.5 focus-visible:border-brand focus-visible:ring-0 md:text-[17px]"
                />
                <div
                    id={`${id}-bio-hint`}
                    className="flex justify-between gap-3 text-[13px] leading-4.5 text-muted-foreground"
                >
                    <span>
                        {bioOk ? (
                            <span className="font-semibold text-brand">
                                Ottimo.{' '}
                            </span>
                        ) : (
                            `Almeno ${BIO_MIN} caratteri${bioLength > 0 ? `, ne mancano ${BIO_MIN - bioLength}` : ''}. `
                        )}
                        {CONTACTS_NOTE}
                    </span>
                    <span className="shrink-0 tabular-nums">
                        {draft.bio.length}/{BIO_MAX}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2.5">
                <span id={`${id}-experience`} className={fieldLabelClassName}>
                    Anni di esperienza
                </span>
                <ChipRow
                    label="Anni di esperienza"
                    options={experienceOptions}
                    isOn={(value) => draft.experience === value}
                    onToggle={(experience) => update({ experience })}
                />
            </div>

            <div>
                <SocialAccountsField
                    dark
                    instagram={draft.instagram}
                    onInstagramChange={(instagram) => update({ instagram })}
                />
            </div>
        </>
    );
}
