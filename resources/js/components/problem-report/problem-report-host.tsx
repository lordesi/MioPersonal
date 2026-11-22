import { lazy, Suspense, useEffect, useState } from 'react';
import { onOpenProblemReport } from '@/lib/problem-report';

// Downloaded the first time someone opens it: the public pages don't carry it.
const ProblemReportDialog = lazy(
    () => import('@/components/problem-report/problem-report-dialog'),
);

/**
 * Mounted once next to the page (lib/inertia-config.tsx): the menus and the
 * footer open it with openProblemReport(). Only logged-in users see them.
 */
export default function ProblemReportHost() {
    const [open, setOpen] = useState(false);
    // Kept after the first open, so closing it doesn't download it again.
    const [loaded, setLoaded] = useState(false);

    useEffect(
        () =>
            onOpenProblemReport(() => {
                setLoaded(true);
                setOpen(true);
            }),
        [],
    );

    if (!loaded) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <ProblemReportDialog open={open} onOpenChange={setOpen} />
        </Suspense>
    );
}
