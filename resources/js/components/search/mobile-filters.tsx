import { router } from '@inertiajs/react';
import { Heart, SlidersHorizontal, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { ActiveFilters } from '@/components/search/filter-bar';
import {
    modeOptions,
    pillClassName,
    pillOff,
    pillOn,
    priceOptions,
    ratingOptions,
} from '@/components/search/filter-options';
import NameSearch from '@/components/search/name-search';
import ChoiceChips from '@/components/shared/choice-chips';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { trainingGoals } from '@/lib/goals';
import type { SearchFilters } from '@/lib/search';
import { cn } from '@/lib/utils';
import { login } from '@/routes';

const anyPrice = { value: 'qualsiasi', label: 'Qualsiasi' } as const;
const anyRating = { value: 'tutte', label: 'Tutte' } as const;

type MobileFiltersProps = {
    filters: ActiveFilters;
    /** Trainers matching the filters: the number on "Mostra … trainer". */
    total: number;
    /** The "Preferiti" filter: missing for trainers and admins. */
    favorites?: { count: number; guest: boolean };
    onChange: (changes: SearchFilters) => void;
    className?: string;
};

/**
 * Phones only: a "Filtri" button instead of the row of pills, and a panel
 * from the bottom with every filter. Each choice is applied right away,
 * like on desktop: the button at the bottom only closes the panel.
 */
export default function MobileFilters({
    filters,
    total,
    favorites,
    onChange,
    className,
}: MobileFiltersProps) {
    const closeButton = useRef<HTMLButtonElement>(null);
    const favoritesOnly = filters.preferiti !== null;

    // The filters of the panel that are on: the number on the button.
    const count = [
        filters.nome,
        filters.modalita,
        filters.prezzo,
        filters.valutazione,
        filters.preferiti,
        ...filters.obiettivo,
    ].filter(Boolean).length;

    const clear = () =>
        onChange({
            nome: null,
            modalita: null,
            prezzo: null,
            obiettivo: [],
            valutazione: null,
            preferiti: null,
        });

    return (
        <Sheet>
            <SheetTrigger
                className={cn(
                    pillClassName,
                    count ? pillOn : pillOff,
                    className,
                )}
            >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                Filtri
                {count > 0 && (
                    <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-primary-foreground px-1.5 text-xs font-bold text-primary tabular-nums">
                        {count}
                    </span>
                )}
            </SheetTrigger>
            <SheetContent
                side="bottom"
                showCloseButton={false}
                aria-describedby={undefined}
                overlayClassName="bg-black/40"
                // The panel would focus the name field and open the keyboard.
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    closeButton.current?.focus();
                }}
                className="max-h-[85dvh] gap-0 rounded-t-3xl"
            >
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <SheetTitle className="text-lg">Filtri</SheetTitle>
                    <SheetClose
                        ref={closeButton}
                        aria-label="Chiudi"
                        className="flex size-10 items-center justify-center rounded-full outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <X aria-hidden="true" className="size-5" />
                    </SheetClose>
                </div>

                <div className="flex flex-col gap-6 overflow-y-auto px-4 py-5">
                    <Section id="mobile-filter-name" title="Nome">
                        <NameSearch
                            applied={filters.nome}
                            onSearch={(nome) => onChange({ nome })}
                            className="w-full"
                        />
                    </Section>

                    <Section id="mobile-filter-mode" title="Modalità">
                        <ChoiceChips
                            aria-labelledby="mobile-filter-mode"
                            options={modeOptions}
                            value={filters.modalita ?? 'tutte'}
                            onChange={(value) =>
                                onChange({
                                    modalita: value === 'tutte' ? null : value,
                                })
                            }
                        />
                    </Section>

                    <Section id="mobile-filter-price" title="Prezzo a seduta">
                        <ChoiceChips
                            aria-labelledby="mobile-filter-price"
                            options={[anyPrice, ...priceOptions]}
                            value={filters.prezzo ?? anyPrice.value}
                            onChange={(value) =>
                                onChange({
                                    prezzo:
                                        value === anyPrice.value ? null : value,
                                })
                            }
                        />
                    </Section>

                    <Section id="mobile-filter-goal" title="Obiettivo">
                        <ChoiceChips
                            multiple
                            aria-labelledby="mobile-filter-goal"
                            options={trainingGoals}
                            value={filters.obiettivo}
                            onChange={(obiettivo) => onChange({ obiettivo })}
                        />
                    </Section>

                    <Section id="mobile-filter-rating" title="Valutazione">
                        <ChoiceChips
                            aria-labelledby="mobile-filter-rating"
                            options={[anyRating, ...ratingOptions]}
                            value={filters.valutazione ?? anyRating.value}
                            onChange={(value) =>
                                onChange({
                                    valutazione:
                                        value === anyRating.value
                                            ? null
                                            : value,
                                })
                            }
                        />
                    </Section>

                    {favorites && (
                        <div className="flex min-h-11 items-center justify-between gap-3">
                            <Label
                                htmlFor="mobile-filter-favorites"
                                className="gap-2 text-sm font-semibold"
                            >
                                <Heart
                                    aria-hidden="true"
                                    className="size-4 fill-current"
                                />
                                Solo preferiti
                                <span className="font-normal text-muted-foreground tabular-nums">
                                    ({favorites.count})
                                </span>
                            </Label>
                            <Switch
                                id="mobile-filter-favorites"
                                checked={favoritesOnly}
                                onCheckedChange={(on) =>
                                    favorites.guest
                                        ? router.visit(login())
                                        : onChange({
                                              preferiti: on ? '1' : null,
                                          })
                                }
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={clear}
                        disabled={count === 0}
                        className="h-12 rounded-full px-4 font-semibold underline"
                    >
                        Cancella filtri
                    </Button>
                    <SheetClose asChild>
                        <Button
                            type="button"
                            className="h-12 flex-1 rounded-full font-semibold"
                        >
                            {total === 1
                                ? 'Mostra 1 trainer'
                                : `Mostra ${total} trainer`}
                        </Button>
                    </SheetClose>
                </div>
            </SheetContent>
        </Sheet>
    );
}

/** A title and its choices; `id` is the title, for the screen readers. */
function Section({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-2.5">
            <h3 id={id} className="text-sm font-semibold">
                {title}
            </h3>
            {children}
        </section>
    );
}
