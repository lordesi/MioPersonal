<?php

namespace App\Support\Calendar;

use RuntimeException;

/** Google no longer lets the app write on the trainer's calendar: they have to link it again. */
class CalendarAccessRevoked extends RuntimeException {}
