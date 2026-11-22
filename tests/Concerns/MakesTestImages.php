<?php

namespace Tests\Concerns;

/** Images for the upload tests, made on the fly. */
trait MakesTestImages
{
    /**
     * A JPEG as a phone makes it: EXIF with Orientation 6 (turned) and a GPS block.
     */
    private function phonePhoto(int $width = 300, int $height = 200): string
    {
        $image = imagecreatetruecolor($width, $height);
        ob_start();
        imagejpeg($image);
        $jpeg = (string) ob_get_clean();

        // TIFF, little endian. IFD0 at 8: Orientation = 6, GPS IFD pointer.
        $ifd0 = pack('v', 2)
            .pack('vvVvv', 0x0112, 3, 1, 6, 0)
            .pack('vvVV', 0x8825, 4, 1, 8 + 2 + 2 * 12 + 4)
            .pack('V', 0);
        // GPS IFD: GPSLatitudeRef = "N".
        $gps = pack('v', 1).pack('vvV', 0x0001, 2, 2).'N'."\0\0\0".pack('V', 0);
        $exif = "Exif\0\0".'II'.pack('v', 42).pack('V', 8).$ifd0.$gps;

        // APP1 right after the start of image marker.
        return substr($jpeg, 0, 2)."\xFF\xE1".pack('n', strlen($exif) + 2).$exif.substr($jpeg, 2);
    }

    /**
     * A "decompression bomb": a PNG that says it is $width × $height but weighs a
     * few bytes. Only its header is valid, which is all getimagesize() reads.
     */
    private function pngBomb(int $width = 60_000, int $height = 60_000): string
    {
        $chunk = fn (string $type, string $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));

        return "\x89PNG\r\n\x1a\n"
            .$chunk('IHDR', pack('NNCCCCC', $width, $height, 8, 2, 0, 0, 0))
            .$chunk('IDAT', (string) gzcompress(''))
            .$chunk('IEND', '');
    }

    /** @return array<string, mixed> */
    private function exif(string $jpeg): array
    {
        return @exif_read_data('data://image/jpeg;base64,'.base64_encode($jpeg)) ?: [];
    }
}
