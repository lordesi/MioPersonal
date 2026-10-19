import type { PreviewRow } from '@/components/trainer/services/pricing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type ClientPreviewProps = {
    rows: PreviewRow[];
    /** "Tutto salvato", "Modifiche non salvate"… */
    status: string;
    canSave: boolean;
    saving: boolean;
};

/**
 * "Così ti vedono i clienti": the services as the profile will show them,
 * with the save button of the page (a submit button of its form).
 */
export default function ClientPreview({
    rows,
    status,
    canSave,
    saving,
}: ClientPreviewProps) {
    return (
        <section
            aria-label="Anteprima per i clienti"
            className="flex flex-col gap-3 rounded-[20px] border bg-card p-5"
        >
            <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                COSÌ TI VEDONO I CLIENTI
            </span>
            <div className="flex flex-col gap-2">
                {rows.length > 0 ? (
                    rows.map((row) => (
                        <div
                            key={row.key}
                            className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                        >
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-sm font-semibold break-words">
                                        {row.name}
                                    </span>
                                    {row.badge && (
                                        <Badge className="h-4.5 rounded-full px-1.5 text-[10px] font-bold">
                                            {row.badge}
                                        </Badge>
                                    )}
                                </span>
                                <span className="text-xs leading-4 break-words text-muted-foreground">
                                    {row.meta}
                                </span>
                            </span>
                            <span className="shrink-0 text-[15px] font-bold tabular-nums">
                                {row.price}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="px-3 py-2.5 text-sm text-muted-foreground">
                        Scrivi i prezzi per vedere come appaiono i tuoi servizi
                        sul profilo.
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2.5">
                <span
                    role="status"
                    className="flex-1 text-[13px] text-muted-foreground tabular-nums"
                >
                    {status}
                </span>
                <Button
                    type="submit"
                    disabled={!canSave || saving}
                    className="h-10 px-4.5 font-semibold"
                >
                    {saving && <Spinner />}
                    Salva
                </Button>
            </div>
        </section>
    );
}
