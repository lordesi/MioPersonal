<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * What search engines and social networks read about a public page: the `seo`
 * prop of the page. resources/views/partials/seo.blade.php turns it into the
 * meta tags (description, canonical, robots, Open Graph) and the JSON-LD, in
 * the HTML sent by Laravel, so they are there even without the SSR server; the
 * page uses `title` for its <Head>.
 *
 * Pages without this prop are not indexed (private areas, forms).
 *
 * @phpstan-type SeoData array{title: string, description: string, index: bool, canonical: string|null, image: string|null, type: string, jsonLd: list<array<string, mixed>>}
 */
final class Seo
{
    /** Google cuts the description at about 155-160 characters. */
    private const DESCRIPTION_LENGTH = 158;

    /**
     * @param  string  $title  Without " - MioPersonal": the page adds it.
     * @param  string|null  $canonical  Absolute; null = the current URL without the query.
     * @param  string|null  $image  Absolute; null = public/images/og-default.png.
     * @param  list<array<string, mixed>>  $jsonLd  Schema.org objects, without "@context".
     * @return SeoData
     */
    public static function page(
        string $title,
        string $description,
        bool $index = true,
        ?string $canonical = null,
        ?string $image = null,
        string $type = 'website',
        array $jsonLd = [],
    ): array {
        return [
            'title' => $title,
            'description' => self::description($description),
            'index' => $index,
            'canonical' => $canonical,
            'image' => $image,
            'type' => $type,
            'jsonLd' => $jsonLd,
        ];
    }

    /**
     * The <script type="application/ld+json"> content. Encoded here and not in
     * Blade, where "@context" would be read as a directive. JSON_HEX_TAG keeps a
     * "</script>" written by a trainer from closing the tag.
     *
     * @param  list<array<string, mixed>>  $graph
     */
    public static function jsonLd(array $graph): string
    {
        return json_encode(
            ['@context' => 'https://schema.org', '@graph' => $graph],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_THROW_ON_ERROR,
        );
    }

    /** One line, cut at a word, without the spaces of the text. */
    public static function description(string $text): string
    {
        return Str::limit(Str::squish($text), self::DESCRIPTION_LENGTH, '…', preserveWords: true);
    }

    /**
     * "Home › Personal trainer a Roma › Marco Bianchi".
     *
     * @param  array<string, string>  $items  Name => absolute URL, in order.
     * @return array<string, mixed>
     */
    public static function breadcrumbs(array $items): array
    {
        $position = 0;

        return [
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_map(function (string $name, string $url) use (&$position) {
                return [
                    '@type' => 'ListItem',
                    'position' => ++$position,
                    'name' => $name,
                    'item' => $url,
                ];
            }, array_keys($items), $items),
        ];
    }

    /** "35 €", "35,50 €": prices are whole cents. */
    public static function euros(int $cents): string
    {
        return number_format($cents / 100, $cents % 100 === 0 ? 0 : 2, ',', '.').' €';
    }
}
