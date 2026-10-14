<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DisciplineRequest;
use App\Models\Discipline;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Disciplines in Admin · Discipline e città: add, edit (name, hidden or
 * visible) and order. They are never deleted: trainers may use them.
 * TODO: record these actions in admin_activity_log (step 7 of docs/database/analisi.md).
 */
class AdminDisciplineController extends Controller
{
    public function store(DisciplineRequest $request): RedirectResponse
    {
        $name = trim($request->string('name')->value());

        Discipline::create([
            'name' => $name,
            // Fixed from now on: it is in the search URLs (?disciplina=…).
            'slug' => Str::slug($name),
            // At the end of the list.
            'sort' => (int) Discipline::max('sort') + 10,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "«{$name}» aggiunta."]);

        return back();
    }

    /** The slug stays the same when the name changes, so shared links keep working. */
    public function update(DisciplineRequest $request, Discipline $discipline): RedirectResponse
    {
        $discipline->update([
            'name' => trim($request->string('name')->value()),
            'is_active' => $request->boolean('is_active', $discipline->is_active),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Modifiche salvate.']);

        return back();
    }

    /** The ↑ ↓ arrows: swaps the discipline with the one before or after it. */
    public function move(Request $request, Discipline $discipline): RedirectResponse
    {
        $direction = $request->validate(['direction' => ['required', 'in:up,down']])['direction'];

        DB::transaction(function () use ($discipline, $direction) {
            $ids = Discipline::query()->orderBy('sort')->orderBy('id')->pluck('id')->all();
            $index = array_search($discipline->id, $ids, true);

            if (! is_int($index)) {
                return;
            }

            $other = $direction === 'up' ? $index - 1 : $index + 1;

            // Already first (↑) or last (↓): nothing to swap.
            if (! isset($ids[$other])) {
                return;
            }

            [$ids[$index], $ids[$other]] = [$ids[$other], $ids[$index]];

            // Numbers 10, 20, 30…: room to insert one in between later.
            foreach ($ids as $position => $id) {
                Discipline::whereKey($id)->update(['sort' => ($position + 1) * 10]);
            }
        });

        return back();
    }
}
