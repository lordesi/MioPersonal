<?php

namespace App\Rules;

use App\Support\SafeImage;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * A photo within SafeImage::MAX_PIXELS: the message for the form, before
 * SafeImage refuses to decode it. Only the header is read (getimagesize).
 * Files that are not images (a PDF certificate) are left to the other rules.
 */
class ImagePixels implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile || ! $value->isValid()) {
            return;
        }

        $size = @getimagesize($value->getRealPath());

        if ($size !== false && $size[0] * $size[1] > SafeImage::MAX_PIXELS) {
            $fail('La foto è troppo grande: usa un’immagine fino a '.intdiv(SafeImage::MAX_PIXELS, 1_000_000).' megapixel.');
        }
    }
}
