import { Moon, Sun } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useAppearance } from '@/hooks/use-appearance';
import type { ResolvedAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const themes: { value: ResolvedAppearance; label: string; icon: typeof Sun }[] =
    [
        { value: 'light', label: 'Tema chiaro', icon: Sun },
        { value: 'dark', label: 'Tema scuro', icon: Moon },
    ];

/** Sun | moon switch; the choice is saved and shared with Settings → Aspetto. */
export default function ThemeToggle({ className }: { className?: string }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <div
            role="group"
            aria-label="Tema"
            className={cn('flex gap-0.5 rounded-lg bg-muted p-0.75', className)}
        >
            {themes.map((theme) => (
                <Toggle
                    key={theme.value}
                    aria-label={theme.label}
                    pressed={resolvedAppearance === theme.value}
                    onPressedChange={() => updateAppearance(theme.value)}
                    className="size-7.5 min-w-0 rounded-md p-0 text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                >
                    <theme.icon className="size-4" />
                </Toggle>
            ))}
        </div>
    );
}
