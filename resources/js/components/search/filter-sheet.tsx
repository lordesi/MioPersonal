import { SlidersHorizontal, X } from 'lucide-react';
import { useRef } from 'react';
import {
    pillClassName,
    pillOff,
    pillOn,
} from '@/components/search/filter-options';
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
import { cn } from '@/lib/utils';

const NONE = '__none__';

export type FilterSheetField =
    | {
          kind: 'choice';
          /** Unique on the page: the id of the title. */
          id: string;
          title: string;
          /** The first chip, without the filter, e.g. "Tutti". */
          noneLabel: string;
          options: { value: string; label: string }[];
          value: string | null;
          onChange: (value: string | null) => void;
      }
    | {
          /** Several values, e.g. the gym's services: none chosen = all. */
          kind: 'multi';
          id: string;
          title: string;
          options: { value: string; label: string }[];
          value: string[];
          onChange: (value: string[]) => void;
      }
    | {
          kind: 'toggle';
          id: string;
          title: string;
          checked: boolean;
          onChange: (checked: boolean) => void;
      };

type FilterSheetProps = {
    fields: FilterSheetField[];
    /** Results with the filters on: "Mostra 12 corsi". */
    total: number;
    noun: { one: string; many: string };
    onClear: () => void;
    className?: string;
};

/**
 * Phones only (courses and events): one "Filtri" pill instead of the row of
 * pills, opening a panel from the bottom with every filter. Each choice is
 * applied at once, like on desktop: the button at the bottom only closes it.
 * The same idea as MobileFilters of the trainers, for any list of filters.
 */
export default function FilterSheet({
    fields,
    total,
    noun,
    onClear,
    className,
}: FilterSheetProps) {
    const closeButton = useRef<HTMLButtonElement>(null);
    const count = fields.reduce(
        (total, field) =>
            total +
            (field.kind === 'multi'
                ? field.value.length
                : Number(
                      field.kind === 'choice'
                          ? field.value !== null
                          : field.checked,
                  )),
        0,
    );

    return (
        <Sheet>
            <SheetTrigger
                className={cn(
                    pillClassName,
                    count ? pillOn : pillOff,
                    'md:hidden',
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
                    {fields.map((field) =>
                        field.kind === 'multi' ? (
                            <section
                                key={field.id}
                                aria-labelledby={field.id}
                                className="flex flex-col gap-2.5"
                            >
                                <h3
                                    id={field.id}
                                    className="text-sm font-semibold"
                                >
                                    {field.title}
                                </h3>
                                <ChoiceChips
                                    multiple
                                    aria-labelledby={field.id}
                                    options={field.options}
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            </section>
                        ) : field.kind === 'choice' ? (
                            <section
                                key={field.id}
                                aria-labelledby={field.id}
                                className="flex flex-col gap-2.5"
                            >
                                <h3
                                    id={field.id}
                                    className="text-sm font-semibold"
                                >
                                    {field.title}
                                </h3>
                                <ChoiceChips
                                    aria-labelledby={field.id}
                                    options={[
                                        { value: NONE, label: field.noneLabel },
                                        ...field.options,
                                    ]}
                                    value={field.value ?? NONE}
                                    onChange={(value) =>
                                        field.onChange(
                                            value === NONE ? null : value,
                                        )
                                    }
                                />
                            </section>
                        ) : (
                            <div
                                key={field.id}
                                className="flex min-h-11 items-center justify-between gap-3"
                            >
                                <Label
                                    htmlFor={field.id}
                                    className="text-sm font-semibold"
                                >
                                    {field.title}
                                </Label>
                                <Switch
                                    id={field.id}
                                    checked={field.checked}
                                    onCheckedChange={field.onChange}
                                />
                            </div>
                        ),
                    )}
                </div>

                <div className="flex items-center gap-3 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClear}
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
                            Mostra {total} {total === 1 ? noun.one : noun.many}
                        </Button>
                    </SheetClose>
                </div>
            </SheetContent>
        </Sheet>
    );
}
