<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/** "Impostazioni e registro": empty for now, the menu item stays. */
class AdminSettingsController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        return Inertia::render('admin/settings', [
            'adminArea' => $this->adminArea(),
        ]);
    }
}
