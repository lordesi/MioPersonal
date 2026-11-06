<?php

namespace Tests\Feature;

use App\Models\TrainerPhoto;
use App\Models\User;
use App\Support\SafeImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

/** Uploaded photos lose their metadata: a phone photo can tell where it was taken. */
class SafeImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_test_photo_really_has_gps_and_orientation()
    {
        $exif = $this->exif($this->phonePhoto());

        $this->assertSame(6, $exif['Orientation']);
        $this->assertSame('N', $exif['GPSLatitudeRef']);
    }

    public function test_metadata_is_removed_and_the_photo_turned_upright()
    {
        [$clean, $extension] = SafeImage::clean($this->phonePhoto(width: 300, height: 200));

        $this->assertSame('jpg', $extension);
        $exif = $this->exif($clean);
        $this->assertArrayNotHasKey('GPSLatitudeRef', $exif);
        $this->assertArrayNotHasKey('Orientation', $exif);

        // Orientation 6: the camera was turned, the photo is portrait.
        [$width, $height] = getimagesizefromstring($clean);
        $this->assertSame([200, 300], [$width, $height]);
    }

    public function test_big_photos_are_shrunk_to_2000_px_and_pngs_stay_pngs()
    {
        $image = imagecreatetruecolor(3000, 1500);
        ob_start();
        imagepng($image);

        [$clean, $extension] = SafeImage::clean((string) ob_get_clean());

        $this->assertSame('png', $extension);
        $this->assertSame([2000, 1000], array_slice(getimagesizefromstring($clean), 0, 2));
    }

    public function test_anything_but_jpeg_or_png_is_refused()
    {
        $this->expectException(RuntimeException::class);

        SafeImage::clean('%PDF-1.4 not an image');
    }

    public function test_an_uploaded_avatar_is_saved_without_metadata()
    {
        Storage::fake(User::AVATAR_DISK);
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('client.complete-profile.photo'), [
                'photo' => UploadedFile::fake()->createWithContent('io.jpg', $this->phonePhoto(width: 600, height: 400)),
            ])
            ->assertSessionHasNoErrors();

        $path = (string) $client->refresh()->avatar_path;
        $this->assertStringEndsWith('.jpg', $path);
        $this->assertArrayNotHasKey('GPSLatitudeRef', $this->exif((string) Storage::disk(User::AVATAR_DISK)->get($path)));
    }

    public function test_the_command_cleans_the_photos_already_uploaded()
    {
        Storage::fake(User::AVATAR_DISK);
        $user = User::factory()->create();
        Storage::disk(User::AVATAR_DISK)->put('avatars/old.jpg', $this->phonePhoto());
        $user->forceFill(['avatar_path' => 'avatars/old.jpg'])->save();

        $this->artisan('photos:strip-metadata')->assertSuccessful();

        $this->assertArrayNotHasKey('GPSLatitudeRef', $this->exif((string) Storage::disk(TrainerPhoto::DISK)->get('avatars/old.jpg')));
    }

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

    /** @return array<string, mixed> */
    private function exif(string $jpeg): array
    {
        return @exif_read_data('data://image/jpeg;base64,'.base64_encode($jpeg)) ?: [];
    }
}
