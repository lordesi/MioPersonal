import { Check, Upload, X } from 'lucide-react';
import {
    Field,
    pillFieldClassName,
    Section,
} from '@/components/onboarding/dark-fields';
import {
    AddButton,
    Counter,
    DarkCard,
    DeleteButton,
} from '@/components/onboarding/trainer/dark-bits';
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/** A started certification needs every field (the certificate file stays optional). */
const REQUIRED = 'Obbligatorio se aggiungi la certificazione.';

/** The year is wrong only once the 4 digits are there: not while typing. */
function wrongYear(certification: Certification): boolean {
    return certification.year.length === 4 && !isValidYear(certification.year);
}

/**
 * Step 6 (optional) "Formazione e certificazioni": degrees and courses, at
 * most 3, checked by the team before approval. A started one needs title,
 * issuer and year; the certificate stays private.
 */
export default function StepCertifications({ draft, update }: StepProps) {
    const certifications = draft.certifications;

    const change = (index: number, changes: Partial<Certification>) =>
        update({
            certifications: certifications.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        });

    return (
        <div className="flex flex-col gap-8">
            <Section
                title={
                    <>
                        <span className="md:hidden">Certificazioni</span>
                        <span className="hidden md:inline">
                            Le tue certificazioni
                        </span>
                    </>
                }
                description="Lauree, diplomi, corsi e attestati."
                aside={
                    <Counter>
                        {certifications.length} di {MAX_CERTIFICATIONS}
                        <span className="hidden md:inline"> al massimo</span>
                    </Counter>
                }
            >
                {certifications.length === 0 && (
                    <p className="text-[15px] leading-5.25 text-muted-foreground">
                        Nessuna certificazione. Puoi saltare questo passo e
                        aggiungerle più avanti.
                    </p>
                )}
                <div className="flex flex-col gap-2 md:gap-3">
                    {certifications.map((certification, index) => (
                        <CertificationCard
                            key={certification.id ?? `new-${index}`}
                            number={index + 1}
                            certification={certification}
                            onChange={(changes) => change(index, changes)}
                            onRemove={() =>
                                update({
                                    certifications: certifications.filter(
                                        (_, i) => i !== index,
                                    ),
                                })
                            }
                        />
                    ))}
                </div>
                {certifications.length < MAX_CERTIFICATIONS && (
                    <AddButton
                        onClick={() =>
                            update({
                                certifications: [
                                    ...certifications,
                                    { title: '', issuer: '', year: '' },
                                ],
                            })
                        }
                    >
                        Aggiungi una certificazione
                    </AddButton>
                )}
            </Section>
        </div>
    );
}

/** One certification: title, issuer, year and the certificate file. */
function CertificationCard({
    number,
    certification,
    onChange,
    onRemove,
}: {
    number: number;
    certification: Certification;
    onChange: (changes: Partial<Certification>) => void;
    onRemove: () => void;
}) {
    // Only a started certification asks for the missing fields.
    const started = isFilled(certification);
    const missing = (value: string) =>
        started && value.trim() === '' ? REQUIRED : undefined;
    const yearError =
        missing(certification.year) ??
        (wrongYear(certification)
            ? `Scrivi un anno tra il ${FIRST_CERTIFICATION_YEAR} e il ${new Date().getFullYear()}.`
            : undefined);
    const withFile = !!certification.file || !!certification.hasFile;

    return (
        <DarkCard className="gap-4">
            <div className="flex items-center justify-between gap-3">
                <span className="text-[17px] leading-5.5 font-semibold">
                    Certificazione {number}
                </span>
                <DeleteButton
                    label={`Elimina la certificazione ${number}`}
                    onClick={onRemove}
                />
            </div>
            <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_9rem] md:items-start md:gap-3">
                <Field label="Titolo" error={missing(certification.title)}>
                    {({ id, describedBy }) => (
                        <Input
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={!!missing(certification.title)}
                            maxLength={150}
                            placeholder="Es. Laurea in Scienze Motorie"
                            value={certification.title}
                            onChange={(event) =>
                                onChange({ title: event.target.value })
                            }
                            className={pillFieldClassName}
                        />
                    )}
                </Field>
                <Field
                    label="Ente o scuola"
                    error={missing(certification.issuer)}
                >
                    {({ id, describedBy }) => (
                        <Input
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={!!missing(certification.issuer)}
                            maxLength={150}
                            placeholder="Es. Università di Milano"
                            value={certification.issuer}
                            onChange={(event) =>
                                onChange({ issuer: event.target.value })
                            }
                            className={pillFieldClassName}
                        />
                    )}
                </Field>
                <Field label="Anno" error={yearError}>
                    {({ id, describedBy }) => (
                        <>
                            <Input
                                id={id}
                                aria-describedby={describedBy ?? `${id}-hint`}
                                aria-invalid={!!yearError}
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="AAAA"
                                value={certification.year}
                                onChange={(event) =>
                                    onChange({
                                        year: event.target.value
                                            .replace(/\D/g, '')
                                            .slice(0, 4),
                                    })
                                }
                                className={cn(
                                    pillFieldClassName,
                                    'tabular-nums',
                                )}
                            />
                            {!yearError && (
                                <span
                                    id={`${id}-hint`}
                                    className="text-[13px] leading-4.5 text-muted-foreground"
                                >
                                    4 cifre, es. 2020
                                </span>
                            )}
                        </>
                    )}
                </Field>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {/* The label opens the hidden file input. Sent with the whole registration. */}
                <label
                    className={cn(
                        'inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-4.5 text-[15px] font-semibold focus-within:ring-[3px] focus-within:ring-ring/50',
                        withFile
                            ? 'text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]'
                            : 'shadow-[inset_0_0_0_1px_var(--field)] hover:shadow-[inset_0_0_0_1.5px_var(--brand)]',
                    )}
                >
                    {withFile ? (
                        <Check aria-hidden="true" className="size-4.5" />
                    ) : (
                        <Upload aria-hidden="true" className="size-4.5" />
                    )}
                    {withFile
                        ? 'Attestato allegato · cambia'
                        : 'Allega attestato'}
                    <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        className="sr-only"
                        onChange={(event) => {
                            onChange({ file: event.target.files?.[0] ?? null });
                            // The same file can be chosen again after the ✕.
                            event.target.value = '';
                        }}
                    />
                </label>
                {/* Only the file goes: the certification stays. */}
                {withFile && (
                    <button
                        type="button"
                        aria-label="Rimuovi l’attestato"
                        onClick={() => onChange({ file: null, hasFile: false })}
                        className="flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <X aria-hidden="true" className="size-4.5" />
                    </button>
                )}
                <span className="text-[13px] leading-4.5 text-muted-foreground">
                    PDF, JPG o PNG. Privato, lo vede solo il nostro team.
                </span>
            </div>
        </DarkCard>
    );
}
