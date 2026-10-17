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
    packages: PricePackage[];
    onChange: (packages: PricePackage[]) => void;
    /** To compare each package with its sessions bought one by one. */
    sessions: SessionType[];
    errors: string[];
};

/** "Pacchetti": up to 3, sessions × duration at a total price. */
export default function PackagesSection({
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
            title="Pacchetti"
            description="Facoltativi. Il risparmio per il cliente si calcola da solo."
            errors={errors}
            action={
                <span className="text-xs text-muted-foreground tabular-nums">
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
            <div>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    disabled={packages.length >= MAX_PACKAGES}
                    onClick={() => onChange([...packages, emptyPackage])}
                >
                    <Plus aria-hidden="true" />
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

    let saving = '';

    if (savingCents > 0) {
        saving = `Il cliente risparmia ${formatPrice(savingCents)} (${percent}%)`;
    } else if (separateCents !== null && item.priceCents !== null) {
        saving = 'Il pacchetto costa quanto le sedute separate';
    }

    return (
        <div className="relative grid items-center gap-x-4 gap-y-3.5 rounded-xl border p-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <span id={sessionsId} className="text-[13px] font-semibold">
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
                // On the phone in the top corner, from sm on at the end of the first row.
                className="absolute top-2 right-2 text-muted-foreground sm:static sm:justify-self-end"
                aria-label={`Elimina ${title}`}
                onClick={onRemove}
            >
                <Trash2 />
            </Button>

            <span id={minutesId} className="text-[13px] font-semibold">
                Durata
            </span>
            <ChoiceChips
                aria-labelledby={minutesId}
                className="gap-1.5 sm:col-span-2"
                options={withCurrent(PACKAGE_MINUTES, item.minutes).map(
                    (minutes) => ({
                        value: String(minutes),
                        label: shortDuration(minutes),
                    }),
                )}
                value={String(item.minutes)}
                onChange={(minutes) => onChange({ minutes: Number(minutes) })}
            />

            <label htmlFor={priceId} className="text-[13px] font-semibold">
                Prezzo
            </label>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-2">
                <EuroInput
                    id={priceId}
                    required
                    className="w-32"
                    value={item.priceCents}
                    onChange={(priceCents) => onChange({ priceCents })}
                />
                <span className="text-xs text-muted-foreground tabular-nums">
                    {separateCents !== null
                        ? `Separate costerebbero ${formatPrice(separateCents)}`
                        : `Imposta prima il prezzo di ${formatDuration(item.minutes)}`}
                </span>
                {saving && (
                    <span className="text-[13px] font-semibold tabular-nums">
                        {saving}
                    </span>
                )}
            </div>
        </div>
    );
}
