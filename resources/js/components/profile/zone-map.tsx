import type { MapLibreMap } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

type ZoneMapProps = {
    areaLabel: string;
    /** Center of the circle (studio or city); null shows only the grid. */
    center: { lat: number; lng: number } | null;
    /** Radius of the circle, in meters. */
    radius: number;
};

const creditLink = 'underline-offset-2 hover:underline';

/**
 * Map of the area: a circle on the studio (its address is already public)
 * or on the city center. The grid stays underneath while the map loads (or
 * if the browser can't draw it).
 */
export default function ZoneMap({ areaLabel, center, radius }: ZoneMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { resolvedAppearance } = useAppearance();
    const lat = center?.lat;
    const lng = center?.lng;

    useEffect(() => {
        const container = containerRef.current;

        if (!container || lat === undefined || lng === undefined) {
            return;
        }

        let map: MapLibreMap | null = null;
        let cancelled = false;

        import('@/lib/map')
            .then(({ MapLibreMap, areaBounds, styleMap }) => {
                // The page was left (or the theme changed) during the download.
                if (cancelled) {
                    return;
                }

                const area = { lat, lng, radius };

                map = new MapLibreMap({
                    container,
                    // The whole circle in view; more room at the bottom for the label.
                    bounds: areaBounds(area),
                    fitBoundsOptions: {
                        padding: { top: 24, right: 24, bottom: 56, left: 24 },
                    },
                    // A "photo" of the area: on phones it doesn't block the page scroll.
                    interactive: false,
                    // The credits are under the map, see below.
                    attributionControl: false,
                });
                styleMap(map, area);
            })
            // Offline or no WebGL: the grid stays, nothing else to do.
            .catch(() => {});

        return () => {
            cancelled = true;
            map?.remove();
        };
        // On a theme change the map is created again and reads the new palette.
    }, [lat, lng, radius, resolvedAppearance]);

    return (
        <section aria-labelledby="zone-title" className="flex flex-col gap-3">
            <h2
                id="zone-title"
                className="text-xl font-semibold tracking-tight md:text-2xl"
            >
                Zona
            </h2>
            <div className="flex flex-col gap-1.5">
                <div
                    role="img"
                    aria-label={`Mappa con la zona: ${areaLabel}`}
                    className="relative h-50 overflow-hidden rounded-xl border bg-muted bg-[linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] bg-size-[32px_32px] md:h-60"
                >
                    {/* MapLibre sets its own position on the container: the wrapper does the layout. */}
                    <div className="absolute inset-0">
                        <div ref={containerRef} className="size-full" />
                    </div>
                    <span className="absolute bottom-3.5 left-1/2 inline-flex h-7 -translate-x-1/2 items-center rounded-full border bg-background px-3 text-[13px] font-semibold whitespace-nowrap">
                        {areaLabel}
                    </span>
                </div>
                {/* Required by the licence of the map data (OpenStreetMap, OpenMapTiles). */}
                <p className="text-right text-[11px] text-muted-foreground">
                    <a
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={creditLink}
                    >
                        © OpenStreetMap
                    </a>
                    {' · '}
                    <a
                        href="https://openmaptiles.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={creditLink}
                    >
                        © OpenMapTiles
                    </a>
                </p>
            </div>
        </section>
    );
}
