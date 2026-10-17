/**
 * MapLibre, ready to use. Import this file with `await import('@/lib/map')`:
 * the library is heavy, so it is downloaded only by the pages that show a map.
 */
import type {
    ExpressionSpecification,
    LayerSpecification,
    LngLatBoundsLike,
} from 'maplibre-gl';
import { MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { circle } from '@/lib/geo';

// With Vite, MapLibre can't find its worker file by itself.
setWorkerUrl(workerUrl);

/** Free base style from OpenFreeMap (no API key, no request limits), repainted with our palette. */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

/** The map colors: the CSS variables `--map-*` in app.css, light and dark. */
const ROLES = [
    'land',
    'park',
    'water',
    'building',
    'road',
    'road-casing',
    'label',
    'label-halo',
    'water-label',
    'area',
] as const;

type Role = (typeof ROLES)[number];
type Palette = Record<Role, string>;

/** The circle of the "Zona" map: its center and radius in meters. */
export type Area = { lat: number; lng: number; radius: number };

/** Place names in Italian ("Milano", not "Milan"), or the local name if missing. */
const ITALIAN_NAME: ExpressionSpecification = [
    'coalesce',
    ['get', 'name:it'],
    ['get', 'name'],
];

function readPalette(): Palette {
    const css = getComputedStyle(document.documentElement);

    return Object.fromEntries(
        ROLES.map((role) => [
            role,
            css.getPropertyValue(`--map-${role}`).trim(),
        ]),
    ) as Palette;
}

/**
 * The color of a layer of the base style, from its group of data
 * ("source-layer"); null removes the layer: railways, borders, airports,
 * road names and numbers only clutter a small map.
 */
function roleOf(layer: LayerSpecification): Role | null {
    const group = 'source-layer' in layer ? layer['source-layer'] : layer.type;

    switch (group) {
        case 'background':
        case 'landuse':
            return 'land';
        case 'landcover':
            return layer.id.includes('wood') ? 'park' : 'land';
        case 'park':
            return 'park';
        case 'water':
            return 'water';
        case 'waterway':
        case 'water_name':
            return layer.type === 'symbol' ? 'water-label' : 'water';
        case 'building':
            return 'building';
        case 'place':
            return 'label';
        case 'transportation':
            if (layer.id.startsWith('railway')) {
                return null;
            }

            // The piers are areas: same color as the land.
            if (layer.type === 'fill') {
                return 'land';
            }

            return /casing|subtle/.test(layer.id) ? 'road-casing' : 'road';
        default:
            return null;
    }
}

function paint(
    layer: LayerSpecification,
    color: string,
    palette: Palette,
): LayerSpecification {
    switch (layer.type) {
        case 'background':
            return {
                ...layer,
                paint: { ...layer.paint, 'background-color': color },
            };
        case 'fill':
            return {
                ...layer,
                paint: {
                    ...layer.paint,
                    'fill-color': color,
                    'fill-outline-color': color,
                },
            };
        case 'line':
            return { ...layer, paint: { ...layer.paint, 'line-color': color } };
        case 'symbol':
            return {
                ...layer,
                layout: { ...layer.layout, 'text-field': ITALIAN_NAME },
                paint: {
                    ...layer.paint,
                    'text-color': color,
                    'text-halo-color': palette['label-halo'],
                },
            };
        default:
            return layer;
    }
}

/** The circle of the area: a light fill and a thin, sharp edge. */
function areaLayers(color: string): LayerSpecification[] {
    return [
        {
            id: 'area-fill',
            type: 'fill',
            source: 'area',
            paint: { 'fill-color': color, 'fill-opacity': 0.12 },
        },
        {
            id: 'area-line',
            type: 'line',
            source: 'area',
            paint: { 'line-color': color, 'line-width': 2 },
        },
    ];
}

/** The rectangle that holds the circle: the map zooms to show it all. */
export function areaBounds(area: Area): LngLatBoundsLike {
    const edge = circle(area, area.radius);
    const lngs = edge.map(([lng]) => lng);
    const lats = edge.map(([, lat]) => lat);

    return [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
    ];
}

/**
 * Loads the base style and changes it before it is drawn: our colors
 * (light or dark, from the current theme), fewer labels, Italian names,
 * and the circle of the area under the labels.
 */
export function styleMap(map: MapLibreMap, area: Area): void {
    const palette = readPalette();

    map.setStyle(MAP_STYLE, {
        transformStyle: (_previous, style) => {
            const layers = style.layers.flatMap((layer) => {
                const role = roleOf(layer);

                return role === null
                    ? []
                    : [paint(layer, palette[role], palette)];
            });
            const firstLabel = layers.findIndex(
                (layer) => layer.type === 'symbol',
            );

            layers.splice(
                firstLabel === -1 ? layers.length : firstLabel,
                0,
                ...areaLayers(palette.area),
            );

            return {
                ...style,
                sources: {
                    ...style.sources,
                    area: {
                        type: 'geojson',
                        data: {
                            type: 'Polygon',
                            coordinates: [circle(area, area.radius)],
                        },
                    },
                },
                layers,
            };
        },
    });
}

export { MapLibreMap };
