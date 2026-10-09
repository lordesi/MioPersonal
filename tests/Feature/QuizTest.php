<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuizTest extends TestCase
{
    public function test_quiz_opens_on_the_intro_without_results()
    {
        $this->get(route('quiz.show'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/quiz')
                ->where('answers', null)
                ->where('results', null)
            );
    }

    public function test_results_suggest_the_three_most_compatible_trainers()
    {
        $this->get(route('quiz.results', [
            'goal' => 'posture',
            'disciplines' => ['Pilates'],
            'places' => ['online'],
            'zone' => 'online',
            'times' => ['evening'],
            'budget' => '35-45',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/quiz')
                ->has('results', 3)
                ->where('results.0.name', 'Giulia Rossi')
                ->where('results.0.matchPercent', 97)
                ->where('results.1.name', 'Sara Colombo')
                ->where('results.1.matchPercent', 90)
                ->where('results.0.reasons.0', ['type' => 'disciplines', 'disciplines' => ['Pilates']])
                ->where('results.0.reasons.1', ['type' => 'goal', 'goal' => 'posture'])
                ->where('results.0.reasons.2', ['type' => 'online'])
            );
    }

    public function test_unknown_answers_are_dropped()
    {
        $this->get(route('quiz.results', [
            'goal' => 'salute',
            'disciplines' => ['Pesi', 'Nuoto', 'Pesi'],
            'zone' => 'marte',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('answers.goal', null)
                ->where('answers.disciplines', ['Pesi'])
                ->where('answers.zone', null)
            );
    }

    public function test_skipping_every_question_still_gives_three_results()
    {
        $this->get(route('quiz.results'))
            ->assertOk()
            ->assertInertia(function (Assert $page) {
                $results = $page->toArray()['props']['results'];

                $this->assertCount(3, $results);

                foreach ($results as $result) {
                    $this->assertGreaterThanOrEqual(35, $result['matchPercent']);
                    $this->assertLessThanOrEqual(97, $result['matchPercent']);
                }
            });
    }
}
