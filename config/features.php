<?php

/*
|--------------------------------------------------------------------------
| Parts of the site switched off
|--------------------------------------------------------------------------
|
| MioPersonal starts with the trainers only: gyms, their courses and the
| events are off, but their code stays and their tests keep running
| (phpunit.xml turns everything on). Off means no menu entry, no section,
| no sitemap URL, and a 404 on every page of that part (EnsureFeatureOn).
|
| Turned on with FEATURE_GYMS / FEATURE_COURSES / FEATURE_EVENTS=true in
| the .env. The courses need the gyms too; the events work without them
| (only the trainers' events). Read them through App\Support\Features.
|
*/

return [
    'gyms' => (bool) env('FEATURE_GYMS', false),
    'courses' => (bool) env('FEATURE_COURSES', false),
    'events' => (bool) env('FEATURE_EVENTS', false),
];
