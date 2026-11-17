import { MapPin } from 'lucide-react';
import type { GymDraft } from '@/components/onboarding/gym/draft';
import {
    DESCRIPTION_MAX,
    DESCRIPTION_MIN,
} from '@/components/onboarding/gym/draft';
import {
    DarkError,
    Field,
    Optional,
    pillBoxClassName,
    pillFieldClassName,
    pillInnerClassName,
    Section,
} from '@/components/onboarding/gym/gym-fields';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

type StepDetailsProps = {
    draft: GymDraft;
    update: (changes: Partial<GymDraft>) => void;
    errors: Partial<Record<string, string>>;
    cities: CatalogOption[];
};

/** Step 2, "La tua palestra": name, where it is and the description. */
export default function StepDetails({
    draft,
    update,
    errors,
    cities,
}: StepDetailsProps) {
    const length = draft.description.trim().length;

    return (
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-14">
            <div className="flex flex-col gap-10 md:gap-9">
                <Field label="Nome della palestra" error={errors.name}>
                    {({ id, describedBy }) => (
                        <input
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={!!errors.name}
                            value={draft.name}
                            maxLength={120}
                            autoComplete="organization"
                            onChange={(event) =>
                                update({ name: event.target.value })
                            }
                            placeholder="Es. FitLab Milano Centro"
                            className={pillFieldClassName}
                        />
                    )}
                </Field>

                <Section title="Dove si trova">
                    <Field label="Via e numero civico" error={errors.address}>
                        {({ id, describedBy }) => (
                            <div className={pillBoxClassName}>
                                <MapPin
                                    aria-hidden="true"
                                    className="size-5 shrink-0"
                                />
                                <input
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={!!errors.address}
                                    value={draft.address}
                                    maxLength={200}
                                    autoComplete="street-address"
                                    onChange={(event) =>
                                        update({ address: event.target.value })
                                    }
                                    placeholder="Es. Via Roma 12"
                                    className={pillInnerClassName}
                                />
                            </div>
                        )}
                    </Field>
                    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2.5 md:grid-cols-[minmax(0,1fr)_10rem] md:gap-3">
                        <Field label="Città" error={errors.city}>
                            {({ id, describedBy }) => (
                                <Select
                                    value={draft.city}
                                    onValueChange={(city) => update({ city })}
                                >
                                    <SelectTrigger
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.city}
                                        className={cn(
                                            pillFieldClassName,
                                            'h-13! justify-between pr-4 data-placeholder:font-normal data-placeholder:text-muted-foreground md:h-12.5! [&_svg]:size-5! [&_svg]:opacity-100',
                                        )}
                                    >
                                        <SelectValue placeholder="Scegli la città" />
                                    </SelectTrigger>
                                    <SelectContent className="theme-dark max-h-80">
                                        {cities.map((city) => (
                                            <SelectItem
                                                key={city.value}
                                                value={city.value}
                                            >
                                                {city.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </Field>
                        <Field
                            label={
                                <>
                                    CAP <Optional>facolt.</Optional>
                                </>
                            }
                            error={errors.postal_code}
                        >
                            {({ id, describedBy }) => (
                                <input
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={!!errors.postal_code}
                                    inputMode="numeric"
                                    autoComplete="postal-code"
                                    maxLength={5}
                                    value={draft.postalCode}
                                    onChange={(event) =>
                                        update({
                                            postalCode:
                                                event.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                ),
                                        })
                                    }
                                    placeholder="20121"
                                    className={cn(
                                        pillFieldClassName,
                                        'tabular-nums',
                                    )}
                                />
                            )}
                        </Field>
                    </div>
                </Section>
            </div>

            <Section
                title="Descrizione"
                description="Spazi, attrezzature, atmosfera, a chi è adatta."
            >
                <div className="flex flex-col gap-2">
                    <textarea
                        aria-label="Descrizione della palestra"
                        aria-invalid={!!errors.description}
                        rows={6}
                        maxLength={DESCRIPTION_MAX}
                        value={draft.description}
                        onChange={(event) =>
                            update({ description: event.target.value })
                        }
                        placeholder="Racconta la palestra in poche righe."
                        className="min-h-42 w-full resize-y rounded-[26px] border-0 bg-transparent px-5 py-4 text-[17px] leading-6 text-foreground shadow-[inset_0_0_0_1px_var(--field)] outline-none placeholder:text-muted-foreground focus-visible:shadow-[inset_0_0_0_1.5px_var(--brand)] aria-invalid:shadow-[inset_0_0_0_1.5px_var(--destructive)] md:min-h-75 md:rounded-[20px] md:py-4.5"
                    />
                    <div className="flex justify-between px-1 text-[13px] leading-4.5 text-muted-foreground">
                        <span
                            className={cn(
                                length >= DESCRIPTION_MIN && 'text-brand',
                            )}
                        >
                            {length >= DESCRIPTION_MIN
                                ? 'Lunghezza giusta'
                                : `Almeno ${DESCRIPTION_MIN} caratteri`}
                        </span>
                        <span className="tabular-nums">
                            {draft.description.length} / {DESCRIPTION_MAX}
                        </span>
                    </div>
                    <DarkError message={errors.description} />
                </div>
            </Section>
        </div>
    );
}
