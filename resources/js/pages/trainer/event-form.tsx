import OrganizerEventForm from '@/components/events/organizer/event-form';
import type { OrganizerEventFormProps } from '@/components/events/organizer/event-form';

/** "Nuovo evento" / "Modifica evento" of the trainer area. */
export default function TrainerEventForm(props: OrganizerEventFormProps) {
    // The column of the pages of "Profilo".
    return (
        <div className="flex w-full flex-col gap-6 md:mx-auto md:max-w-240 md:pt-4">
            <OrganizerEventForm {...props} />
        </div>
    );
}

TrainerEventForm.layout = { section: 'events' };
