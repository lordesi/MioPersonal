import { CircleCheck } from 'lucide-react';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    minPriceCents,
    placeOptions,
    weeklyHours,
} from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import SectionLabel from '@/components/shared/section-label';
import UserAvatar from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

type StepReviewProps = {
    draft: TrainerDraft;
    fullName: string;
    onEdit: (step: number) => void;
    confirmed: boolean;
    onConfirmedChange: (confirmed: boolean) => void;
};

const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

/** Step 7: summary of every step, preview of the search card, final check. */
export default function StepReview({
    draft,
    fullName,
    onEdit,
    confirmed,
    onConfirmedChange,
}: StepReviewProps) {
    const minPrice = minPriceCents(draft);
    const priceLabel = minPrice === null ? '—' : formatPrice(minPrice);
    const placeNames = placeOptions
        .filter((place) => draft.places.includes(place.value))
        .map((place) => place.short);

    const rows = [
        { step: 1, label: 'Account', value: fullName },
        { step: 2, label: 'Profilo pubblico', value: draft.headline || '—' },
        {
            step: 3,
            label: 'Discipline e zone',
            value: [
                draft.disciplines.join(', ') || '—',
                plural(draft.zones.length, 'zona', 'zone'),
                placeNames.join(', '),
            ]
                .filter(Boolean)
                .join(' · '),
        },
        {
            step: 4,
            label: 'Servizi e prezzi',
            value: `${plural(draft.services.length, 'servizio', 'servizi')} · da ${priceLabel}`,
        },
        {
            step: 5,
            label: 'Orari e regole',
            value: `${weeklyHours(draft)} ore a settimana · preavviso ${draft.rules.noticeHours} ore`,
        },
        {
            step: 6,
            label: 'Certificazioni',
            value: plural(
                draft.certifications.filter((item) => item.title.trim()).length,
                'certificazione',
                'certificazioni',
            ),
        },
    ];

    const otherZones = draft.zones.length - 1;
    const otherZonesLabel =
        otherZones === 1 ? " e un'altra zona" : ` e altre ${otherZones} zone`;
    const previewZone =
        draft.zones.length > 0
            ? `${draft.zones[0]}${otherZones > 0 ? otherZonesLabel : ''}`
            : draft.places.includes('online')
              ? 'Solo online'
              : 'Nessuna zona';

    return (
        <>
            <StepTitle
                title="Controlla e invia"
                description="Il nostro team controlla ogni profilo prima di pubblicarlo."
            />

            <div className="flex flex-wrap items-start gap-5">
                <ul className="min-w-0 flex-[999_1_320px] overflow-hidden rounded-lg border">
                    {rows.map((row) => (
                        <li
                            key={row.step}
                            className="flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0"
                        >
                            <CircleCheck
                                aria-hidden="true"
                                className="size-4 flex-none"
                            />
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-sm font-semibold">
                                    {row.label}
                                </span>
                                <span className="truncate text-xs text-muted-foreground tabular-nums">
                                    {row.value}
                                </span>
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="underline"
                                onClick={() => onEdit(row.step)}
                            >
                                Modifica
                            </Button>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-[1_1_240px] flex-col gap-2">
                    <SectionLabel as="span">
                        Anteprima nella ricerca
                    </SectionLabel>
                    <div className="flex gap-3 rounded-xl border bg-background p-3.5">
                        <UserAvatar name={fullName} size="xl" shape="rounded" />
                        <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                    {fullName}
                                </span>
                                <Badge variant="outline">Nuovo</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {previewZone}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {draft.disciplines.slice(0, 3).map((name) => (
                                    <Badge key={name} variant="secondary">
                                        {name}
                                    </Badge>
                                ))}
                            </div>
                            <span className="text-sm tabular-nums">
                                <span className="text-muted-foreground">
                                    da
                                </span>{' '}
                                <strong>{priceLabel}</strong>{' '}
                                <span className="text-muted-foreground">
                                    / seduta
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <ConsentCheckbox
                name="confirm_truthful"
                checked={confirmed}
                onCheckedChange={onConfirmedChange}
            >
                Confermo che le informazioni e le certificazioni sono vere.
            </ConsentCheckbox>
        </>
    );
}
