<?php

namespace App\Support;

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
 */
class SafeImage
{
    /** The long side of the saved photo, at most. */
    public const MAX_SIDE = 2000;

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

        return $path;
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

        // A 5 MB JPEG can be 48 MP: about 200 MB once decoded.
        self::ensureMemory($info[0] * $info[1]);

        $image = @imagecreatefromstring($contents);

        if (! $image instanceof GdImage) {
            throw new RuntimeException('The image could not be read.');
        }

        if ($isJpeg) {
            $image = self::upright($image, $contents);
        }

        $image = self::shrink($image, $isJpeg);

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

    private static function shrink(GdImage $image, bool $isJpeg): GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $long = max($width, $height);

        if ($long <= self::MAX_SIDE) {
            if (! $isJpeg) {
                imagesavealpha($image, true);
            }

            return $image;
        }

        $scale = self::MAX_SIDE / $long;
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
