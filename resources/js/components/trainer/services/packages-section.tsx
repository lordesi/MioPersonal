import { Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';
import type {
    PricePackage,
    SessionType,
} from '@/components/onboarding/trainer/draft';
import {
    emptyPackage,
    MAX_PACKAGES,
} from '@/components/onboarding/trainer/draft';
import ChoiceChips from '@/components/shared/choice-chips';
import EuroInput from '@/components/trainer/services/euro-input';
import {
    PACKAGE_MINUTES,
    PACKAGE_SESSION_OPTIONS,
    packageComparison,
    shortDuration,
    withCurrent,
} from '@/components/trainer/services/pricing';
import SectionCard from '@/components/trainer/services/section-card';
import { Button } from '@/components/ui/button';
import { formatDuration, formatPrice } from '@/lib/format';

type PackagesSectionProps = {
    step: number;
    packages: PricePackage[];
    onChange: (packages: PricePackage[]) => void;
    /** To compare each package with its sessions bought one by one. */
    sessions: SessionType[];
    errors: string[];
};

/** "Pacchetti": up to 3, sessions × duration at a total price. */
export default function PackagesSection({
    step,
    packages,
    onChange,
    sessions,
    errors,
}: PackagesSectionProps) {
    const changePackage = (index: number, changes: Partial<PricePackage>) =>
        onChange(
            packages.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        );

    return (
        <SectionCard
            step={step}
            title="Pacchetti"
            description="Facoltativi. Il risparmio per il cliente si calcola da solo."
            errors={errors}
            action={
                <span className="inline-flex h-6.5 items-center rounded-full bg-secondary px-2.5 text-xs font-semibold tabular-nums">
                    {packages.length} di {MAX_PACKAGES}
                </span>
            }
        >
            {packages.map((item, index) => (
                <PackageCard
                    key={index}
                    item={item}
                    sessions={sessions}
                    onChange={(changes) => changePackage(index, changes)}
                    onRemove={() =>
                        onChange(packages.filter((_, i) => i !== index))
                    }
                />
            ))}
            {packages.length === 0 && (
                <p className="rounded-2xl border border-dashed border-input p-4 text-sm text-muted-foreground">
                    Nessun pacchetto. I pacchetti aiutano i clienti a impegnarsi
                    per più sedute.
                </p>
            )}
            <div>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-input px-4 font-semibold shadow-none"
                    disabled={packages.length >= MAX_PACKAGES}
                    onClick={() => onChange([...packages, emptyPackage])}
                >
                    <Plus aria-hidden="true" strokeWidth={2.5} />
                    Aggiungi un pacchetto
                </Button>
            </div>
        </SectionCard>
    );
}

function PackageCard({
    item,
    sessions,
    onChange,
    onRemove,
}: {
    item: PricePackage;
    sessions: SessionType[];
    onChange: (changes: Partial<PricePackage>) => void;
    onRemove: () => void;
}) {
    const sessionsId = useId();
    const minutesId = useId();
    const priceId = useId();
    const { separateCents, savingCents, percent } = packageComparison(
        item,
        sessions,
    );
    const title = `Pacchetto ${item.sessions} sedute da ${formatDuration(item.minutes)}`;

    return (
        <div className="flex flex-col gap-3.5 rounded-[18px] border bg-secondary/50 p-4">
            <div className="flex flex-wrap items-center gap-3">
                <span
                    id={sessionsId}
                    className="w-16 text-[13px] leading-4.5 font-semibold"
                >
                    Sedute
                </span>
                <ChoiceChips
                    aria-labelledby={sessionsId}
                    className="gap-1.5"
                    options={withCurrent(
                        PACKAGE_SESSION_OPTIONS,
                        item.sessions,
                    ).map((count) => ({
                        value: String(count),
                        label: `${count} sedute`,
                    }))}
                    value={String(item.sessions)}
                    onChange={(count) => onChange({ sessions: Number(count) })}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-10 text-muted-foreground"
                    aria-label={`Elimina ${title}`}
                    onClick={onRemove}
                >
                    <Trash2 />
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <span
                    id={minutesId}
                    className="w-16 text-[13px] leading-4.5 font-semibold"
                >
                    Durata
                </span>
                <ChoiceChips
                    aria-labelledby={minutesId}
                    className="gap-1.5"
                    options={withCurrent(PACKAGE_MINUTES, item.minutes).map(
                        (minutes) => ({
                            value: String(minutes),
                            label: shortDuration(minutes),
                        }),
                    )}
                    value={String(item.minutes)}
                    onChange={(minutes) =>
                        onChange({ minutes: Number(minutes) })
                    }
                />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <label
                    htmlFor={priceId}
                    className="w-16 text-[13px] leading-4.5 font-semibold"
                >
                    Prezzo
                </label>
                <EuroInput
                    id={priceId}
                    required
                    className="w-33"
                    value={item.priceCents}
                    onChange={(priceCents) => onChange({ priceCents })}
                />
                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                    {separateCents !== null
                        ? `Separate costerebbero ${formatPrice(separateCents)}`
                        : `Imposta il prezzo da ${shortDuration(item.minutes)} nel listino per calcolare il risparmio`}
                </span>
                {savingCents > 0 && (
                    <span className="inline-flex h-7 items-center rounded-full bg-foreground px-2.5 text-xs font-semibold text-background tabular-nums">
                        {`Il cliente risparmia ${formatPrice(savingCents)} (${percent}%)`}
                    </span>
                )}
            </div>
        </div>
    );
}
