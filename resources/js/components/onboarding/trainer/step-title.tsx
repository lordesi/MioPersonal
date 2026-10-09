/** Title and subtitle at the top of every registration step. */
export default function StepTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <h1 className="text-[26px] leading-8 font-semibold tracking-tight md:text-3xl">
                {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
