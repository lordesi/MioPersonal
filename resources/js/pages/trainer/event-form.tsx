import OrganizerEventForm from '@/components/events/organizer/event-form';
import type { OrganizerEventFormProps } from '@/components/events/organizer/event-form';

/** "Nuovo evento" / "Modifica evento" of the trainer area. */
export default function TrainerEventForm(props: OrganizerEventFormProps) {
    return <OrganizerEventForm {...props} />;
}

TrainerEventForm.layout = { section: 'events' };
