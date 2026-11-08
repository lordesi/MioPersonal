import OrganizerEvent from '@/components/events/organizer/event-manage';
import type { OrganizerEventProps } from '@/components/events/organizer/event-manage';

/** An event of the gym area: places, clients, organizers. */
export default function GymEvent(props: OrganizerEventProps) {
    return <OrganizerEvent {...props} />;
}

GymEvent.layout = { section: 'events' };
