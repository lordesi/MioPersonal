import { Eye } from 'lucide-react';
import type { PreviewRow } from '@/components/trainer/services/pricing';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type ClientPreviewProps = {
    rows: PreviewRow[];
    /** "Modifiche non salvate", "Salvataggio…"; none when there is nothing to save. */
    status?: string;
    /** Something changed since the last save: white dot. */
    changed: boolean;
    canSave: boolean;
    saving: boolean;
};

/**
 * "Così ti vedono i clienti": the black panel with the services as the
 * profile will show them, and the save button of the page (a submit button
 * of its form).
 */
export default function ClientPreview({
    rows,
    status,
    changed,
    canSave,
    saving,
}: ClientPreviewProps) {
    return (
        <section
            aria-labelledby="client-preview-title"
            className="flex flex-col gap-3.5 rounded-3xl bg-sidebar p-5.5 text-sidebar-foreground"
        >
            <div className="flex items-center justify-between gap-2">
                <h2
                    id="client-preview-title"
                    className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground"
                >
                    COSÌ TI VEDONO I CLIENTI
                </h2>
                <Eye
                    aria-hidden="true"
                    className="size-4.5 text-sidebar-muted-foreground"
                />
            </div>

            <ServiceRows
                rows={rows}
                empty="Scrivi i prezzi per vedere come appaiono i tuoi servizi sul profilo."
            />

            <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border pt-4">
                {/* Always there, also empty: screen readers hear the changes. */}
                <span
                    role="status"
                    className="flex items-center gap-2 text-[13px] leading-4.5 text-sidebar-foreground/80 tabular-nums"
                >
                    {status && (
                        <>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'size-2 rounded-full',
                                    changed
                                        ? 'bg-sidebar-primary'
                                        : 'bg-muted-foreground',
                                )}
                            />
                            {status}
                        </>
                    )}
                </span>
                <Button
                    type="submit"
                    disabled={!canSave || saving}
                    className="h-11 rounded-xl bg-sidebar-primary px-4.5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90 disabled:bg-sidebar-border disabled:text-muted-foreground disabled:opacity-100"
                >
                    {saving && <Spinner />}
                    Salva modifiche
                </Button>
            </div>
        </section>
    );
}

/**
 * The services as the profile will show them, one dark row each: also in
 * the preview of step 4 of "Diventa trainer".
 */
export function ServiceRows({
    rows,
    empty,
}: {
    rows: PreviewRow[];
    /** Shown while there is no row; without it, nothing is shown. */
    empty?: string;
}) {
    return (
        <>
            {rows.length > 0
                ? rows.map((row) => (
                      <div
                          key={row.key}
                          className="flex items-start justify-between gap-3 rounded-2xl bg-sidebar-accent p-4"
                      >
                          <span className="flex min-w-0 flex-col gap-1">
                              <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-[15px] leading-5.5 font-semibold break-words">
                                      {row.name}
                                  </span>
                                  {row.badge && (
                                      <span className="inline-flex h-5 items-center rounded-full bg-sidebar-primary px-2 text-[11px] font-bold text-sidebar-primary-foreground tabular-nums">
                                          {row.badge}
                                      </span>
                                  )}
                              </span>
                              <span className="text-[13px] leading-4.5 break-words text-sidebar-muted-foreground tabular-nums">
                                  {row.meta}
                              </span>
                          </span>
                          <span className="flex-none text-[17px] leading-6 font-bold tabular-nums">
                              {row.price}
                          </span>
                      </div>
                  ))
                : empty && (
                      <p className="rounded-2xl bg-sidebar-accent p-4 text-sm text-sidebar-muted-foreground">
                          {empty}
                      </p>
                  )}
        </>
    );
}
