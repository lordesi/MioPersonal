import { Head } from '@inertiajs/react';
import ContactAside from '@/components/contact/contact-aside';
import ContactForm from '@/components/contact/contact-form';
import {
    pageColumnClassName,
    pageTitleClassName,
} from '@/components/mp/page-bits';
import type { ChoiceOption } from '@/components/shared/choice-chips';
import { cn } from '@/lib/utils';

type ContactsProps = {
    sent: boolean;
    email: string;
    roles: ChoiceOption<string>[];
    topics: Record<string, ChoiceOption<string>[]>;
    messageMaxLength: number;
};

export default function Contacts({ email, ...form }: ContactsProps) {
    return (
        <div
            className={cn(
                pageColumnClassName,
                'gap-10 pb-12 md:gap-12 md:pb-24',
            )}
        >
            <Head title="Contatti" />

            <h1 className={cn(pageTitleClassName, 'pt-6 md:pt-10')}>
                Parliamone.
            </h1>

            {/* Phones: form, then the boxes. Desktop: the boxes on the right. */}
            <div className="flex flex-col gap-10 md:flex-row md:flex-wrap md:items-start md:gap-x-16 md:gap-y-10">
                <ContactForm
                    {...form}
                    className="min-w-0 md:max-w-170 md:flex-[999_1_560px]"
                />
                <ContactAside email={email} className="md:flex-[1_1_300px]" />
            </div>
        </div>
    );
}
