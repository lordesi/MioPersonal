<?php

namespace Tests\Unit;

use App\Support\SentryScrubber;
use Illuminate\Database\QueryException;
use PDOException;
use PHPUnit\Framework\TestCase;
use Sentry\Breadcrumb;
use Sentry\Event;
use Sentry\EventHint;
use Sentry\ExceptionDataBag;

class SentryScrubberTest extends TestCase
{
    public function test_the_values_of_a_failed_query_never_reach_sentry()
    {
        $pdo = new PDOException('SQLSTATE[23505]: Unique violation: 7 ERROR: duplicate key value DETAIL: Key (email)=(giulia@example.com) already exists.');
        $query = new QueryException('pgsql', 'insert into "users" ("email") values (?)', ['giulia@example.com'], $pdo);

        $event = Event::createEvent();
        $event->setExceptions([new ExceptionDataBag($query), new ExceptionDataBag($pdo)]);
        $event->setBreadcrumb([
            new Breadcrumb(Breadcrumb::LEVEL_ERROR, Breadcrumb::TYPE_DEFAULT, 'log.error', $query->getMessage()),
            new Breadcrumb(Breadcrumb::LEVEL_INFO, Breadcrumb::TYPE_DEFAULT, 'log.info', 'Booking confirmed'),
        ]);

        $scrubbed = SentryScrubber::beforeSend($event, EventHint::fromArray(['exception' => $query]));

        $this->assertNotNull($scrubbed);
        [$queryBag, $pdoBag] = $scrubbed->getExceptions();
        $this->assertSame('SQLSTATE[23505] (details removed) (SQL: insert into "users" ("email") values (?))', $queryBag->getValue());
        $this->assertSame('SQLSTATE[23505] (details removed)', $pdoBag->getValue());

        [$error, $info] = $scrubbed->getBreadcrumbs();
        $this->assertStringNotContainsString('giulia@example.com', (string) $error->getMessage());
        $this->assertSame('Booking confirmed', $info->getMessage());
    }

    public function test_other_errors_are_left_as_they_are()
    {
        $exception = new \RuntimeException('The photo could not be stored.');
        $event = Event::createEvent();
        $event->setExceptions([new ExceptionDataBag($exception)]);

        $scrubbed = SentryScrubber::beforeSend($event, EventHint::fromArray(['exception' => $exception]));

        $this->assertSame('The photo could not be stored.', $scrubbed?->getExceptions()[0]->getValue());
    }
}
