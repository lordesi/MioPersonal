<?php

namespace App\Http\Requests\Admin;

use App\Models\Discipline;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * "Aggiungi" and "Modifica" of a discipline in Admin · Discipline e città.
 * The slug is made from the name only when the discipline is created.
 */
class DisciplineRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $discipline = $this->route('discipline');

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique(Discipline::class)->ignore($discipline instanceof Discipline ? $discipline->id : null),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Two names can give the same slug ("Pesi e bodybuilding" / "Pesi e Bodybuilding").
     *
     * @return list<\Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->route('discipline') !== null || $validator->errors()->has('name')) {
                    return;
                }

                if (Discipline::where('slug', Str::slug($this->string('name')->value()))->exists()) {
                    $validator->errors()->add('name', 'Esiste già una disciplina con questo nome.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'Esiste già una disciplina con questo nome.',
        ];
    }
}
