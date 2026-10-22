import { Camera, UserRound } from 'lucide-react';
import { useId, useRef } from 'react';
import type {
    Experience,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    BIO_MAX,
    BIO_MIN,
    HEADLINE_MAX,
} from '@/components/onboarding/trainer/draft';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import NumberedSection from '@/components/trainer/area/numbered-section';
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
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

/** The labels of the design for this page ("Diventa trainer" keeps its own). */
const experienceLabels: { value: Experience; label: string }[] = [
    { value: 'lt2', label: 'Meno di 2 anni' },
    { value: '2to5', label: '2–5 anni' },
    { value: '5to10', label: '5–10 anni' },
    { value: 'gt10', label: 'Più di 10 anni' },
];

const CONTACTS_NOTE =
    'Non inserire contatti: arrivano al cliente dopo l’accettazione.';

type PublicProfileSectionProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
    /** The new photo or the saved one (usePhotoPreview). */
    photo: string | null;
    userName: string;
    /** Messages from the server for these fields. */
    errors: string[];
};

/**
 * "Il tuo profilo pubblico" (section 1 of "Il mio profilo"): photo,
 * headline, bio and years of experience, all required.
 */
export default function PublicProfileSection({
    draft,
    update,
    photo,
    userName,
    errors,
}: PublicProfileSectionProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const getInitials = useInitials();
    const id = useId();
    const bioLength = draft.bio.length;
    const bioOk = draft.bio.trim().length >= BIO_MIN;
    const bioHint = bioOk
        ? `Ottimo. ${CONTACTS_NOTE}`
        : `Almeno ${BIO_MIN} caratteri${bioLength > 0 ? ` · ne mancano ${BIO_MIN - draft.bio.trim().length}` : ''}. ${CONTACTS_NOTE}`;

    return (
        <NumberedSection
            step={1}
            title="Il tuo profilo pubblico"
            description="Tutti i campi di questa sezione sono obbligatori."
        >
            <StepErrors title="Da sistemare:" errors={errors} />

            <div className="flex flex-wrap items-center gap-4.5 rounded-[18px] border bg-muted/50 p-4">
                {photo ? (
                    <img
                        src={photo}
                        alt="Foto profilo"
                        className="size-22 flex-none rounded-full object-cover shadow-[0_0_0_4px_var(--background),0_0_0_5px_var(--border)]"
                    />
                ) : (
                    <span
                        role="img"
                        aria-label={`Foto mancante, ${getInitials(userName)}`}
                        className="flex size-22 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-ring text-muted-foreground"
                    >
                        <UserRound aria-hidden="true" className="size-6.5" />
                    </span>
                )}
                <div className="flex min-w-55 flex-1 flex-col gap-2.5">
                    <span className="text-[15px] leading-5.5 font-semibold">
                        Foto profilo
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        JPG o PNG, almeno 400 × 400 px. Viso ben visibile, luce
                        naturale.
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {/* Hidden: the button opens it. Sent with "Salva modifiche". */}
                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];

                                if (file) {
                                    update({ photo: file });
                                }

                                // The same file can be chosen again after "Rimuovi".
                                event.target.value = '';
                            }}
                        />
                        <Button
                            type="button"
                            onClick={() => fileInput.current?.click()}
                            className="h-10 rounded-[10px] px-3.5 font-semibold"
                        >
                            <Camera aria-hidden="true" />
                            {photo ? 'Cambia foto' : 'Carica foto'}
                        </Button>
                        {/* The photo stays required: without one the page can't be saved. */}
                        {photo && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    update({ photo: null, photoUrl: null })
                                }
                                className="h-10 rounded-[10px] px-3.5"
                            >
                                Rimuovi
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor={`${id}-headline`}
                    className="text-sm font-semibold"
                >
                    Titolo del profilo
                </label>
                <Input
                    id={`${id}-headline`}
                    aria-describedby={`${id}-headline-hint`}
                    required
                    maxLength={HEADLINE_MAX}
                    placeholder="Es. Bodybuilding e preparazione atletica per principianti"
                    value={draft.headline}
                    onChange={(event) =>
                        update({ headline: event.target.value })
                    }
                    className="h-12 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                />
                <div className="flex justify-between gap-2 text-[13px] leading-4.5 text-muted-foreground">
                    <span id={`${id}-headline-hint`}>
                        Compare sotto il tuo nome.
                    </span>
                    <span className="tabular-nums">
                        {draft.headline.length}/{HEADLINE_MAX}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-bio`} className="text-sm font-semibold">
                    Chi sei e come lavori
                </label>
                <Textarea
                    id={`${id}-bio`}
                    aria-describedby={`${id}-bio-hint`}
                    required
                    rows={5}
                    maxLength={BIO_MAX}
                    placeholder="Racconta il tuo approccio, con chi lavori meglio e cosa può aspettarsi un cliente dalla prima seduta."
                    value={draft.bio}
                    onChange={(event) => update({ bio: event.target.value })}
                    className="rounded-xl px-3.5 py-3 text-[15px] leading-5.5 md:text-[15px]"
                />
                <div className="flex justify-between gap-2 text-[13px] leading-4.5">
                    <span
                        id={`${id}-bio-hint`}
                        className={cn(
                            bioOk
                                ? 'text-muted-foreground'
                                : 'font-medium text-foreground',
                        )}
                    >
                        {bioHint}
                    </span>
                    <span className="flex-none text-muted-foreground tabular-nums">
                        {bioLength}/{BIO_MAX}
                    </span>
                </div>
                {/* How close the bio is to the minimum. */}
                <div
                    aria-hidden="true"
                    className="h-1 overflow-hidden rounded-full bg-muted"
                >
                    <div
                        className="h-full rounded-full bg-foreground transition-[width]"
                        style={{
                            width: `${Math.min(100, Math.round((draft.bio.trim().length / BIO_MIN) * 100))}%`,
                        }}
                    />
                </div>
            </div>

            <div className="flex max-w-70 flex-col gap-1.5">
                <label
                    htmlFor={`${id}-experience`}
                    className="text-sm font-semibold"
                >
                    Anni di esperienza
                </label>
                <Select
                    value={draft.experience}
                    onValueChange={(experience) =>
                        update({ experience: experience as Experience })
                    }
                >
                    <SelectTrigger
                        id={`${id}-experience`}
                        aria-required="true"
                        className="h-12 w-full rounded-xl px-3.5 text-[15px] data-[size=default]:h-12"
                    >
                        <SelectValue placeholder="Scegli" />
                    </SelectTrigger>
                    <SelectContent>
                        {experienceLabels.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </NumberedSection>
    );
}
