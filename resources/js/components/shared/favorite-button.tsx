import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FavoriteButtonProps = {
    trainerName: string;
    pressed: boolean;
    onPressedChange: (pressed: boolean) => void;
    /** 'icon' = round heart on cards, 'labeled' = "Salva" button on the profile. */
    variant?: 'icon' | 'labeled';
    className?: string;
};

export default function FavoriteButton({
    trainerName,
    pressed,
    onPressedChange,
    variant = 'icon',
    className,
}: FavoriteButtonProps) {
    const heart = <Heart className={cn(pressed && 'fill-current')} />;

    if (variant === 'labeled') {
        return (
            <Button
                type="button"
                variant="outline"
                aria-pressed={pressed}
                onClick={() => onPressedChange(!pressed)}
                className={className}
            >
                {heart}
                {pressed ? 'Salvato' : 'Salva'}
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            aria-pressed={pressed}
            aria-label={`${pressed ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'} ${trainerName}`}
            onClick={() => onPressedChange(!pressed)}
            className={cn('rounded-full border-border md:size-10', className)}
        >
            {heart}
        </Button>
    );
}
