import { Camera } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
    fieldLabelClassName,
    pillFieldClassName,
    Section,
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
import { useInitials } from '@/hooks/use-initials';
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

/** "4 campi obbligatori su 4 compilati": photo, headline, bio, experience. */
export function profileStatus(draft: TrainerDraft, hasPhoto: boolean): string {
    const done = [
        hasPhoto,
        draft.headline.trim() !== '',
        draft.bio.trim().length >= BIO_MIN,
        draft.experience !== '',
    ].filter(Boolean).length;

    return `${done} campi obbligatori su 4 compilati`;
}

/**
 * Step 2 "Il tuo profilo": photo, headline, bio and years of experience
 * (all required) and the socials. Desktop: the photo in a box on the left.
 */
export default function StepProfile({ draft, update, name, photo }: StepProps) {
    return (
        <div className="grid items-start gap-10 md:grid-cols-[280px_minmax(0,1fr)] md:gap-16">
            <PhotoSection
                photo={photo}
                name={name}
                onChange={(file) => update({ photo: file })}
                onRemove={() => update({ photo: null, photoUrl: null })}
            />
            <Section title="Presentazione" className="md:gap-5.5">
                <Presentation draft={draft} update={update} />
            </Section>
        </div>
    );
}

/** "Foto profilo": the round photo (or the initials) and the buttons. */
function PhotoSection({
    photo,
    name,
    onChange,
    onRemove,
}: {
    photo: string | null;
    name: string;
    onChange: (file: File | null) => void;
    onRemove: () => void;
}) {
    const fileInput = useRef<HTMLInputElement>(null);
    const getInitials = useInitials();
    const initials = name.trim() ? getInitials(name) : '';
    const choose = () => fileInput.current?.click();

    return (
        <Section
            title="Foto profilo"
            className="md:items-center md:rounded-[20px] md:p-6 md:shadow-[inset_0_0_0_1px_var(--border)] md:[&>div:first-child]:self-stretch"
        >
            <div className="flex items-center gap-5 md:flex-col md:gap-4">
                {photo ? (
                    <img
                        src={photo}
                        alt={`Foto profilo di ${name || 'te'}`}
                        className="size-24 shrink-0 rounded-full object-cover ring-[1.5px] ring-brand md:size-40"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={choose}
                        aria-label="Carica una foto"
                        className="flex size-24 shrink-0 items-center justify-center rounded-full text-[32px] font-bold text-muted-foreground shadow-[inset_0_0_0_1.5px_var(--field)] outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 md:size-40 md:text-[52px]"
                    >
                        {initials || (
                            <Camera aria-hidden="true" className="size-8" />
                        )}
                    </button>
                )}
                <div className="flex flex-1 flex-col items-start gap-1 md:w-full md:items-center md:gap-2">
                    {/* Hidden: the buttons open it. Sent with the whole registration. */}
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(event) => {
                            onChange(event.target.files?.[0] ?? null);
                            // The same file can be chosen again after "Rimuovi".
                            event.target.value = '';
                        }}
                    />
                    <button
                        type="button"
                        onClick={choose}
                        className="flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold shadow-[inset_0_0_0_1px_var(--field)] outline-none hover:shadow-[inset_0_0_0_1.5px_var(--brand)] focus-visible:ring-[3px] focus-visible:ring-ring/50 md:w-full"
                    >
                        <Camera aria-hidden="true" className="size-4.5" />
                        {photo ? 'Cambia foto' : 'Carica una foto'}
                    </button>
                    {photo && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="flex min-h-11 items-center px-2 text-[15px] font-semibold underline underline-offset-3 outline-none hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            Rimuovi
                        </button>
                    )}
                    <p className="text-[13px] leading-4.5 text-muted-foreground md:text-center">
                        JPG o PNG, almeno 400 × 400 px
                    </p>
                </div>
            </div>
        </Section>
    );
}

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
                    className="min-h-35 rounded-[20px] border-0 bg-transparent px-4.5 py-3.5 text-[17px] leading-5.5 shadow-[inset_0_0_0_1px_var(--field)] focus-visible:shadow-[inset_0_0_0_1.5px_var(--brand)] focus-visible:ring-0 md:text-base"
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

            <div className={cn('md:max-w-90')}>
                <SocialAccountsField
                    dark
                    instagram={draft.instagram}
                    onInstagramChange={(instagram) => update({ instagram })}
                />
            </div>
        </>
    );
}
