/** An item of the catalog lists (App\Support\CatalogOptions): value = slug, label = name. */
export type CatalogOption = {
    value: string;
    label: string;
};

/** A city (provincial capital), with its region for grouping the menus. */
export type CityOption = CatalogOption & {
    region: string;
};

/** A city with its center, to find the closest one to the user's position. */
export type CityWithCoordinates = CityOption & {
    lat: number;
    lng: number;
};
