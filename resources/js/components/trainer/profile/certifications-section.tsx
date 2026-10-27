import { Check, Plus, Trash2, Upload, X } from 'lucide-react';
import type {
    Certification,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    FIRST_CERTIFICATION_YEAR,
    isCertificationValid,
    isFilled,
    isValidYear,
    MAX_CERTIFICATIONS,
} from '@/components/onboarding/trainer/draft';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import NumberedSection from '@/components/trainer/area/numbered-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type CertificationsSectionProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
    /** Messages from the server for these fields. */
    errors: string[];
};

/**
 * "Formazione e certificazioni" (section 4 of "Modifica profilo", optional):
 * at most 3. A started one needs title, issuer and year; the certificate
 * file stays optional and only the team sees it.
 */
export default function CertificationsSection({
    draft,
    update,
    errors,
}: CertificationsSectionProps) {
    const certifications = draft.certifications;
    const full = certifications.length >= MAX_CERTIFICATIONS;

    const change = (index: number, changes: Partial<Certification>) =>
        update({
            certifications: certifications.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        });

    return (
        <NumberedSection
            step={4}
            optional
            title={
                <>
                    Formazione e certificazioni{' '}
                    <span className="text-sm font-medium tracking-normal text-muted-foreground">
                        · facoltativa
                    </span>
                </>
            }
            description="Al massimo 3. Gli attestati non sono visibili sul profilo pubblico."
            action={
                <span className="inline-flex h-6.5 items-center rounded-full bg-secondary px-2.5 text-xs font-semibold tabular-nums">
                    {certifications.length} di {MAX_CERTIFICATIONS}
                </span>
            }
            className="gap-4.5"
        >
            <StepErrors title="Da sistemare:" errors={errors} />

            {certifications.map((certification, index) => {
                const withFile =
                    !!certification.file || !!certification.hasFile;

                return (
                    <div
                        key={index}
                        className="flex flex-col gap-3 rounded-[18px] border bg-muted/50 p-4"
                    >
                        <div className="grid grid-cols-[minmax(0,1fr)_88px_40px] items-center gap-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_96px_40px]">
                            <Input
                                aria-label="Titolo"
                                placeholder="Es. Laurea in Scienze motorie"
                                value={certification.title}
                                onChange={(event) =>
                                    change(index, {
                                        title: event.target.value,
                                    })
                                }
                                className="col-span-3 h-11 rounded-[10px] bg-background font-semibold sm:col-span-1"
                            />
                            <Input
                                aria-label="Ente"
                                placeholder="Ente o federazione"
                                value={certification.issuer}
                                onChange={(event) =>
                                    change(index, {
                                        issuer: event.target.value,
                                    })
                                }
                                className="h-11 rounded-[10px] bg-background"
                            />
                            <Input
                                aria-label="Anno"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="Anno"
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
                                className="h-11 rounded-[10px] bg-background tabular-nums"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Elimina certificazione"
                                onClick={() =>
                                    update({
                                        certifications: certifications.filter(
                                            (_, i) => i !== index,
                                        ),
                                    })
                                }
                                className="h-11 w-10 rounded-[10px] text-muted-foreground"
                            >
                                <Trash2 />
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* The label opens the hidden file input. Sent with "Salva modifiche". */}
                            <label
                                className={cn(
                                    'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[9px] border px-3 text-[13px] font-semibold focus-within:ring-3 focus-within:ring-ring/50',
                                    withFile
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-input bg-background hover:bg-secondary',
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
                                    ? 'Attestato caricato · cambia'
                                    : 'Carica attestato'}
                                <input
                                    type="file"
                                    accept="application/pdf,image/jpeg,image/png"
                                    className="sr-only"
                                    onChange={(event) => {
                                        change(index, {
                                            file:
                                                event.target.files?.[0] ?? null,
                                        });
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
                                    onClick={() =>
                                        change(index, {
                                            file: null,
                                            hasFile: false,
                                        })
                                    }
                                    className="size-8"
                                >
                                    <X />
                                </Button>
                            )}
                            <span className="text-xs text-muted-foreground">
                                PDF, JPG o PNG. Privato, lo vede solo il nostro
                                team.
                            </span>
                        </div>

                        <RowProblem certification={certification} />
                    </div>
                );
            })}

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
                className="h-11 self-start rounded-xl px-4 font-semibold disabled:opacity-40"
            >
                <Plus aria-hidden="true" strokeWidth={2.5} />
                Aggiungi una certificazione
            </Button>
        </NumberedSection>
    );
}

/** What a started certification still needs, or nothing. */
function RowProblem({ certification }: { certification: Certification }) {
    if (!isFilled(certification) || isCertificationValid(certification)) {
        return null;
    }

    // Only once the 4 digits are there: not while typing.
    const wrongYear =
        certification.year.length === 4 && !isValidYear(certification.year);

    return (
        <p className="text-[13px] leading-4.5 text-destructive">
            {wrongYear
                ? `Scrivi un anno tra il ${FIRST_CERTIFICATION_YEAR} e il ${new Date().getFullYear()}.`
                : 'Completa titolo, ente e anno, oppure elimina la certificazione.'}
        </p>
    );
}
