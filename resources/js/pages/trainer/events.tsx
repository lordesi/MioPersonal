import OrganizerEvents from '@/components/events/organizer/events-list';
import type { OrganizerEventsProps } from '@/components/events/organizer/events-list';

/** "Eventi" of the trainer area (OrganizerEventsController::index). */
export default function TrainerEvents(props: OrganizerEventsProps) {
    // The column of the pages of "Profilo".
    return (
        <div className="flex w-full flex-col gap-6 md:mx-auto md:max-w-240 md:pt-4">
            <OrganizerEvents {...props} />
        </div>
    );
}

TrainerEvents.layout = { section: 'events' };
