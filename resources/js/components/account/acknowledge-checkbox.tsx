import { useId } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type AcknowledgeCheckboxProps = {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    children: string;
};

/** "Ho capito che…": unlocks the button that deletes something for good. */
export default function AcknowledgeCheckbox({
    checked,
    onCheckedChange,
    children,
}: AcknowledgeCheckboxProps) {
    const id = useId();

    return (
        <div className="flex items-start gap-2.5">
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
                className="mt-0.5 size-5 rounded-md bg-background"
            />
            <Label htmlFor={id} className="text-sm leading-5 font-normal">
                {children}
            </Label>
        </div>
    );
}
