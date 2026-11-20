import { ChevronRight } from 'lucide-react';
import { neverWritten } from '@/components/trainer/clients/filters';
import { statusOf } from '@/components/trainer/clients/labels';
import { groupByLetter } from '@/components/trainer/clients/rubrica';
import { Initials } from '@/components/trainer/ui/bits';
import { pressableRowClassName } from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';
import type { ChatConversation, TrainerClient } from '@/types';

type ClientRubricaProps = {
    clients: TrainerClient[];
    chats: Record<number, ChatConversation>;
    onOpen: (client: TrainerClient) => void;
    /** Desktop: the client whose card is open on the right. */
    selectedId?: number | null;
    /** Phones: bigger rows. */
    size: 'lg' | 'sm';
};

/**
 * "Rubrica": every client in alphabetical order, one block per letter
 * (design "Rubrica 2"). Who was never written to says so in turquoise.
 */
export default function ClientRubrica({
    clients,
    chats,
    onOpen,
    selectedId = null,
    size,
}: ClientRubricaProps) {
    const large = size === 'lg';

    if (clients.length === 0) {
        return (
            <p className="py-6 text-center text-[15px] text-muted-foreground">
                Nessun cliente
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-1.5">
            {groupByLetter(clients).map((group) => (
                <section
                    key={group.letter}
                    aria-label={`Clienti con la lettera ${group.letter}`}
                    className="flex flex-col gap-1.5"
                >
                    <h2 className="mt-2 px-1 text-[13px] font-bold text-brand">
                        {group.letter}
                    </h2>
                    <div className="overflow-hidden rounded-[20px] bg-[#121212] shadow-[inset_0_0_0_1px_#2c2c2c]">
                        {group.clients.map((client, index) => {
                            const never = neverWritten(client, chats);
                            const status = statusOf(client);
                            const muted = status.tone === 'muted';

                            return (
                                <button
                                    key={client.recordId}
                                    type="button"
                                    onClick={() => onOpen(client)}
                                    aria-current={
                                        selectedId === client.recordId ||
                                        undefined
                                    }
                                    className={cn(
                                        'flex w-full items-center gap-3 px-3.5 text-left',
                                        large
                                            ? 'min-h-16 py-2.5'
                                            : 'min-h-14 py-2',
                                        pressableRowClassName,
                                        selectedId === client.recordId &&
                                            'bg-brand-soft',
                                        index < group.clients.length - 1 &&
                                            'shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.08)]',
                                    )}
                                >
                                    <Initials
                                        name={client.name}
                                        size={large ? 40 : 36}
                                        tone={
                                            never || !client.registered
                                                ? 'outline'
                                                : muted
                                                  ? 'muted'
                                                  : undefined
                                        }
                                    />
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span
                                            className={cn(
                                                'truncate font-semibold',
                                                large
                                                    ? 'text-base'
                                                    : 'text-[15px]',
                                                muted &&
                                                    'text-muted-foreground',
                                            )}
                                        >
                                            {client.name}
                                        </span>
                                        <span
                                            className={cn(
                                                'truncate text-[13px]',
                                                never
                                                    ? 'text-brand'
                                                    : 'text-[#8a8a8a]',
                                            )}
                                        >
                                            {never
                                                ? 'Mai contattato'
                                                : status.text}
                                        </span>
                                    </span>
                                    <ChevronRight
                                        aria-hidden="true"
                                        className="size-4.5 shrink-0 text-[#707070]"
                                    />
                                </button>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}
