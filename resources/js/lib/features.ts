import { usePage } from '@inertiajs/react';

/**
 * The parts of the site that can be switched off (config/features.php,
 * App\Support\Features): off, their menus, links and sections are hidden
 * and their pages are a 404. The courses are already off without the gyms.
 */
export type Features = {
    gyms: boolean;
    courses: boolean;
    events: boolean;
};

export type FeatureName = keyof Features;

/** Laravel's own error responses have no shared props: everything off there. */
const allOff: Features = { gyms: false, courses: false, events: false };

/** The parts switched on, from the shared prop `features`. */
export function useFeatures(): Features {
    const props: { features?: Features } = usePage().props;

    return props.features ?? allOff;
}

/**
 * Keeps the items of a menu or a list whose part is on: an item without
 * `feature` is always there (the trainers' ones).
 */
export function withFeatures<T extends { feature?: FeatureName }>(
    items: readonly T[],
    features: Features,
): T[] {
    return items.filter(
        (item) => item.feature === undefined || features[item.feature],
    );
}
