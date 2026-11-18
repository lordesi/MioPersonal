import type { ClientInvite } from '@/components/trainer/area/invite-clients';
import type {
    ChatConversation,
    ChatThread,
    SeriesService,
    SessionOptions,
    TrainerClient,
} from '@/types';

/** The props of "Clienti" (TrainerClientsController): the clients and their messages. */
export type ClientsProps = {
    clients: TrainerClient[];
    /** The account of `?cliente=` (Home, Calendario). */
    selectedId: number | null;
    /** The row of the list chosen in the address: `?cliente=` or `?con=`. */
    selectedRecordId: number | null;
    /** `?chat=1`: the conversation open instead of the card. */
    chat: boolean;
    thread: ChatThread | null;
    /** The last message and the unread dot, by row of the list (only clients with an account). */
    chats: Record<number, ChatConversation>;
    /** `?q=`: the words searched in the messages too. */
    query: string;
    /** The rows whose messages have the words of `query`. */
    messageMatches: number[];
    /** "Invita i tuoi clienti": null until the profile is in the search. */
    invite: ClientInvite | null;
    /** The sessions that can be repeated every week ("Sedute fisse"). */
    seriesServices: SeriesService[];
    /** "Prenota": the options of "Aggiungi seduta". */
    sessionOptions: SessionOptions | null;
};

export type ClientFilter =
    | 'all'
    | 'unread'
    | 'never'
    | 'requests'
    | 'upcoming'
    | 'package'
    | 'inactive';

/** What the desktop and the phone drawings get from the page. */
export type ClientsViewProps = ClientsProps & {
    /** The clients of the filter and of the search. */
    visible: TrainerClient[];
    filter: ClientFilter;
    onFilter: (filter: ClientFilter) => void;
    search: string;
    onSearch: (search: string) => void;
    /** The client open: the card or the chat. */
    selected: TrainerClient | null;
    /** Opens a client: its card, or its chat with `chat`. */
    open: (client: TrainerClient | null, chat?: boolean) => void;
    /** "Prenota": "Aggiungi seduta" with this client. */
    onBook: (client: TrainerClient) => void;
    onAdd: () => void;
    /** "Ancora da contattare": the ones hidden with the X stay out. */
    toContact: TrainerClient[];
    hiddenCount: number;
    onHide: (client: TrainerClient) => void;
    onRestore: () => void;
};
