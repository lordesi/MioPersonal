<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Messaggi": in lavorazione, back after the v1. Until then the messages of
 * the Contatti page arrive only by email (see ContactController).
 */
class AdminMessagesController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        return Inertia::render('admin/messages', [
            'adminArea' => $this->adminArea(),
            'contactEmail' => config('mail.contact_address'),
        ]);
    }
}
