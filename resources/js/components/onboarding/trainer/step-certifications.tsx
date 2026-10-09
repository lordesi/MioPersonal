import { FileUp, Plus } from 'lucide-react';
import FormField from '@/components/auth/form-field';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

type Certification = TrainerDraft['certifications'][number];

/** Step 6: degrees and certifications, checked by the team before approval. */
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
                title="Formazione e certificazioni"
                description="Compaiono sul profilo. Gli attestati li vede solo il nostro team, per l'approvazione."
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
                        <FormField label="Anno">
                            {({ id }) => (
                                <Input
                                    id={id}
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="AAAA"
                                    value={certification.year}
                                    onChange={(event) =>
                                        change(index, {
                                            year: event.target.value,
                                        })
                                    }
                                />
                            )}
                        </FormField>
                    </div>
                    {/* TODO: upload the certificate (PDF or photo). */}
                    <Button
                        type="button"
                        variant="outline"
                        className="self-start"
                    >
                        <FileUp aria-hidden="true" />
                        Allega attestato
                    </Button>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                className="self-start"
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
        </>
    );
}
