/** A photo or a PDF of a message (MessagesController::message). */
export type ChatAttachment = {
    kind: 'pdf' | 'photo';
    name: string | null;
    /** Bytes. */
    size: number | null;
    /** The download; null once expired. */
    href: string | null;
    /** The photo in the bubble; null for PDFs and once expired. */
    src: string | null;
    /** Px, photos only. */
    width: number | null;
    height: number | null;
    /** ISO UTC: the file is deleted then (Message::ATTACHMENT_DAYS). */
    expiresAt: string | null;
    /** The file has been deleted: the text of the message stays. */
    expired: boolean;
};

/** A message of "Messaggi" (MessagesController::message). */
export type ChatMessage = {
    id: number;
    /** Sent by the logged-in person: on the right. */
    mine: boolean;
    body: string | null;
    attachment: ChatAttachment | null;
    /** ISO UTC. */
    at: string | null;
};

/** A row of the list: the other person and the last message. */
export type ChatConversation = {
    /** The trainer_clients record: the address of the conversation. */
    recordId: number;
    name: string;
    avatar: string | null;
    lastMessage: {
        mine: boolean;
        text: string;
        /** Only a photo or a PDF, without text: the icon before "Foto" or the name. */
        attachment: 'pdf' | 'photo' | null;
        at: string | null;
    } | null;
    /** New messages from the other person since the last visit. */
    unread: boolean;
};

/** The open conversation. */
export type ChatThread = {
    recordId: number;
    name: string;
    avatar: string | null;
    /** The trainer's public profile, or the client's card in "Clienti". */
    href: string;
    /** "Cliente" or "Il tuo personal trainer". */
    subtitle: string;
    messages: ChatMessage[];
    hasOlder: boolean;
    /** When the other person last opened it (ISO UTC): "Visto". */
    otherReadAt: string | null;
};
