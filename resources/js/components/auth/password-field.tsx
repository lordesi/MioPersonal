import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PasswordFieldProps = Omit<ComponentProps<'input'>, 'type'> & {
    /** An icon inside the field, on the left (the input needs the room, e.g. pl-12). */
    icon?: ReactNode;
    /** The look of "Mostra / Nascondi". */
    toggleClassName?: string;
};

/** Password input with the "Mostra / Nascondi" text button of the design. */
export default function PasswordField({
    className,
    icon,
    toggleClassName,
    ...props
}: PasswordFieldProps) {
    const [shown, setShown] = useState(false);

    return (
        <div className="relative flex">
            {icon}
            <Input
                type={shown ? 'text' : 'password'}
                className={cn('h-11 pr-24 text-base md:text-base', className)}
                {...props}
            />
            <button
                type="button"
                aria-pressed={shown}
                onClick={() => setShown(!shown)}
                className={cn(
                    'absolute top-1 right-1 h-9 rounded-md px-3 text-sm font-medium hover:bg-accent',
                    toggleClassName,
                )}
            >
                {shown ? 'Nascondi' : 'Mostra'}
            </button>
        </div>
    );
}
