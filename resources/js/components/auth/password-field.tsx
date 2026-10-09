import { useState } from 'react';
import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Password input with the "Mostra / Nascondi" text button of the design. */
export default function PasswordField({
    className,
    ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
    const [shown, setShown] = useState(false);

    return (
        <div className="relative flex">
            <Input
                type={shown ? 'text' : 'password'}
                className={cn('h-11 pr-24 text-base md:text-base', className)}
                {...props}
            />
            <button
                type="button"
                aria-pressed={shown}
                onClick={() => setShown(!shown)}
                className="absolute top-1 right-1 h-9 rounded-md px-3 text-sm font-medium hover:bg-accent"
            >
                {shown ? 'Nascondi' : 'Mostra'}
            </button>
        </div>
    );
}
