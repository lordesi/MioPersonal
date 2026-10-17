/** Average radius of the Earth, in km. */
const EARTH_RADIUS_KM = 6371;

type Point = { lat: number; lng: number };

/** Straight-line distance in km between two points (haversine formula). */
export function distanceKm(a: Point, b: Point): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(a.lat)) *
            Math.cos(toRadians(b.lat)) *
            Math.sin(dLng / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * The edge of a circle on the map, as [lng, lat] points (the order the maps
 * want); the last point repeats the first one to close the shape.
 */
export function circle(
    center: Point,
    radiusMeters: number,
    points = 64,
): [number, number][] {
    // The radius as an angle seen from the center of the Earth, in degrees.
    const degrees = (radiusMeters / 1000 / EARTH_RADIUS_KM) * (180 / Math.PI);
    // Going east, a degree is shorter the farther from the equator.
    const lngScale = 1 / Math.cos((center.lat * Math.PI) / 180);

    return Array.from({ length: points + 1 }, (_, index) => {
        const angle = (index / points) * 2 * Math.PI;

        return [
            center.lng + degrees * Math.cos(angle) * lngScale,
            center.lat + degrees * Math.sin(angle),
        ];
    });
}

/** The city whose center is closest to the point; null for an empty list. */
export function closestCity<T extends Point>(
    cities: T[],
    point: Point,
): T | null {
    let closest: T | null = null;
    let closestDistance = Infinity;

    for (const city of cities) {
        const distance = distanceKm(city, point);

        if (distance < closestDistance) {
            closest = city;
            closestDistance = distance;
        }
    }

    return closest;
}

/**
 * The user's position, asked to the browser (it shows its own permission
 * prompt). It works only on HTTPS: on http:// pages it always fails.
 * The position stays in the browser, it is never sent to the server.
 */
export function currentPosition(): Promise<Point> {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('Geolocation not available'));

            return;
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) =>
                resolve({ lat: coords.latitude, lng: coords.longitude }),
            reject,
            // The city is enough: a rough and recent position is fine.
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
        );
    });
}
