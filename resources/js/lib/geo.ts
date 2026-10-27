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
 * Why the position couldn't be read: 'denied' when the user blocked it,
 * 'insecure' on http:// pages (the browsers allow it only on HTTPS).
 */
export type PositionProblem =
    | 'unsupported'
    | 'insecure'
    | 'denied'
    | 'unavailable';

export class PositionError extends Error {
    readonly problem: PositionProblem;

    constructor(problem: PositionProblem) {
        super(`Position not available: ${problem}`);
        this.problem = problem;
    }
}

/**
 * The user's position, asked to the browser (it shows its own permission
 * prompt). It works only on HTTPS: on http:// pages it always fails.
 * The position stays in the browser, it is never sent to the server.
 * When it fails, the promise is rejected with a PositionError.
 */
export function currentPosition(): Promise<Point> {
    return new Promise((resolve, reject) => {
        if (!window.isSecureContext) {
            // A hint for who works on the site, e.g. on http://miopersonal.test.
            console.warn(
                'The position needs HTTPS: open the site with https://',
            );
            reject(new PositionError('insecure'));

            return;
        }

        if (!('geolocation' in navigator)) {
            reject(new PositionError('unsupported'));

            return;
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) =>
                resolve({ lat: coords.latitude, lng: coords.longitude }),
            ({ code }) =>
                reject(
                    new PositionError(
                        code === GeolocationPositionError.PERMISSION_DENIED
                            ? 'denied'
                            : 'unavailable',
                    ),
                ),
            // The city is enough: a rough and recent position is fine.
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
        );
    });
}
