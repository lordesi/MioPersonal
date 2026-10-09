import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

export default function PublicLayoutPreview() {
    return (
        <>
            <Head title="Anteprima layout pubblico" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 md:px-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Layout pubblico
                </h1>
                <p className="text-muted-foreground">
                    Contenuto di esempio. Header e footer sono quelli veri; su
                    schermo stretto compare il pulsante del menu.
                </p>
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((n) => (
                        <Skeleton key={n} className="h-64 rounded-xl" />
                    ))}
                </div>
            </div>
        </>
    );
}

PublicLayoutPreview.layout = (page: ReactNode) => (
    <PublicLayout section="search">{page}</PublicLayout>
);
