/**
 * The `seo` prop of the public pages (App\Support\Seo). Laravel writes the
 * meta tags and the JSON-LD (resources/views/partials/seo.blade.php); the
 * page only uses `title` for its <Head>.
 */
export type SeoData = {
    /** Without " - MioPersonal": the title callback of app.tsx adds it. */
    title: string;
    description: string;
    index: boolean;
    canonical: string | null;
    image: string | null;
    type: string;
    jsonLd: Record<string, unknown>[];
};
