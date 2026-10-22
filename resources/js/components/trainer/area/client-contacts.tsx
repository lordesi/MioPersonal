import { Mail, MessageCircle, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import type { TrainerClient } from '@/types';

type ClientContactsProps = {
    name: string;
    contacts: TrainerClient['contacts'];
};

/**
 * "Contatti" in the card of "Clienti": phone, email and WhatsApp. Without a
 * phone number only the email is left.
 */
export default function ClientContacts({
    name,
    contacts,
}: ClientContactsProps) {
    const titleId = useId();
    const phone = contacts.phone;

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-3">
            <h3 id={titleId} className="text-[15px] leading-5.5 font-semibold">
                Contatti
            </h3>

            <ul className="flex flex-col overflow-hidden rounded-[14px] border">
                {phone && (
                    <ContactRow
                        icon={Phone}
                        label="Telefono"
                        value={phone}
                        href={`tel:${phone.replace(/\s/g, '')}`}
                        action="Chiama"
                        actionLabel={`Chiama ${name}`}
                    />
                )}
                <ContactRow
                    icon={Mail}
                    label="Email"
                    value={contacts.email}
                    href={`mailto:${contacts.email}`}
                    action="Scrivi"
                    actionLabel={`Scrivi una email a ${name}`}
                />
            </ul>

            {phone && (
                <Button
                    asChild
                    className="h-12 gap-2.5 rounded-xl text-[15px] font-semibold"
                >
                    {/* wa.me wants the number with the prefix, digits only. */}
                    <a
                        href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Scrivi a ${name} su WhatsApp`}
                    >
                        <MessageCircle
                            aria-hidden="true"
                            className="size-4.5"
                        />
                        Scrivi su WhatsApp
                    </a>
                </Button>
            )}
        </section>
    );
}

function ContactRow({
    icon: Icon,
    label,
    value,
    href,
    action,
    actionLabel,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    href: string;
    action: string;
    actionLabel: string;
}) {
    return (
        <li className="flex items-center gap-3 border-t py-2.5 pr-2.5 pl-3 first:border-t-0">
            <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-muted">
                <Icon aria-hidden="true" className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="truncate text-sm font-semibold tabular-nums">
                    {value}
                </span>
            </span>
            <Button
                asChild
                variant="outline"
                className="h-9 flex-none rounded-[9px] px-3 text-[13px] font-semibold"
            >
                <a href={href} aria-label={actionLabel}>
                    {action}
                </a>
            </Button>
        </li>
    );
}
