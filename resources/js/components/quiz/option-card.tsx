import { Check } from 'lucide-react';
import type { QuizOption } from '@/lib/quiz';
import { cn } from '@/lib/utils';

type OptionCardProps = {
    option: QuizOption;
    pressed: boolean;
    /** Square check for multiple choice, round for single choice. */
    multiple: boolean;
    onClick: () => void;
};

/** A big answer button of the quiz: tile, label, hint and check mark. */
export default function OptionCard({
    option,
    pressed,
    multiple,
    onClick,
}: OptionCardProps) {
    const Icon = option.icon;

    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                'flex min-h-17 w-full items-center gap-3.5 rounded-[14px] border px-3.5 py-3 text-left transition-colors md:min-h-21 md:px-4.5 md:py-4',
                pressed
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-accent',
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'flex size-10 flex-none items-center justify-center rounded-xl text-[15px] leading-none font-bold tracking-tight md:size-12',
                    pressed
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-muted text-foreground',
                )}
            >
                {Icon ? <Icon className="size-5" /> : option.glyph}
            </span>
            <span className="flex min-w-0 flex-col">
                <span className="text-base leading-[22px] font-semibold md:leading-6">
                    {option.label}
                </span>
                {option.hint && (
                    <span
                        className={cn(
                            'text-[13px] leading-[18px]',
                            pressed ? 'opacity-70' : 'text-muted-foreground',
                        )}
                    >
                        {option.hint}
                    </span>
                )}
            </span>
            <span
                aria-hidden="true"
                className={cn(
                    'ml-auto flex size-5.5 flex-none items-center justify-center',
                    multiple ? 'rounded-md' : 'rounded-full',
                    pressed
                        ? 'bg-primary-foreground text-primary'
                        : 'border-[1.5px] border-input text-transparent',
                )}
            >
                <Check className="size-3.5" strokeWidth={3} />
            </span>
        </button>
    );
}
