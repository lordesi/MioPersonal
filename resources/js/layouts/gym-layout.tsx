import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AccountMenu from '@/components/layout/account-menu';
import { AreaSidebar, AreaTabBar } from '@/components/layout/area-nav';
import BrandLogo from '@/components/layout/brand-logo';
import NotificationBell from '@/components/layout/notification-bell';
import type { GymSection } from '@/components/layout/gym-nav';
import {
    GYM_TABS,
    gymNavGroups,
    gymSheetLinks,
} from '@/components/layout/gym-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard, register } from '@/routes/gym';
import type { GymAreaData } from '@/types';

type GymLayoutProps = {
    children: ReactNode;
    /** Set from the page: `Page.layout = { section: 'plans' }`. */
    section?: GymSection;
};

/** Until the team approves the profile it isn't in the search. */
function StatusNotice({
    status,
    message,
    previewHref,
}: GymAreaData['profile'] & { previewHref: string | null }) {
    if (status === 'approved') {
        return null;
    }

    const content = {
        missing: {
            title: 'Completa il profilo della palestra',
            text: 'Finché non lo invii e il nostro team non lo approva, i clienti non vi trovano.',
        },
        review: {
            title: 'Il profilo della palestra è in revisione',
            text: 'Non compare ancora nella ricerca. Ti scriviamo appena è online.',
        },
        changes: {
            title: 'Il nostro team ti chiede di sistemare il profilo',
            text: message ?? 'Correggi i punti indicati e invialo di nuovo.',
        },
        rejected: {
            title: 'Il profilo della palestra non è stato approvato',
            text: message ?? 'Per domande scrivici dalla pagina Contatti.',
        },
    }[status];

    return (
        <section
            role="status"
            className="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-foreground bg-card px-4 py-3.5"
        >
            <span className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                <strong className="text-[15px]">{content.title}</strong>
                <span className="text-sm text-muted-foreground">
                    {content.text}
                </span>
            </span>
            <span className="flex flex-wrap gap-2">
                {previewHref && status !== 'missing' && (
                    <Button asChild variant="outline" className="h-10">
                        <Link href={previewHref}>Vedi l’anteprima</Link>
                    </Button>
                )}
                {(status === 'missing' || status === 'changes') && (
                    <Button asChild className="h-10 font-semibold">
                        <Link href={register()}>
                            {status === 'missing'
                                ? 'Completa il profilo'
                                : 'Modifica il profilo'}
                        </Link>
                    </Button>
                )}
            </span>
        </section>
    );
}

/**
 * Gym area: like the trainer area, black side menu from md up, header and
 * tabs at the bottom on mobile.
 */
export default function GymLayout({ children, section }: GymLayoutProps) {
    const { auth, gymArea } = usePage<{ gymArea?: GymAreaData }>().props;
    const groups = gymNavGroups(section, gymArea?.pendingCount ?? 0);
    const name = auth?.user?.name ?? '';
    const profileHref = gymArea?.publicProfileHref ?? undefined;

    return (
        <div className="flex min-h-screen bg-secondary">
            <AreaSidebar
                groups={groups}
                label="Area palestra"
                areaLabel="AREA PALESTRA"
                homeHref={dashboard.url()}
                variant="gym"
                userName={name}
                publicProfileHref={profileHref}
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="border-b bg-background md:hidden">
                    <div className="flex h-15 items-center gap-2 pr-2 pl-4">
                        <BrandLogo hideNameBelow="md" />
                        <Badge
                            variant="outline"
                            className="h-5.5 rounded-full px-2 text-xs font-medium"
                        >
                            Area palestra
                        </Badge>
                        <div className="ml-auto flex items-center gap-1">
                            <NotificationBell />
                            <AccountMenu variant="gym" userName={name} />
                        </div>
                    </div>
                </header>
                <main className="mx-auto flex w-full max-w-280 flex-1 flex-col gap-6 px-4 pt-5 pb-8 md:px-10 md:pt-8 md:pb-12">
                    {gymArea?.profile && (
                        <StatusNotice
                            {...gymArea.profile}
                            previewHref={gymArea.publicProfileHref}
                        />
                    )}
                    {children}
                </main>
                <AreaTabBar
                    groups={groups}
                    tabs={GYM_TABS}
                    label="Area palestra"
                    current={section}
                    more={{
                        title: 'Altro',
                        links: gymSheetLinks(profileHref),
                        sections: ['settings'],
                    }}
                />
            </div>
        </div>
    );
}
