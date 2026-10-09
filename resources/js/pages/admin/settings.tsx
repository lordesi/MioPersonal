import { Head } from '@inertiajs/react';
import { useId, useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import AdminPanel from '@/components/admin/admin-panel';
import ChoiceChips from '@/components/shared/choice-chips';
import UserAvatar from '@/components/shared/user-avatar';
import { formatDayMonthTime } from '@/lib/format';
import type { AdminActivity, AdminTeamMember } from '@/types';

type SettingsProps = {
    defaults: { confirmHours: number; freeCancellationHours: number };
    hourOptions: number[];
    team: AdminTeamMember[];
    activity: AdminActivity[];
};

function HoursChoice({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: number[];
    value: number;
    onChange: (value: number) => void;
}) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-2">
            <span id={labelId} className="text-sm font-medium">
                {label}
            </span>
            <ChoiceChips
                options={options.map((hours) => ({
                    value: String(hours),
                    label: `${hours} ore`,
                }))}
                value={String(value)}
                onChange={(hours) => onChange(Number(hours))}
                aria-labelledby={labelId}
                className="gap-1.5"
            />
        </div>
    );
}

export default function Settings({
    defaults,
    hourOptions,
    team,
    activity,
}: SettingsProps) {
    // TODO: save the defaults on the server; for now they only live in the page.
    const [confirmHours, setConfirmHours] = useState(defaults.confirmHours);
    const [cancellationHours, setCancellationHours] = useState(
        defaults.freeCancellationHours,
    );

    return (
        <>
            <Head title="Admin · Impostazioni e registro" />

            <div className="grid items-start gap-4 xl:grid-cols-2">
                <AdminPanel title="Regole predefinite" className="gap-4">
                    <HoursChoice
                        label="Tempo massimo per confermare una prenotazione"
                        options={hourOptions}
                        value={confirmHours}
                        onChange={setConfirmHours}
                    />
                    <HoursChoice
                        label="Cancellazione gratuita predefinita (fino a)"
                        options={hourOptions}
                        value={cancellationHours}
                        onChange={setCancellationHours}
                    />
                    <span className="text-xs text-muted-foreground">
                        Valgono per i nuovi trainer; ognuno può cambiarle dalla
                        sua area. Se le modifichi, aggiorna anche i Termini.
                    </span>
                </AdminPanel>

                <AdminPanel title="Team admin">
                    <ul>
                        {team.map((member) => (
                            <li
                                key={member.id}
                                className="flex items-center gap-2.5 border-b py-2.5"
                            >
                                <UserAvatar name={member.name} />
                                <span className="flex-1 text-sm font-semibold">
                                    {member.name}
                                </span>
                                {member.twoFactorEnabled ? (
                                    <AdminBadge variant="solid">
                                        2FA attiva
                                    </AdminBadge>
                                ) : (
                                    <AdminBadge variant="dashed">
                                        2FA da attivare
                                    </AdminBadge>
                                )}
                            </li>
                        ))}
                    </ul>
                    <span className="text-xs text-muted-foreground">
                        Il pannello è su /admin ed è accessibile solo a questi
                        account.
                    </span>
                </AdminPanel>

                <AdminPanel
                    title="Registro attività"
                    className="gap-2 xl:col-span-2"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-120 text-left text-sm">
                            <thead>
                                <tr className="text-xs text-muted-foreground">
                                    <th
                                        scope="col"
                                        className="py-2 font-semibold"
                                    >
                                        Chi
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-2 font-semibold"
                                    >
                                        Cosa
                                    </th>
                                    <th
                                        scope="col"
                                        className="py-2 text-right font-semibold"
                                    >
                                        Quando
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {activity.map((entry) => (
                                    <tr key={entry.id} className="border-t">
                                        <td className="py-2.5 font-semibold">
                                            {entry.who}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {entry.what}
                                        </td>
                                        <td className="py-2.5 text-right text-muted-foreground tabular-nums">
                                            {formatDayMonthTime(entry.at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AdminPanel>
            </div>
        </>
    );
}

Settings.layout = { section: 'settings' };
