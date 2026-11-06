import { LocateFixed } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useLocateCity } from '@/hooks/use-locate-city';
import type { CityWithCoordinates } from '@/types';

type LocateItemProps = {
    cities: CityWithCoordinates[];
    onFound: (city: CityWithCoordinates) => void;
};

/**
 * "Usa la mia posizione" on top of the "Dove" menu: the closest city to the
 * user's position. Works only on HTTPS (lib/geo.ts); the error stays here.
 */
export default function LocateItem({ cities, onFound }: LocateItemProps) {
    const { locate, locating, error } = useLocateCity(cities, onFound);

    return (
        <div className="flex flex-col gap-1.5">
            <button
                type="button"
                onClick={locate}
                disabled={locating}
                // The menu would use the keys to move between the options.
                onKeyDown={(event) => event.stopPropagation()}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold outline-none hover:bg-accent focus-visible:bg-accent disabled:opacity-70"
            >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {locating ? (
                        <Spinner className="size-4" />
                    ) : (
                        <LocateFixed aria-hidden="true" className="size-4" />
                    )}
                </span>
                {locating ? 'Cerco la tua posizione…' : 'Usa la mia posizione'}
            </button>
            {error && (
                <p role="alert" className="px-3 text-[13px] text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
