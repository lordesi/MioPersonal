import OrganizerEvents from '@/components/events/organizer/events-list';
import type { OrganizerEventsProps } from '@/components/events/organizer/events-list';

/** "Eventi" of the trainer area (OrganizerEventsController::index). */
export default function TrainerEvents(props: OrganizerEventsProps) {
    return <OrganizerEvents {...props} />;
}

TrainerEvents.layout = { section: 'events' };
