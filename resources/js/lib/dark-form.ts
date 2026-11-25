/*
 * The look of the form controls on the dark pages (login, sign-up), from the
 * MioPersonal design system: the shadcn components with these classes.
 */

/** A text field: 54px, rounded, on the card color, grey outline (design "TextField"). */
export const darkFieldClassName =
    'h-13.5 rounded-2xl border-input bg-card px-4 text-[17px] md:text-[17px]';

/**
 * A switch with outlines only: grey and off on the left, turquoise and on
 * on the right (".sw-b" of the design).
 */
export const darkSwitchClassName =
    'border-0 data-[size=default]:h-7 data-[size=default]:w-12 data-[state=checked]:bg-transparent data-[state=unchecked]:bg-transparent shadow-[inset_0_0_0_1.5px_var(--field)] data-[state=checked]:shadow-[inset_0_0_0_1.5px_var(--brand)] [&>span]:size-4.5! [&>span]:translate-x-1.25! [&>span]:bg-field! [&>span[data-state=checked]]:translate-x-6.25! [&>span[data-state=checked]]:bg-brand!';

/**
 * The box of "Ho 18 anni o più": 22px, rounded, grey outline; turquoise
 * outline and tick when on (".spunta" of the design).
 */
export const darkCheckboxClassName =
    'mt-0 size-5.5 rounded-[7px] border-[1.5px] border-field bg-transparent data-[state=checked]:border-brand data-[state=checked]:bg-transparent data-[state=checked]:text-brand [&_svg]:size-3.5';
