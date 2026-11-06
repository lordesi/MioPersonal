import { useState } from 'react';
import { closestCity, currentPosition, PositionError } from '@/lib/geo';

export const LOCATION_ERROR =
    'Non riusciamo a leggere la tua posizione: scegli la città dall’elenco.';
export const LOCATION_DENIED =
    'Hai bloccato la posizione: attivala dalle impostazioni del browser o scegli la città dall’elenco.';

type Point = { lat: number; lng: number };

/**
 * "Usa la mia posizione": asks the browser for the position and gives the
 * closest city of the list. The position stays in the browser (lib/geo.ts).
 */
export function useLocateCity<T extends Point>(
    cities: T[],
    onFound: (city: T) => void,
) {
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const locate = () => {
        setLocating(true);
        setError(null);

        currentPosition()
            .then((position) => {
                const city = closestCity(cities, position);

                if (city) {
                    onFound(city);
                } else {
                    setError(LOCATION_ERROR);
                }
            })
            .catch((problem: unknown) =>
                setError(
                    problem instanceof PositionError &&
                        problem.problem === 'denied'
                        ? LOCATION_DENIED
                        : LOCATION_ERROR,
                ),
            )
            .finally(() => setLocating(false));
    };

    return { locate, locating, error };
}
