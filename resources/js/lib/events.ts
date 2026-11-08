import { events as gymEventsIndex } from '@/routes/gym';
import * as gymEvents from '@/routes/gym/events';
import gymHosts from '@/routes/gym/events/hosts';
import gymInvites from '@/routes/gym/events/invites';
import gymRegistrations from '@/routes/gym/events/registrations';
import { events as trainerEventsIndex } from '@/routes/trainer';
import * as trainerEvents from '@/routes/trainer/events';
import trainerHosts from '@/routes/trainer/events/hosts';
import trainerInvites from '@/routes/trainer/events/invites';
import trainerRegistrations from '@/routes/trainer/events/registrations';
import type { OrganizerArea } from '@/types';

/**
 * The routes of "Eventi" in the trainer area or in the gym area: the same
 * pages (OrganizerEventsController), named trainer.events.* and gym.events.*.
 */
export function organizerRoutes(area: OrganizerArea) {
    return area === 'gym'
        ? {
              index: gymEventsIndex,
              ...gymEvents,
              hosts: gymHosts,
              invites: gymInvites,
              registrations: gymRegistrations,
          }
        : {
              index: trainerEventsIndex,
              ...trainerEvents,
              hosts: trainerHosts,
              invites: trainerInvites,
              registrations: trainerRegistrations,
          };
}

/** "Quando" of /eventi, as in EventSearchController::WHEN. */
export const WHEN_OPTIONS = [
    { value: 'oggi', label: 'Oggi' },
    { value: 'weekend', label: 'Questo weekend' },
    { value: 'settimana', label: 'Prossimi 7 giorni' },
    { value: 'mese', label: 'Prossimi 30 giorni' },
];
