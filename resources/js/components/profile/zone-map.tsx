/**
 * Placeholder map like in the design: a grid with a circle on the area.
 * TODO: replace with a real map (needs a map library, to discuss).
 */
export default function ZoneMap({ areaLabel }: { areaLabel: string }) {
    return (
        <section aria-labelledby="zone-title" className="flex flex-col gap-3">
            <h2
                id="zone-title"
                className="text-xl font-semibold tracking-tight md:text-2xl"
            >
                Zona
            </h2>
            <div
                role="img"
                aria-label={`Mappa con la zona approssimativa: ${areaLabel}`}
                className="relative h-50 overflow-hidden rounded-xl border bg-muted bg-[linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] bg-size-[32px_32px] md:h-60"
            >
                <span className="absolute top-1/2 left-1/2 size-35 -translate-1/2 rounded-full border-2 border-foreground bg-muted-foreground/20" />
                <span className="absolute bottom-3.5 left-1/2 inline-flex h-7 -translate-x-1/2 items-center rounded-full border bg-background px-3 text-[13px] font-semibold whitespace-nowrap">
                    {areaLabel}
                </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
                Zona approssimativa. L’indirizzo esatto dello studio arriva con
                la conferma.
            </p>
        </section>
    );
}
