import { Head } from '@inertiajs/react';
import UserAvatar from '@/components/shared/user-avatar';
import ClientContacts from '@/components/trainer/area/client-contacts';
import { formatDateMedium, formatMonthYear } from '@/lib/format';
import type { TrainerClientProfile } from '@/types';

type ClientProfileProps = {
    client: TrainerClientProfile;
};

/** A client's profile, opened from "Oggi": who they are and their contacts. */
export default function ClientProfile({ client }: ClientProfileProps) {
    const sessions =
        client.sessions === 1
            ? '1 seduta con te'
            : `${client.sessions} sedute con te`;

    return (
        <>
            <Head title={client.name} />

            <div className="flex max-w-2xl flex-col gap-5">
                <div className="flex items-center gap-4">
                    <UserAvatar
                        name={client.name}
                        src={client.avatar}
                        size="xl"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-3xl">
                            {client.name}
                        </h1>
                        {client.joinedAt && (
                            <span className="text-sm text-muted-foreground">
                                Su MioPersonal da{' '}
                                {formatMonthYear(client.joinedAt)}
                            </span>
                        )}
                        <span className="text-sm text-muted-foreground tabular-nums">
                            {sessions}
                            {client.nextSession &&
                                ` · prossima ${formatDateMedium(client.nextSession)}`}
                        </span>
                    </div>
                </div>

                <ClientContacts
                    firstName={client.firstName}
                    contacts={client.contacts}
                />
            </div>
        </>
    );
}

ClientProfile.layout = { section: 'clients' };
