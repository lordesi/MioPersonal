import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import TrainerLayout from '@/layouts/trainer-layout';

export default function TrainerLayoutPreview() {
    return (
        <>
            <Head title="Anteprima area trainer" />
            <h1 className="text-3xl font-bold tracking-tight">
                Buongiorno Giulia
            </h1>
            <p className="text-muted-foreground">
                Contenuto di esempio. Su schermo stretto il menu laterale
                diventa la barra di schede in basso.
            </p>
            {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-40 rounded-xl bg-background" />
            ))}
        </>
    );
}

TrainerLayoutPreview.layout = (page: ReactNode) => (
    <TrainerLayout
        section="today"
        pendingCount={3}
        notificationCount={3}
        notificationsEnabled={false}
        publicProfileHref="#"
        userName="Giulia Rossi"
    >
        {page}
    </TrainerLayout>
);
