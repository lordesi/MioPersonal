import { FileCheck, FileUp, Plus, Trash2, X } from 'lucide-react';
import FormField from '@/components/auth/form-field';
import type {
    Certification,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    FIRST_CERTIFICATION_YEAR,
    isFilled,
    isValidYear,
    MAX_CERTIFICATIONS,
} from '@/components/onboarding/trainer/draft';
import StepTitle, {
    useEditingProfile,
} from '@/components/onboarding/trainer/step-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** A started certification needs every field (the certificate file stays optional). */
const REQUIRED = 'Obbligatorio se aggiungi la certificazione.';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/**
 * Step 6 (optional): degrees and certifications, at most 3, checked by the
 * team before approval. A started one needs title, issuer and year.
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
                description={
                    useEditingProfile()
                        ? `Al massimo ${MAX_CERTIFICATIONS}. Compaiono sul profilo; gli attestati li vede solo il nostro team.`
                        : `Puoi saltare questo passo. Se le aggiungi (al massimo ${MAX_CERTIFICATIONS}), compaiono sul profilo; gli attestati li vede solo il nostro team, per l'approvazione.`
                }
            />

            {draft.certifications.map((certification, index) => {
                // Only a started row asks for the missing fields.
                const started = isFilled(certification);
                const missing = (value: string) =>
                    started && value.trim() === '' ? REQUIRED : undefined;
                const yearError =
                    missing(certification.year) ??
                    // Only once the 4 digits are there: not while typing.
                    (certification.year.length === 4 &&
                    !isValidYear(certification.year)
                        ? `Scrivi un anno tra il ${FIRST_CERTIFICATION_YEAR} e il ${new Date().getFullYear()}.`
                        : undefined);

                return (
                    <div
                        key={index}
                        className="flex flex-col gap-3 rounded-lg border p-3 md:p-4"
                    >
                        <FormField
                            label="Titolo"
                            error={missing(certification.title)}
                        >
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={
                                        !!missing(certification.title)
                                    }
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
                            <FormField
                                label="Ente o scuola"
                                error={missing(certification.issuer)}
                            >
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={
                                            !!missing(certification.issuer)
                                        }
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
                                error={yearError}
                            >
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!yearError}
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
                                        onChange={(event) => {
                                            change(index, {
                                                file:
                                                    event.target.files?.[0] ??
                                                    null,
                                            });
                                            // The same file can be chosen again after the ✕.
                                            event.target.value = '';
                                        }}
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
                                    {/* Only the file goes: the certification stays. */}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 flex-none"
                                        aria-label="Rimuovi l’attestato"
                                        onClick={() =>
                                            change(index, {
                                                file: null,
                                                hasFile: false,
                                            })
                                        }
                                    >
                                        <X />
                                    </Button>
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
                                        certifications:
                                            draft.certifications.filter(
                                                (_, i) => i !== index,
                                            ),
                                    })
                                }
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    </div>
                );
            })}

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
