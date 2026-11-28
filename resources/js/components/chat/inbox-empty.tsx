import type { LucideIcon } from 'lucide-react';

/** "Chat" or "Notifiche" of the Inbox with nothing in it: an icon, a title, a line. */
export default function InboxEmpty({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex size-13 items-center justify-center rounded-full bg-[#1c1e21] text-muted-foreground">
                <Icon aria-hidden="true" className="size-6" />
            </span>
            <p className="text-[17px] font-semibold">{title}</p>
            <p className="max-w-80 text-[15px] leading-5 text-muted-foreground">
                {description}
            </p>
        </div>
    );
}
