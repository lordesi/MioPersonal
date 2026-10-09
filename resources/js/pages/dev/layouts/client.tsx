import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ClientLayout from '@/layouts/client-layout';

export default function ClientLayoutPreview() {
    return (
        <>
            <Head title="Anteprima area cliente" />
            <h1 className="text-3xl font-bold tracking-tight">
                Le mie prenotazioni
            </h1>
            <p className="text-muted-foreground">
                Contenuto di esempio. Su schermo stretto compare la barra di
                schede in basso.
            </p>
            {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-40 rounded-xl bg-background" />
            ))}
        </>
    );
}

ClientLayoutPreview.layout = (page: ReactNode) => (
    <ClientLayout section="bookings" userName="Luca Moretti">
        {page}
    </ClientLayout>
);
