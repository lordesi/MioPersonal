import { Camera, UserRound } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    BIO_MAX,
    BIO_MIN,
    experienceOptions,
    HEADLINE_MAX,
} from '@/components/onboarding/trainer/draft';
import {
    DarkPanel,
    StepColumns,
} from '@/components/onboarding/trainer/onboarding-shell';
import type { PanelCheck } from '@/components/onboarding/trainer/search-card-preview';
import SearchCardPreview, {
    PanelChecklist,
} from '@/components/onboarding/trainer/search-card-preview';
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
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
    /** The trainer's name, in the preview. */
    name: string;
    /** The new photo or the saved one (usePhotoPreview). */
    photo: string | null;
    disciplines: CatalogOption[];
    cities: CatalogOption[];
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

/** The 4 required fields of step 2, with the line under each one. */
function profileChecks(draft: TrainerDraft, hasPhoto: boolean): PanelCheck[] {
    const bioLength = draft.bio.trim().length;
    const bioOk = bioLength >= BIO_MIN;
    const headlineOk = draft.headline.trim() !== '';
    const experience = experienceOptions.find(
        (option) => option.value === draft.experience,
    );

    let bioHint = `Almeno ${BIO_MIN} caratteri`;

    if (bioOk) {
        bioHint = 'Fatto';
    } else if (bioLength > 0) {
        bioHint = `Mancano ${BIO_MIN - bioLength} caratteri`;
    }

    return [
        {
            label: 'Foto profilo',
            done: hasPhoto,
            hint: hasPhoto ? 'Caricata' : 'Non ancora caricata',
        },
        {
            label: 'Titolo del profilo',
            done: headlineOk,
            hint: headlineOk ? 'Fatto' : 'Una riga che ti descriva',
        },
        {
            label: 'Chi sei e come lavori',
            done: bioOk,
            hint: bioHint,
        },
        {
            label: 'Anni di esperienza',
            done: experience !== undefined,
            hint: experience?.label ?? 'Scegli dall’elenco',
        },
    ];
}

/** Step 2: photo, headline, bio and years of experience, all required. */
export default function StepProfile({
    draft,
    update,
    name,
    photo,
    disciplines,
    cities,
}: StepProps) {
    const checks = profileChecks(draft, photo !== null);
    const done = checks.filter((check) => check.done).length;

    return (
        <StepColumns
            aside={
                <DarkPanel title="Anteprima profilo">
                    <SearchCardPreview
                        draft={draft}
                        name={name}
                        photo={photo}
                        disciplines={disciplines}
                        cities={cities}
                        experience
                        photoPlaceholder
                    />
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[15px] leading-5.5 font-semibold">
                                Campi obbligatori
                            </span>
                            <span className="text-[22px] leading-7 font-bold tabular-nums">
                                {done}/{checks.length}
                            </span>
                        </div>
                        <div
                            aria-hidden="true"
                            className="h-2 overflow-hidden rounded-full bg-sidebar-border"
                        >
                            <div
                                className="h-full rounded-full bg-sidebar-primary transition-[width]"
                                style={{
                                    width: `${(done / checks.length) * 100}%`,
                                }}
                            />
                        </div>
                        <PanelChecklist checks={checks} className="mt-1" />
                    </div>
                </DarkPanel>
            }
        >
            <PhotoSection
                photo={photo}
                name={name}
                onChange={(file) => update({ photo: file })}
                onRemove={() => update({ photo: null, photoUrl: null })}
            />

            <NumberedSection step={2} title="Presentazione">
                <Presentation draft={draft} update={update} />
            </NumberedSection>
        </StepColumns>
    );
}

/** "Foto profilo": the round photo, the rules and the buttons. */
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
    const choose = () => fileInput.current?.click();

    return (
        <NumberedSection step={1} title="Foto profilo" className="gap-4.5">
            <div className="flex flex-wrap items-center gap-5 rounded-[18px] border bg-muted/50 p-4.5">
                {photo ? (
                    <img
                        src={photo}
                        alt={`Foto profilo di ${name}`}
                        className="size-26 flex-none rounded-full object-cover ring-4 ring-card"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={choose}
                        aria-label="Carica una foto"
                        className="flex size-26 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-ring bg-card text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        <UserRound aria-hidden="true" className="size-6.5" />
                    </button>
                )}

                <div className="flex min-w-55 flex-1 flex-col gap-2.5">
                    <p className="flex items-center gap-2 text-[13px] leading-4.5 text-foreground/80">
                        <span
                            aria-hidden="true"
                            className="size-1.5 rounded-full bg-foreground"
                        />
                        JPG o PNG, almeno 400 × 400 px
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                        <Button
                            type="button"
                            onClick={choose}
                            className="h-10 rounded-[10px] px-3.5 font-semibold"
                        >
                            <Camera aria-hidden="true" />
                            {photo ? 'Cambia foto' : 'Carica una foto'}
                        </Button>
                        {photo && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onRemove}
                                className="h-10 rounded-[10px] border-input px-3.5"
                            >
                                Rimuovi
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </NumberedSection>
    );
}

/** Headline, bio (with the bar up to 60 characters) and experience. */
function Presentation({ draft, update }: Pick<StepProps, 'draft' | 'update'>) {
    const id = useId();
    const bioLength = draft.bio.trim().length;
    const bioOk = bioLength >= BIO_MIN;
    const bioHint = bioOk
        ? `Ottimo. ${CONTACTS_NOTE}`
        : `Almeno ${BIO_MIN} caratteri${bioLength > 0 ? ` · ne mancano ${BIO_MIN - bioLength}` : ''}. ${CONTACTS_NOTE}`;

    return (
        <>
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
                    placeholder="Es. Personal trainer · Bodybuilding e Functional"
                    value={draft.headline}
                    onChange={(event) =>
                        update({ headline: event.target.value })
                    }
                    className="h-12 rounded-xl px-3.5 text-[15px] md:text-[15px]"
                />
                <div
                    id={`${id}-headline-hint`}
                    className="flex justify-between gap-2 text-[13px] leading-4.5 text-muted-foreground"
                >
                    <span>Una riga. Compare sotto il tuo nome.</span>
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
                    placeholder="Chi alleni di solito, che metodo usi, cosa succede nella prima seduta…"
                    value={draft.bio}
                    onChange={(event) => update({ bio: event.target.value })}
                    className="rounded-xl px-3.5 py-3 text-[15px] leading-5.5 md:text-[15px]"
                />
                <div
                    id={`${id}-bio-hint`}
                    className="flex justify-between gap-2 text-[13px] leading-4.5"
                >
                    <span
                        className={cn(
                            bioOk
                                ? 'text-foreground/70'
                                : 'font-medium text-foreground',
                        )}
                    >
                        {bioHint}
                    </span>
                    <span className="flex-none text-muted-foreground tabular-nums">
                        {draft.bio.length}/{BIO_MAX}
                    </span>
                </div>
                <div
                    aria-hidden="true"
                    className="h-1 overflow-hidden rounded-full bg-secondary"
                >
                    <div
                        className="h-full rounded-full bg-foreground transition-[width]"
                        style={{
                            width: `${Math.min(100, (bioLength / BIO_MIN) * 100)}%`,
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
                        id={`${id}-experience`}
                        aria-required="true"
                        className="h-12 w-full rounded-xl px-3.5 text-[15px] data-[size=default]:h-12"
                    >
                        <SelectValue placeholder="Scegli" />
                    </SelectTrigger>
                    <SelectContent>
                        {experienceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </>
    );
}
