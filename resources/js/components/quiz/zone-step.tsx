import { Check, LocateFixed, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import ChoiceChips from '@/components/shared/choice-chips';
import SectionLabel from '@/components/shared/section-label';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    DEFAULT_RADIUS,
    ONLINE_ZONE,
    radiusOptions,
    zoneSuggestions,
} from '@/lib/quiz';
import { cn } from '@/lib/utils';
import type { QuizAnswers } from '@/types';

/** Lower case and without accents, so "citta" finds "Città Studi". */
function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

type ZoneStepProps = {
    answers: QuizAnswers;
    /** The chosen suggestion: two suggestions can share the same area. */
    zoneLabel: string | null;
    onChange: (
        changes: Partial<QuizAnswers>,
        zoneLabel?: string | null,
    ) => void;
};

/** Question 4: neighbourhood, distance, or "online only". */
export default function ZoneStep({
    answers,
    zoneLabel,
    onChange,
}: ZoneStepProps) {
    const [query, setQuery] = useState('');
    const onlineOnly = answers.zone === ONLINE_ZONE;

    const suggestions = zoneSuggestions.filter((suggestion) =>
        normalize(`${suggestion.label} ${suggestion.detail}`).includes(
            normalize(query.trim()),
        ),
    );

    return (
        <div className="flex flex-col gap-3.5">
            <Label htmlFor="quiz-zona">Quartiere, via o CAP</Label>
            <div className="flex h-13 items-center gap-2.5 rounded-[14px] border-[1.5px] border-foreground bg-card px-4 md:h-14">
                <Search aria-hidden="true" className="size-5 flex-none" />
                <input
                    id="quiz-zona"
                    type="search"
                    autoComplete="street-address"
                    placeholder="Es. Città Studi, via Pacini, 20131"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted-foreground"
                />
            </div>

            {/* TODO: read the position from the browser and find the closest area. */}
            <Button
                type="button"
                variant="ghost"
                className="h-10 self-start px-3 underline"
            >
                <LocateFixed aria-hidden="true" />
                Usa la mia posizione attuale
            </Button>

            {suggestions.length > 0 && (
                <>
                    <SectionLabel as="span" id="quiz-suggerimenti">
                        Suggerimenti
                    </SectionLabel>
                    <div
                        role="group"
                        aria-labelledby="quiz-suggerimenti"
                        className="flex flex-col overflow-hidden rounded-[14px] border bg-card"
                    >
                        {suggestions.map((suggestion) => {
                            const selected =
                                !onlineOnly && zoneLabel === suggestion.label;

                            return (
                                <button
                                    key={suggestion.label}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() =>
                                        onChange(
                                            { zone: suggestion.zone },
                                            suggestion.label,
                                        )
                                    }
                                    className={cn(
                                        'flex min-h-14 w-full items-center gap-3 border-b px-3.5 py-2.5 text-left last:border-b-0',
                                        selected
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-accent',
                                    )}
                                >
                                    <MapPin
                                        aria-hidden="true"
                                        className="size-4.5 flex-none"
                                    />
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="text-[15px] leading-5 font-semibold">
                                            {suggestion.label}
                                        </span>
                                        <span className="text-xs opacity-70">
                                            {suggestion.detail}
                                        </span>
                                    </span>
                                    <Check
                                        aria-hidden="true"
                                        className={cn(
                                            'size-4 flex-none',
                                            !selected && 'opacity-0',
                                        )}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <span id="quiz-distanza" className="mr-1 text-sm font-medium">
                    Distanza massima
                </span>
                <ChoiceChips
                    aria-labelledby="quiz-distanza"
                    options={radiusOptions}
                    value={answers.radius ?? DEFAULT_RADIUS}
                    onChange={(radius) => onChange({ radius })}
                />
            </div>

            <button
                type="button"
                aria-pressed={onlineOnly}
                onClick={() =>
                    onlineOnly
                        ? onChange({ zone: null }, null)
                        : onChange({ zone: ONLINE_ZONE }, 'Solo online')
                }
                className={cn(
                    'flex min-h-13 items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-[15px] font-medium',
                    onlineOnly
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-accent',
                )}
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        'flex size-5.5 flex-none items-center justify-center rounded-md',
                        onlineOnly
                            ? 'bg-primary-foreground text-primary'
                            : 'border-[1.5px] border-input text-transparent',
                    )}
                >
                    <Check className="size-3.5" strokeWidth={3} />
                </span>
                Mi alleno solo online: la zona non conta
            </button>
        </div>
    );
}
