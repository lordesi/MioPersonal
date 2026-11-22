<?php

namespace App\Http\Controllers;

use App\Mail\ProblemReported;
use App\Models\ProblemReport;
use App\Models\User;
use App\Rules\ImagePixels;
use App\Support\DeviceLabel;
use App\Support\PageAddress;
use App\Support\SafeImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * "Segnala un problema", for every logged-in user: saved for "Admin · Problemi
 * segnalati" and emailed to the team. The browser sends the page and the size
 * of the screen; the device comes from the User-Agent, in words.
 */
class ProblemReportController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:'.ProblemReport::MESSAGE_MAX],
            'page' => ['required', 'string', 'max:2000', 'starts_with:/'],
            'viewport' => ['nullable', 'string', 'regex:/^\d{2,5}×\d{2,5}$/u'],
            'installed' => ['nullable', 'boolean'],
            'screenshot' => ['nullable', 'image', new ImagePixels, 'mimes:jpg,jpeg,png', 'max:'.ProblemReport::SCREENSHOT_MAX_KB],
        ], [
            'message.required' => 'Scrivi cosa è successo.',
            'message.max' => 'Il testo può essere lungo al massimo '.ProblemReport::MESSAGE_MAX.' caratteri.',
            'screenshot.image' => 'Lo screenshot deve essere un’immagine JPG o PNG.',
            'screenshot.mimes' => 'Lo screenshot deve essere un’immagine JPG o PNG.',
            'screenshot.max' => 'Lo screenshot può pesare al massimo '.intdiv(ProblemReport::SCREENSHOT_MAX_KB, 1024).' MB.',
        ]);

        /** @var User $user */
        $user = $request->user();

        $screenshot = $request->file('screenshot');

        $report = new ProblemReport([
            'role' => $user->role->value,
            'message' => trim($data['message']),
            // "//evil.example" also starts with "/": only the path is kept.
            'page' => Str::limit(PageAddress::clean('/'.ltrim($data['page'], '/'), 300), 300, ''),
            'device' => Str::limit(DeviceLabel::from($request->userAgent()), 100, ''),
            'viewport' => $data['viewport'] ?? null,
            'installed' => (bool) ($data['installed'] ?? false),
            'screenshot_path' => $screenshot !== null ? SafeImage::store($screenshot, ProblemReport::FOLDER, ProblemReport::DISK) : null,
        ]);
        $report->user()->associate($user);
        $report->save();

        // Queued: the page answers without waiting for the mail provider.
        Mail::to(config('mail.contact_address'))->queue(new ProblemReported($report));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Grazie! Abbiamo ricevuto la segnalazione.']);

        return back();
    }
}
