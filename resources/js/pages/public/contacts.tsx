import { Head } from '@inertiajs/react';
import ContactAside from '@/components/contact/contact-aside';
import ContactForm from '@/components/contact/contact-form';
import type { ChoiceOption } from '@/components/shared/choice-chips';

type ContactsProps = {
    sent: boolean;
    email: string;
    roles: ChoiceOption<string>[];
    topics: Record<string, ChoiceOption<string>[]>;
    messageMaxLength: number;
};

export default function Contacts({ email, ...form }: ContactsProps) {
    return (
        <div className="mx-auto flex w-full max-w-300 flex-col gap-5 px-4 pt-6 pb-10 md:gap-8 md:px-8 md:pt-12 md:pb-20">
            <Head title="Contatti" />

            <h1 className="text-[32px] leading-9.5 font-bold tracking-tighter md:text-5xl md:leading-13">
                Parliamone.
            </h1>

            {/* Phone: form, then side boxes. From lg: side boxes on the right. */}
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <ContactForm {...form} />
                <ContactAside
                    email={email}
                    className="lg:col-start-2 lg:row-start-1"
                />
            </div>
        </div>
    );
}
