<?php

namespace Tests\Feature;

use App\Models\TrainerPhoto;
use App\Models\User;
use App\Support\SafeImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\Concerns\MakesTestImages;
use Tests\TestCase;

/** Uploaded photos lose their metadata: a phone photo can tell where it was taken. */
class SafeImageTest extends TestCase
{
    use MakesTestImages;
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

    public function test_a_decompression_bomb_is_refused_before_decoding()
    {
        // 60 000 × 60 000 px in a few bytes: GD would ask for about 14 GB.
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('too large');

        SafeImage::clean($this->pngBomb());
    }

    public function test_the_phone_photos_of_48_mp_are_still_within_the_limit()
    {
        $this->assertGreaterThan(8064 * 6048, SafeImage::MAX_PIXELS);
    }

    public function test_the_upload_of_a_bomb_gets_a_message_instead_of_an_error()
    {
        Storage::fake(User::AVATAR_DISK);
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('client.complete-profile.photo'), [
                'photo' => UploadedFile::fake()->createWithContent('bomba.png', $this->pngBomb()),
            ])
            ->assertSessionHasErrors(['photo' => 'La foto è troppo grande: usa un’immagine fino a 50 megapixel.']);

        $this->assertNull($client->refresh()->avatar_path);
        $this->assertSame([], Storage::disk(User::AVATAR_DISK)->allFiles());
    }

    public function test_the_lighter_copies_skip_a_bomb_already_on_the_disk()
    {
        Storage::fake(SafeImage::VARIANTS_DISK);
        Storage::disk(SafeImage::VARIANTS_DISK)->put('gyms/bomba.png', $this->pngBomb());

        $this->assertSame(0, SafeImage::makeVariants('gyms/bomba.png'));
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
}
