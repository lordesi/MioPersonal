<?php

namespace App\Http\Controllers;

use App\Support\IndexNow;
use Illuminate\Http\Response;

/**
 * /{key}.txt: IndexNow reads the key here to trust the pings of
 * App\Support\IndexNow. Any other name is a missing page.
 */
class IndexNowKeyController extends Controller
{
    public function __invoke(string $indexNowKey): Response
    {
        $key = IndexNow::key();

        abort_if($key === null || ! hash_equals($key, $indexNowKey), 404);

        return response($key, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
