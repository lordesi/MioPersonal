import { ImageUp, UserRound } from 'lucide-react';
import FormField from '@/components/auth/form-field';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import { experienceOptions } from '@/components/onboarding/trainer/draft';
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

/** Step 2: photo, headline, bio and years of experience. */
export default function StepProfile({ draft, update }: StepProps) {
    return (
        <>
            <StepTitle
                title="Il tuo profilo pubblico"
                description="È la prima cosa che vedono i clienti, anche da Google."
            />

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground">
                    <UserRound aria-hidden="true" className="size-7" />
                    <span className="text-xs">Foto profilo</span>
                </div>
                <div className="flex max-w-80 flex-col items-start gap-1.5">
                    {/* TODO: upload and store the photo. */}
                    <Button type="button" variant="outline">
                        <ImageUp aria-hidden="true" />
                        Carica una foto
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        JPG o PNG, almeno 400 × 400 px. Viso ben visibile, luce
                        naturale. I profili con foto ricevono più fiducia.
                    </span>
                </div>
            </div>

            <FormField
                label="Titolo del profilo"
                hint="Una riga, al massimo 60 caratteri. Compare sotto il tuo nome."
            >
                {({ id, describedBy }) => (
                    <Input
                        id={id}
                        aria-describedby={describedBy}
                        maxLength={60}
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
                hint="Da 150 a 800 caratteri. Non inserire contatti: arrivano al cliente dopo l'accettazione."
            >
                {({ id, describedBy }) => (
                    <Textarea
                        id={id}
                        aria-describedby={describedBy}
                        rows={6}
                        maxLength={800}
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
                        value={draft.experience}
                        onValueChange={(experience) => update({ experience })}
                    >
                        <SelectTrigger id={id} className="h-11 w-full sm:w-64">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {experienceOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </FormField>
        </>
    );
}
