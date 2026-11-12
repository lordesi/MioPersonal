<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminArea;
use App\Http\Controllers\Controller;
use App\Support\AdminStats;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Statistiche": the numbers of the platform for the team and for a pitch
 * (App\Support\AdminStats).
 */
class AdminStatsController extends Controller
{
    use BuildsAdminArea;

    public function __invoke(): Response
    {
        return Inertia::render('admin/stats', [
            'adminArea' => $this->adminArea(),
            'stats' => (new AdminStats)->all(),
        ]);
    }
}
