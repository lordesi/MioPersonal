import { Lock, Mail, MessageCircle, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { TrainerClientProfile } from '@/types';

type ClientContactsProps = {
    firstName: string;
    contacts: TrainerClientProfile['contacts'];
};

/**
 * "Contatti" of the client's profile. Before the trainer confirms a booking
 * the server sends no contacts at all, and the card says how to get them.
 */
export default function ClientContacts({
    firstName,
    contacts,
}: ClientContactsProps) {
    return (
        <section
            aria-labelledby="client-contacts-title"
            className="flex flex-col gap-3 rounded-[20px] border bg-card p-5 md:p-6"
        >
            <h2 id="client-contacts-title" className="text-lg font-semibold">
                Contatti
            </h2>

            {contacts === null ? (
                <p className="flex items-start gap-2.5 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    <Lock
                        aria-hidden="true"
                        className="mt-0.5 size-4 flex-none"
                    />
                    I contatti di {firstName} compaiono quando confermi una
                    prenotazione.
                </p>
            ) : (
                <div className="flex flex-col">
                    <ContactRow icon={Mail} value={contacts.email}>
                        <Button asChild variant="outline" size="sm">
                            <a href={`mailto:${contacts.email}`}>
                                Scrivi email
                            </a>
                        </Button>
                    </ContactRow>
                    {contacts.phone && (
                        <ContactRow icon={Phone} value={contacts.phone}>
                            <Button asChild variant="outline" size="sm">
                                <a
                                    href={`tel:${contacts.phone.replace(/\s/g, '')}`}
                                >
                                    Chiama
                                </a>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                {/* wa.me wants the number with the prefix, digits only. */}
                                <a
                                    href={`https://wa.me/${contacts.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <MessageCircle aria-hidden="true" />
                                    WhatsApp
                                </a>
                            </Button>
                        </ContactRow>
                    )}
                </div>
            )}
        </section>
    );
}

function ContactRow({
    icon: Icon,
    value,
    children,
}: {
    icon: LucideIcon;
    value: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b py-3 last:border-b-0">
            <Icon
                aria-hidden="true"
                className="size-4 flex-none text-muted-foreground"
            />
            <span className="min-w-0 flex-1 text-[15px] break-all">
                {value}
            </span>
            <div className="flex gap-2">{children}</div>
        </div>
    );
}
