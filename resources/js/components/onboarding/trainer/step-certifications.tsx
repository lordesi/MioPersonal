import { Award, Check, Lock, Plus, Trash2, Upload, X } from 'lucide-react';
import { useId } from 'react';
import type { ReactNode } from 'react';
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
import {
    DarkPanel,
    StepColumns,
} from '@/components/onboarding/trainer/onboarding-shell';
import NumberedSection from '@/components/trainer/area/numbered-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/** A started certification needs every field (the certificate file stays optional). */
const REQUIRED = 'Obbligatorio se aggiungi la certificazione.';

/** The year is wrong only once the 4 digits are there: not while typing. */
export function wrongYear(certification: Certification): boolean {
    return certification.year.length === 4 && !isValidYear(certification.year);
}

/**
 * Step 6 (optional): degrees and certifications, at most 3, checked by the
 * team before approval. A started one needs title, issuer and year.
 */
export default function StepCertifications({ draft, update }: StepProps) {
    const certifications = draft.certifications;
    const full = certifications.length >= MAX_CERTIFICATIONS;

    const change = (index: number, changes: Partial<Certification>) =>
        update({
            certifications: certifications.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        });

    return (
        <StepColumns aside={<CertificationsPreview draft={draft} />}>
            <NumberedSection
                step={<Award aria-hidden="true" />}
                title="Le tue certificazioni"
                description="Lauree, diplomi, corsi e attestati."
                action={
                    <span className="inline-flex h-6.5 items-center rounded-full bg-secondary px-2.5 text-xs font-semibold tabular-nums">
                        {certifications.length} di {MAX_CERTIFICATIONS} al
                        massimo
                    </span>
                }
                className="gap-4.5"
            >
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

                {certifications.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-input p-4.5 text-sm text-foreground/70">
                        Nessuna certificazione. Puoi saltare questo passo e
                        aggiungerle più avanti.
                    </p>
                )}

                <Button
                    type="button"
                    variant="outline"
                    disabled={full}
                    onClick={() =>
                        update({
                            certifications: [
                                ...certifications,
                                { title: '', issuer: '', year: '' },
                            ],
                        })
                    }
                    className="h-11 self-start rounded-xl border-input px-4 font-semibold disabled:opacity-40"
                >
                    <Plus aria-hidden="true" strokeWidth={2.5} />
                    Aggiungi una certificazione
                </Button>
            </NumberedSection>
        </StepColumns>
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
        <div className="flex flex-col gap-3.5 rounded-[18px] border bg-muted/50 p-4.5">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] leading-4.5 font-bold tracking-[0.04em] text-muted-foreground tabular-nums">
                    CERTIFICAZIONE {number}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Elimina certificazione ${number}`}
                    onClick={onRemove}
                    className="size-9 rounded-[10px] text-foreground/70"
                >
                    <Trash2 />
                </Button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
                <Field
                    label="Titolo"
                    error={missing(certification.title)}
                    className="col-span-full"
                >
                    {(props) => (
                        <Input
                            {...props}
                            placeholder="Es. Laurea in Scienze Motorie"
                            value={certification.title}
                            onChange={(event) =>
                                onChange({ title: event.target.value })
                            }
                            className="h-11.5 rounded-xl bg-card px-3.5 text-[15px] md:text-[15px]"
                        />
                    )}
                </Field>
                <Field
                    label="Ente o scuola"
                    error={missing(certification.issuer)}
                >
                    {(props) => (
                        <Input
                            {...props}
                            placeholder="Es. Università di Milano"
                            value={certification.issuer}
                            onChange={(event) =>
                                onChange({ issuer: event.target.value })
                            }
                            className="h-11.5 rounded-xl bg-card px-3.5 text-[15px] md:text-[15px]"
                        />
                    )}
                </Field>
                <Field label="Anno" hint="4 cifre, es. 2020" error={yearError}>
                    {(props) => (
                        <Input
                            {...props}
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="AAAA"
                            value={certification.year}
                            onChange={(event) =>
                                onChange({
                                    // Only digits: letters are dropped as you type.
                                    year: event.target.value.replace(/\D/g, ''),
                                })
                            }
                            className="h-11.5 rounded-xl bg-card px-3.5 text-[15px] tabular-nums md:text-[15px]"
                        />
                    )}
                </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 border-t pt-3">
                {/* The label opens the hidden file input. Sent with the whole registration. */}
                <label
                    className={cn(
                        'inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-[10px] border px-3.5 text-[13px] font-semibold focus-within:ring-3 focus-within:ring-ring/50',
                        withFile
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-input bg-card hover:bg-secondary',
                    )}
                >
                    {withFile ? (
                        <Check
                            aria-hidden="true"
                            strokeWidth={2.5}
                            className="size-3.5"
                        />
                    ) : (
                        <Upload
                            aria-hidden="true"
                            strokeWidth={2.5}
                            className="size-3.5"
                        />
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
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Rimuovi l’attestato"
                        onClick={() => onChange({ file: null, hasFile: false })}
                        className="size-8"
                    >
                        <X />
                    </Button>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock aria-hidden="true" className="size-3.25" />
                    PDF, JPG o PNG. Privato, lo vede solo il nostro team.
                </span>
            </div>
        </div>
    );
}

/** A label above its field, with the hint or the error under it. */
function Field({
    label,
    hint,
    error,
    className,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    className?: string;
    children: (props: {
        id: string;
        'aria-describedby'?: string;
        'aria-invalid': boolean;
    }) => ReactNode;
}) {
    const id = useId();
    const note = error ?? hint;

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label htmlFor={id} className="text-sm font-semibold">
                {label}
            </label>
            {children({
                id,
                'aria-describedby': note ? `${id}-note` : undefined,
                'aria-invalid': !!error,
            })}
            {note && (
                <span
                    id={`${id}-note`}
                    className={cn(
                        'text-[13px] leading-4.5',
                        error ? 'text-destructive' : 'text-muted-foreground',
                    )}
                >
                    {note}
                </span>
            )}
        </div>
    );
}

/** The certifications as the profile will show them: title, issuer and year. */
function CertificationsPreview({ draft }: { draft: TrainerDraft }) {
    const written = draft.certifications.filter(
        (item) => item.title.trim() !== '',
    );

    return (
        <DarkPanel title="Anteprima">
            <div className="flex flex-col gap-2">
                {written.length > 0 ? (
                    written.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 rounded-2xl bg-sidebar-accent p-3.5"
                        >
                            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                                <Award aria-hidden="true" className="size-4" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-[15px] leading-5.5 font-semibold break-words">
                                    {item.title}
                                </span>
                                <span className="text-[13px] leading-4.5 text-sidebar-muted-foreground tabular-nums">
                                    {[
                                        item.issuer.trim(),
                                        item.year.length === 4 ? item.year : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' · ') ||
                                        'Ente e anno non indicati'}
                                </span>
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="rounded-2xl border border-dashed border-sidebar-border p-4 text-sm text-sidebar-muted-foreground">
                        Scrivi un titolo: la certificazione comparirà qui come
                        la vedranno i clienti.
                    </p>
                )}
            </div>
            <ul className="flex flex-col gap-3 border-t border-sidebar-border pt-4">
                {[
                    'Sul profilo compaiono titolo, ente e anno.',
                    'Gli attestati restano privati: servono solo per l’approvazione.',
                    'Puoi aggiungerle anche dopo, da Il mio profilo.',
                ].map((text) => (
                    <li
                        key={text}
                        className="flex gap-2.5 text-sm text-sidebar-foreground/90"
                    >
                        <span className="flex size-5.5 flex-none items-center justify-center rounded-full bg-sidebar-border">
                            <Check
                                aria-hidden="true"
                                className="size-3"
                                strokeWidth={3}
                            />
                        </span>
                        {text}
                    </li>
                ))}
            </ul>
        </DarkPanel>
    );
}
