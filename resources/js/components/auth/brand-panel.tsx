import BrandLogo from '@/components/layout/brand-logo';

type BrandPanelProps = {
    /** The big sentence in the middle. */
    title: string;
    text: string;
};

/** Green brand panel on the left of "Accedi" and "Conferma la tua email" (desktop only). */
export default function BrandPanel({ title, text }: BrandPanelProps) {
    return (
        <section
            aria-label="MioPersonal"
            className="hidden flex-[1_1_480px] flex-col justify-between gap-12 bg-primary p-12 text-primary-foreground md:flex"
        >
            <BrandLogo className="text-primary-foreground" />
            <div className="flex max-w-120 flex-col gap-4">
                <p className="text-5xl leading-13 font-bold tracking-tight">
                    {title}
                </p>
                <p className="text-lg opacity-75">{text}</p>
            </div>
            <p className="text-xs opacity-60">
                © {new Date().getFullYear()} MioPersonal
            </p>
        </section>
    );
}
