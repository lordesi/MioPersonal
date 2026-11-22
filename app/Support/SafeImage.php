<?php

namespace App\Support;

use App\Jobs\MakePhotoVariants;
use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Photos people upload (avatars, trainer portraits and galleries) are saved
 * drawn again with GD, never as received:
 * - no metadata: a phone photo can carry the GPS position where it was taken
 *   (e.g. the trainer's home), the phone model, the date;
 * - turned upright by the EXIF orientation, which is lost with the metadata;
 * - at most MAX_SIDE px on the long side: lighter pages, and less memory;
 * - only real JPEG/PNG pixels: anything hidden in the file is dropped.
 *
 * The public ones also get lighter WebP copies for the pages (VARIANTS).
 */
class SafeImage
{
    /** The long side of the saved photo, at most. */
    public const MAX_SIDE = 2000;

    /**
     * The largest photo accepted, in pixels: 50 MP, above the 48 MP of the
     * phones. Without it, a small PNG of one colour (it compresses about 1000
     * to 1) asks GD for gigabytes and takes the server down (a "decompression
     * bomb"). The upload rules give the message first (App\Rules\ImagePixels).
     */
    public const MAX_PIXELS = 50_000_000;

    private const JPEG_QUALITY = 85;

    /**
     * Stores the cleaned photo with a random name, as UploadedFile::store() does.
     *
     * @return string the path on the disk
     */
    public static function store(UploadedFile $file, string $directory, string $disk): string
    {
        [$contents, $extension] = self::clean((string) file_get_contents($file->getRealPath()));

        $path = trim($directory, '/').'/'.Str::random(40).'.'.$extension;

        if (! Storage::disk($disk)->put($path, $contents)) {
            throw new RuntimeException("The photo could not be stored on [{$disk}].");
        }

        // The lighter copies for the pages, in the queue: the upload doesn't wait for them.
        if ($disk === self::VARIANTS_DISK) {
            MakePhotoVariants::dispatch($path);
        }

        return $path;
    }

    /**
     * The lighter copies of the public photos, in WebP: name => long side in px.
     * sm for the avatars, md for the cards, lg for the main photo and the
     * galleries; the original (MAX_SIDE) stays for the edit pages, the admin
     * and the previews of the social networks.
     */
    public const VARIANTS = ['sm' => 320, 'md' => 800, 'lg' => 1600];

    /** Only the public photos: chat photos and documents are never on a page as they are. */
    public const VARIANTS_DISK = 'public';

    private const WEBP_QUALITY = 80;

    /** Next to the original, with its whole name: "a.jpg" → "a.jpg.md.webp" (see pruneVariants()). */
    public static function variantPath(string $path, string $size): string
    {
        return "{$path}.{$size}.webp";
    }

    /**
     * The address of the photo in this size, or of the original while the
     * copy isn't there yet (just uploaded, or from before the copies).
     *
     * @param  'sm'|'md'|'lg'|null  $size  null = the original
     */
    public static function url(string $disk, string $path, ?string $size = null): string
    {
        $storage = Storage::disk($disk);

        if ($size !== null && $disk === self::VARIANTS_DISK && $storage->exists($variant = self::variantPath($path, $size))) {
            return $storage->url($variant);
        }

        return $storage->url($path);
    }

    /**
     * Writes the copies of the photo that are missing.
     *
     * @return int how many were written
     */
    public static function makeVariants(string $path): int
    {
        $storage = Storage::disk(self::VARIANTS_DISK);
        $missing = array_filter(self::VARIANTS, fn (int $side, string $size) => ! $storage->exists(self::variantPath($path, $size)), ARRAY_FILTER_USE_BOTH);

        if ($missing === [] || ! $storage->exists($path)) {
            return 0;
        }

        $contents = (string) $storage->get($path);
        $info = @getimagesizefromstring($contents);

        // Not an image, or one never cleaned by store() (too large to decode).
        if ($info === false || $info[0] * $info[1] > self::MAX_PIXELS) {
            return 0;
        }

        self::ensureMemory($info[0] * $info[1]);
        $image = @imagecreatefromstring($contents);

        if (! $image instanceof GdImage) {
            return 0;
        }

        // The original is already upright and clean (store()): only smaller.
        $isJpeg = $info[2] === IMAGETYPE_JPEG;
        $written = 0;

        foreach ($missing as $size => $side) {
            $copy = self::shrink($image, $isJpeg, $side);

            ob_start();
            imagewebp($copy, null, self::WEBP_QUALITY);
            $webp = (string) ob_get_clean();

            if ($webp !== '' && $storage->put(self::variantPath($path, $size), $webp)) {
                $written++;
            }
        }

        return $written;
    }

    /**
     * Deletes the copies whose original is gone (a photo replaced or
     * deleted, an account closed): no place that deletes a photo has to know
     * about them.
     *
     * @return int how many were deleted
     */
    public static function pruneVariants(): int
    {
        $storage = Storage::disk(self::VARIANTS_DISK);
        $pattern = '/\.('.implode('|', array_keys(self::VARIANTS)).')\.webp$/';
        $deleted = 0;

        foreach ($storage->allFiles() as $file) {
            if (preg_match($pattern, $file) === 1 && ! $storage->exists((string) preg_replace($pattern, '', $file))) {
                $deleted += (int) $storage->delete($file);
            }
        }

        return $deleted;
    }

    /**
     * The public photos without all their copies (uploaded before them, or a
     * job that failed), at most `$limit`.
     *
     * @return list<string>
     */
    public static function withoutVariants(int $limit): array
    {
        $storage = Storage::disk(self::VARIANTS_DISK);
        $paths = [];

        foreach ($storage->allFiles() as $file) {
            if (preg_match('/\.(jpe?g|png)$/i', $file) !== 1) {
                continue;
            }

            foreach (array_keys(self::VARIANTS) as $size) {
                if (! $storage->exists(self::variantPath($file, $size))) {
                    $paths[] = $file;

                    break;
                }
            }

            if (count($paths) >= $limit) {
                break;
            }
        }

        return $paths;
    }

    /**
     * The photo drawn again, without metadata.
     *
     * @return array{string, 'jpg'|'png'} the new file and its extension
     */
    public static function clean(string $contents): array
    {
        $info = @getimagesizefromstring($contents);

        if ($info === false || ! in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG], true)) {
            throw new RuntimeException('Not a JPEG or PNG image.');
        }

        $isJpeg = $info[2] === IMAGETYPE_JPEG;

        // Checked before decoding: a few MB of PNG can hold billions of pixels.
        self::ensureNotTooLarge($info[0], $info[1]);

        // A 5 MB JPEG can be 48 MP: about 200 MB once decoded.
        self::ensureMemory($info[0] * $info[1]);

        $image = @imagecreatefromstring($contents);

        if (! $image instanceof GdImage) {
            throw new RuntimeException('The image could not be read.');
        }

        if ($isJpeg) {
            $image = self::upright($image, $contents);
        }

        $image = self::shrink($image, $isJpeg, self::MAX_SIDE);

        ob_start();
        $isJpeg ? imagejpeg($image, null, self::JPEG_QUALITY) : imagepng($image, null, 6);
        $clean = (string) ob_get_clean();

        return [$clean, $isJpeg ? 'jpg' : 'png'];
    }

    /** Turns the photo as the camera says (EXIF Orientation 1–8). */
    private static function upright(GdImage $image, string $contents): GdImage
    {
        if (! function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data('data://image/jpeg;base64,'.base64_encode($contents));
        $orientation = (int) ($exif['Orientation'] ?? 1);

        if (in_array($orientation, [2, 4, 5, 7], true)) {
            imageflip($image, IMG_FLIP_HORIZONTAL);
        }

        $angle = match ($orientation) {
            3, 4 => 180,
            5, 6 => 270, // GD turns counterclockwise.
            7, 8 => 90,
            default => 0,
        };

        if ($angle !== 0) {
            $rotated = imagerotate($image, $angle, 0);

            if ($rotated instanceof GdImage) {
                $image = $rotated;
            }
        }

        return $image;
    }

    private static function shrink(GdImage $image, bool $isJpeg, int $maxSide): GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $long = max($width, $height);

        if ($long <= $maxSide) {
            if (! $isJpeg) {
                imagesavealpha($image, true);
            }

            return $image;
        }

        $scale = $maxSide / $long;
        $newWidth = max(1, (int) round($width * $scale));
        $newHeight = max(1, (int) round($height * $scale));

        $resized = imagecreatetruecolor($newWidth, $newHeight);

        if (! $isJpeg) {
            // Transparent PNGs stay transparent.
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
        }

        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        return $resized;
    }

    /** About 5 bytes per pixel for GD, twice while resizing, plus some room. */
    private static function ensureNotTooLarge(int $width, int $height): void
    {
        if ($width < 1 || $height < 1 || $width * $height > self::MAX_PIXELS) {
            throw new RuntimeException("The image is too large ({$width}×{$height}).");
        }
    }

    /** Raised only within MAX_PIXELS (ensureNotTooLarge): at most about 560 MB. */
    private static function ensureMemory(int $pixels): void
    {
        $needed = $pixels * 5 * 2 + 64 * 1024 * 1024;
        $limit = self::bytes((string) ini_get('memory_limit'));

        if ($limit !== -1 && memory_get_usage() + $needed > $limit) {
            ini_set('memory_limit', (string) (memory_get_usage() + $needed));
        }
    }

    private static function bytes(string $value): int
    {
        $value = trim($value);

        if ($value === '-1') {
            return -1;
        }

        $number = (int) $value;

        return match (strtolower(substr($value, -1))) {
            'g' => $number * 1024 ** 3,
            'm' => $number * 1024 ** 2,
            'k' => $number * 1024,
            default => $number,
        };
    }
}
