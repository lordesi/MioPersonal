import OrganizerEvent from '@/components/events/organizer/event-manage';
import type { OrganizerEventProps } from '@/components/events/organizer/event-manage';

/** An event of the trainer area: places, clients, organizers. */
export default function TrainerEvent(props: OrganizerEventProps) {
    // The column of the pages of "Profilo".
    return (
        <div className="flex w-full flex-col gap-6 md:mx-auto md:max-w-240 md:pt-4">
            <OrganizerEvent {...props} />
        </div>
    );
}

TrainerEvent.layout = { section: 'events' };
