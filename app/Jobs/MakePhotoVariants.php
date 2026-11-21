<?php

namespace App\Jobs;

use App\Support\SafeImage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * The lighter copies of a photo just uploaded (SafeImage::VARIANTS), apart
 * from the request: until they are there, the pages show the original.
 */
class MakePhotoVariants implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public string $path)
    {
        // After the photo is saved with its row: a rolled-back upload makes no copies.
        $this->afterCommit();
    }

    /** @return list<int> seconds before each new try */
    public function backoff(): array
    {
        return [30, 120];
    }

    public function handle(): void
    {
        SafeImage::makeVariants($this->path);
    }
}
