<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** The commands of routes/console.php that must never run twice at the same time. */
class ScheduleTest extends TestCase
{
    /**
     * @return array<string, array{string}>
     */
    public static function singleRunCommands(): array
    {
        return [
            'bookings:expire' => ['bookings:expire'],
            'bookings:remind' => ['bookings:remind'],
            'waitlist:notify' => ['waitlist:notify'],
        ];
    }

    #[DataProvider('singleRunCommands')]
    public function test_the_command_never_overlaps(string $command)
    {
        $events = collect(app(Schedule::class)->events())
            ->filter(fn (Event $event) => str_contains((string) $event->command, $command));

        $this->assertCount(1, $events);
        $this->assertTrue($events->first()->withoutOverlapping);
    }

    /** scripts/backup.sh: only on the server, before the 03:15 reboot, without holding up the minute tasks. */
    public function test_the_backup_runs_every_night_on_the_server_only()
    {
        $events = collect(app(Schedule::class)->events())
            ->filter(fn (Event $event) => str_contains((string) $event->command, 'scripts/backup.sh'));

        $this->assertCount(1, $events);
        $backup = $events->first();
        $this->assertSame('30 2 * * *', $backup->expression);
        $this->assertSame(['production'], $backup->environments);
        $this->assertTrue($backup->withoutOverlapping);
        $this->assertTrue($backup->runInBackground);
        $this->assertFalse($backup->runsInEnvironment('local'));
    }
}
