import { X } from 'lucide-react';
import { Initials } from '@/components/trainer/ui/bits';
import { listLabelClassName } from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';
import type { TrainerClient } from '@/types';

type ToContactProps = {
    clients: TrainerClient[];
    hiddenCount: number;
    onWrite: (client: TrainerClient) => void;
    onOpen: (client: TrainerClient) => void;
    onHide: (client: TrainerClient) => void;
    onRestore: () => void;
    /** Phones: three cards in a row; desktop: rows in a grid. */
    variant: 'cards' | 'rows';
};

/**
 * "Ancora da contattare": the clients with an account to whom nobody has
 * written yet. The X takes one out of the list (saved on the account).
 */
export default function ToContact({
    clients,
    hiddenCount,
    onWrite,
    onOpen,
    onHide,
    onRestore,
    variant,
}: ToContactProps) {
    if (clients.length === 0 && hiddenCount === 0) {
        return null;
    }

    return (
        <section
            aria-label="Ancora da contattare"
            className="flex flex-col gap-2.5"
        >
            <div className="flex items-center gap-2.5">
                <h2 className={cn(listLabelClassName, 'px-0 text-brand')}>
                    Ancora da contattare
                </h2>
                {hiddenCount > 0 && (
                    <button
                        type="button"
                        onClick={onRestore}
                        className="h-6.5 rounded-full border border-[#3a3a3a] px-2.5 text-xs font-semibold text-muted-foreground outline-none hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        {hiddenCount === 1
                            ? 'Mostra 1 nascosto'
                            : `Mostra ${hiddenCount} nascosti`}
                    </button>
                )}
            </div>

            {variant === 'cards' ? (
                <div className="grid grid-cols-3 gap-2">
                    {clients.slice(0, 6).map((client) => (
                        <div
                            key={client.recordId}
                            className="relative flex flex-col items-center gap-2 rounded-[20px] bg-[#121212] px-2 pt-4 pb-3 text-center shadow-[inset_0_0_0_1px_#2c2c2c]"
                        >
                            <HideButton
                                client={client}
                                onHide={onHide}
                                className="absolute top-0.5 right-0.5"
                            />
                            <button
                                type="button"
                                onClick={() => onOpen(client)}
                                className="flex flex-col items-center gap-2 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <Initials
                                    name={client.name}
                                    size={48}
                                    tone="outline"
                                />
                                <span className="text-[13px] leading-4 font-semibold">
                                    {client.name.split(' ')[0]}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onWrite(client)}
                                className="flex h-7 items-center rounded-full px-3 text-xs font-bold text-brand shadow-[inset_0_0_0_1.5px_#42d7d9] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                Scrivi
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2">
                    {clients.map((client) => (
                        <div
                            key={client.recordId}
                            className="flex items-center gap-2.5 rounded-[18px] border border-border bg-[#141414] py-2.5 pr-1.5 pl-3"
                        >
                            <Initials
                                name={client.name}
                                size={40}
                                tone="outline"
                            />
                            <button
                                type="button"
                                onClick={() => onOpen(client)}
                                className="flex min-w-0 flex-1 flex-col text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <span className="truncate text-[15px] font-semibold">
                                    {client.name}
                                </span>
                                <span className="truncate text-[13px] text-muted-foreground">
                                    {client.lastService || 'Nuovo cliente'}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onWrite(client)}
                                className="flex h-7.5 items-center rounded-full px-3 text-[13px] font-bold text-brand shadow-[inset_0_0_0_1.5px_#42d7d9] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                Scrivi
                            </button>
                            <HideButton client={client} onHide={onHide} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function HideButton({
    client,
    onHide,
    className,
}: {
    client: TrainerClient;
    onHide: (client: TrainerClient) => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={() => onHide(client)}
            aria-label={`Togli ${client.name} da questa lista`}
            title="Togli da questa lista"
            className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full text-[#8a8a8a] outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
                className,
            )}
        >
            <span className="flex size-5.5 items-center justify-center rounded-full bg-[rgba(120,120,128,0.36)] text-foreground">
                <X aria-hidden="true" className="size-3" strokeWidth={2.75} />
            </span>
        </button>
    );
}
