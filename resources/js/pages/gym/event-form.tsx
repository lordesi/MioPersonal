import OrganizerEventForm from '@/components/events/organizer/event-form';
import type { OrganizerEventFormProps } from '@/components/events/organizer/event-form';

/** "Nuovo evento" / "Modifica evento" of the gym area. */
export default function GymEventForm(props: OrganizerEventFormProps) {
    return <OrganizerEventForm {...props} />;
}

GymEventForm.layout = { section: 'events' };
