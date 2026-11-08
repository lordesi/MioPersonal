import OrganizerEvent from '@/components/events/organizer/event-manage';
import type { OrganizerEventProps } from '@/components/events/organizer/event-manage';

/** An event of the trainer area: places, clients, organizers. */
export default function TrainerEvent(props: OrganizerEventProps) {
    return <OrganizerEvent {...props} />;
}

TrainerEvent.layout = { section: 'events' };
