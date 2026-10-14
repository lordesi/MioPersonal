import { FileCheck, FileUp, Plus, Trash2 } from 'lucide-react';
import FormField from '@/components/auth/form-field';
import type {
    Certification,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    FIRST_CERTIFICATION_YEAR,
    isValidYear,
    MAX_CERTIFICATIONS,
} from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/**
 * Step 6 (optional): degrees and certifications, at most 3, checked by the
 * team before approval.
 */
export default function StepCertifications({ draft, update }: StepProps) {
    const change = (index: number, changes: Partial<Certification>) =>
        update({
            certifications: draft.certifications.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        });

    return (
        <>
            <StepTitle
                title="Formazione e certificazioni (facoltativa)"
                description={`Puoi saltare questo passo. Se le aggiungi (al massimo ${MAX_CERTIFICATIONS}), compaiono sul profilo; gli attestati li vede solo il nostro team, per l'approvazione.`}
            />

            {draft.certifications.map((certification, index) => (
                <div
                    key={index}
                    className="flex flex-col gap-3 rounded-lg border p-3 md:p-4"
                >
                    <FormField label="Titolo">
                        {({ id }) => (
                            <Input
                                id={id}
                                placeholder="Es. Laurea in Scienze Motorie"
                                value={certification.title}
                                onChange={(event) =>
                                    change(index, {
                                        title: event.target.value,
                                    })
                                }
                            />
                        )}
                    </FormField>
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                        <FormField label="Ente o scuola">
                            {({ id }) => (
                                <Input
                                    id={id}
                                    value={certification.issuer}
                                    onChange={(event) =>
                                        change(index, {
                                            issuer: event.target.value,
                                        })
                                    }
                                />
                            )}
                        </FormField>
                        <FormField
                            label="Anno"
                            hint="4 cifre, es. 2020"
                            error={
                                // Only once the 4 digits are there: not while typing.
                                certification.year.length === 4 &&
                                !isValidYear(certification.year)
                                    ? `Scrivi un anno tra il ${FIRST_CERTIFICATION_YEAR} e il ${new Date().getFullYear()}.`
                                    : undefined
                            }
                        >
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={
                                        certification.year.length === 4 &&
                                        !isValidYear(certification.year)
                                    }
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="AAAA"
                                    value={certification.year}
                                    onChange={(event) =>
                                        change(index, {
                                            // Only digits: letters are dropped as you type.
                                            year: event.target.value.replace(
                                                /\D/g,
                                                '',
                                            ),
                                        })
                                    }
                                />
                            )}
                        </FormField>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* The label opens the hidden file input. Sent with the whole registration. */}
                        <Button asChild variant="outline">
                            <label className="cursor-pointer">
                                <FileUp aria-hidden="true" />
                                {certification.file || certification.hasFile
                                    ? 'Cambia attestato'
                                    : 'Allega attestato'}
                                <input
                                    type="file"
                                    accept="application/pdf,image/jpeg,image/png"
                                    className="sr-only"
                                    onChange={(event) =>
                                        change(index, {
                                            file:
                                                event.target.files?.[0] ?? null,
                                        })
                                    }
                                />
                            </label>
                        </Button>
                        {(certification.file || certification.hasFile) && (
                            <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                                <FileCheck
                                    aria-hidden="true"
                                    className="size-4 flex-none"
                                />
                                <span className="truncate">
                                    {certification.file?.name ??
                                        'Attestato già inviato'}
                                </span>
                            </span>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-auto"
                            aria-label={`Rimuovi ${certification.title || 'certificazione'}`}
                            disabled={draft.certifications.length === 1}
                            onClick={() =>
                                update({
                                    certifications: draft.certifications.filter(
                                        (_, i) => i !== index,
                                    ),
                                })
                            }
                        >
                            <Trash2 />
                        </Button>
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                className="self-start"
                disabled={draft.certifications.length >= MAX_CERTIFICATIONS}
                onClick={() =>
                    update({
                        certifications: [
                            ...draft.certifications,
                            { title: '', issuer: '', year: '' },
                        ],
                    })
                }
            >
                <Plus aria-hidden="true" />
                Aggiungi una certificazione
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
                {draft.certifications.length} di {MAX_CERTIFICATIONS} al massimo
            </span>
        </>
    );
}
