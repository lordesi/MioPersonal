import { useId } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { TrainingPlace } from '@/types';

type PlacePickerProps = {
    /** The trainer's places in person (gyms, studios, home, park). */
    places: TrainingPlace[];
    value: number | null;
    onChange: (placeId: number | null) => void;
    /** dark: in the black booking box. */
    variant?: 'light' | 'dark';
};

/** The value of "Da concordare": no place chosen. */
const NONE = 'none';

/**
 * "Dove": the place of the session, when the trainer has more than one in
 * person. Optional: "Da concordare con il trainer" sends none.
 */
export default function PlacePicker({
    places,
    value,
    onChange,
    variant = 'light',
}: PlacePickerProps) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-1.5">
            <span
                id={labelId}
                className={cn(
                    'text-xs font-semibold',
                    variant === 'dark'
                        ? 'text-primary-foreground/60'
                        : 'text-muted-foreground',
                )}
            >
                Dove
            </span>
            <Select
                value={value === null ? NONE : String(value)}
                onValueChange={(next) =>
                    onChange(next === NONE ? null : Number(next))
                }
            >
                <SelectTrigger
                    aria-labelledby={labelId}
                    className={cn(
                        'h-11 w-full rounded-xl',
                        variant === 'dark' &&
                            'border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground',
                    )}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={NONE}>
                        Da concordare con il trainer
                    </SelectItem>
                    {places.map((place) => (
                        <SelectItem key={place.id} value={String(place.id)}>
                            {place.type === 'gym' || place.type === 'studio'
                                ? place.title
                                : `${place.title}${place.detail ? ` · ${place.detail}` : ''}`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
