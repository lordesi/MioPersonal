import { usePage } from '@inertiajs/react';
import { User } from 'lucide-react';
import { AreaTabBar } from '@/components/layout/area-nav';
import type { ClientSection } from '@/components/layout/client-nav';
import {
    CLIENT_TABS,
    clientSheetLinks,
    clientTabGroups,
} from '@/components/layout/client-nav';
import UserAvatar from '@/components/shared/user-avatar';

/**
 * The client's tabs on mobile: in the client area and on the public pages
 * to explore (home and searches), so the way back is always in sight.
 * "Profilo" opens the sheet with the account.
 */
export default function ClientTabBar({ section }: { section?: ClientSection }) {
    const user = usePage().props.auth?.user;

    return (
        <AreaTabBar
            groups={clientTabGroups(section)}
            tabs={CLIENT_TABS}
            label="Navigazione principale"
            current={section}
            more={{
                title: 'Profilo',
                icon: User,
                links: clientSheetLinks(),
                sections: ['settings'],
                header: user && (
                    <div className="flex items-center gap-2.5 px-3 pt-1 pb-3">
                        <UserAvatar
                            name={user.name}
                            src={user.avatar}
                            size="md"
                        />
                        <span className="flex min-w-0 flex-col">
                            <span className="text-sm font-semibold">
                                {user.name}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {user.email}
                            </span>
                        </span>
                    </div>
                ),
            }}
        />
    );
}
