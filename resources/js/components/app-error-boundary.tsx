import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { reportError } from '@/lib/sentry';

/**
 * A crash while drawing a page: a short message instead of a blank screen, and
 * the error to Sentry (when it is on). Ours and not Sentry's, so Sentry can
 * load after the page (lib/sentry.ts).
 */
export default class AppErrorBoundary extends Component<
    { children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError(): { failed: boolean } {
        return { failed: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        reportError(error, { componentStack: info.componentStack });
    }

    render(): ReactNode {
        if (this.state.failed) {
            return (
                <p className="p-6 text-center text-sm">
                    Qualcosa è andato storto. Ricarica la pagina.
                </p>
            );
        }

        return this.props.children;
    }
}
