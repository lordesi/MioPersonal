<?php

namespace Tests\Unit;

use App\Rules\ItalianMobile;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ItalianMobileTest extends TestCase
{
    /**
     * @return array<string, array{string}>
     */
    public static function realNumbers(): array
    {
        return [
            'TIM' => ['333 812 4490'],
            'Vodafone, with spaces' => ['347 521 8846'],
            'Iliad, without spaces' => ['3512349087'],
            'WindTre' => ['3934411270'],
        ];
    }

    #[DataProvider('realNumbers')]
    public function test_real_numbers_pass(string $number)
    {
        $this->assertTrue($this->passes($number));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function fakeNumbers(): array
    {
        return [
            'all nines' => ['9999999999'],
            'all threes' => ['3333333333'],
            'zeros after the prefix' => ['3330000000'],
            'going up' => ['3451234567'],
            'going down' => ['3477654321'],
            'going up past 9' => ['3478901234'],
            'a landline' => ['0612345678'],
            'a prefix nobody has' => ['3001234867'],
        ];
    }

    #[DataProvider('fakeNumbers')]
    public function test_fake_numbers_fail(string $number)
    {
        $this->assertFalse($this->passes($number));
    }

    private function passes(string $number): bool
    {
        return Validator::make(['phone' => $number], ['phone' => [new ItalianMobile]])->passes();
    }
}
