import OrganizerEvents from '@/components/events/organizer/events-list';
import type { OrganizerEventsProps } from '@/components/events/organizer/events-list';

/** "Eventi" of the gym area (OrganizerEventsController::index). */
export default function GymEvents(props: OrganizerEventsProps) {
    return <OrganizerEvents {...props} />;
}

GymEvents.layout = { section: 'events' };
