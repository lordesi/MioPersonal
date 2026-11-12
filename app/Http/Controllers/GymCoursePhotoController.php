<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Models\GymCourse;
use App\Models\GymCoursePhoto;
use App\Models\GymPhoto;
use App\Support\SafeImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * "Foto" of a course in the gym area: several, saved right away and public
 * at once. The first one is on the cards ("Metti per prima").
 */
class GymCoursePhotoController extends Controller
{
    use BuildsGymArea;

    /** "Aggiungi foto": one or more files, added at the end. */
    public function store(Request $request, GymCourse $course): RedirectResponse
    {
        $this->ensureOwn($course);
        $room = max(0, GymCourse::MAX_PHOTOS - $course->photos()->count());

        $request->validate([
            'photos' => ['required', 'array', 'min:1', 'max:'.$room],
            'photos.*' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:min_width=800,min_height=500'],
        ], [
            'photos.required' => 'Scegli almeno una foto.',
            'photos.max' => $room === 0
                ? 'Il corso ha già '.GymCourse::MAX_PHOTOS.' foto: eliminane una per aggiungerne altre.'
                : "Puoi aggiungere ancora {$room} foto.",
            'photos.*.image' => 'Le foto devono essere immagini JPG o PNG.',
            'photos.*.mimes' => 'Le foto devono essere immagini JPG o PNG.',
            'photos.*.max' => 'Ogni foto può pesare al massimo 5 MB.',
            'photos.*.dimensions' => 'Ogni foto deve essere almeno 800 × 500 px.',
            'photos.*.uploaded' => 'Non siamo riusciti a caricare una foto: riprova.',
        ]);

        /** @var list<UploadedFile> $files */
        $files = $request->file('photos');
        $written = [];

        try {
            DB::transaction(function () use ($course, $files, &$written) {
                $sort = (int) $course->photos()->max('sort');

                foreach ($files as $file) {
                    $path = SafeImage::store($file, "gyms/{$course->gym_profile_id}/courses", GymPhoto::DISK);
                    $written[] = $path;
                    $sort += 10;
                    $course->photos()->create(['path' => $path, 'sort' => $sort]);
                }
            });
        } catch (\Throwable $exception) {
            Storage::disk(GymPhoto::DISK)->delete($written);

            throw $exception;
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => count($files) === 1 ? 'Foto aggiunta.' : 'Foto aggiunte.',
        ]);

        return back();
    }

    /** "Metti per prima": the photo of the cards. */
    public function first(GymCourse $course, GymCoursePhoto $photo): RedirectResponse
    {
        $this->ensureOwn($course, $photo);

        $photo->forceFill(['sort' => ((int) $course->photos()->min('sort')) - 10])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Foto messa per prima.']);

        return back();
    }

    public function destroy(GymCourse $course, GymCoursePhoto $photo): RedirectResponse
    {
        $this->ensureOwn($course, $photo);

        $photo->delete();
        Storage::disk(GymPhoto::DISK)->delete($photo->path);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Foto eliminata.']);

        return back();
    }

    /** Another gym's course, or a photo of another course: as if it didn't exist. */
    private function ensureOwn(GymCourse $course, ?GymCoursePhoto $photo = null): void
    {
        abort_unless($course->gym_profile_id === $this->gymOrFail()->id, 404);
        abort_if($photo !== null && $photo->gym_course_id !== $course->id, 404);
    }
}
