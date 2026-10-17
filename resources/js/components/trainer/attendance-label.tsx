import { cn } from '@/lib/utils';
import type { AttendanceRate, ClientAttendance } from '@/types';

type AttendanceLabelProps = {
    attendance: ClientAttendance;
    className?: string;
};

/**
 * How often the client shows up, only for trainers:
 * "Presenze 90% su 10 sedute · con te 100% su 3".
 */
export default function AttendanceLabel({
    attendance,
    className,
}: AttendanceLabelProps) {
    const { platform, withYou } = attendance;

    return (
        <span
            className={cn(
                'text-xs text-muted-foreground tabular-nums md:text-[13px]',
                className,
            )}
        >
            {platform === null
                ? 'Presenze: nessuna seduta ancora'
                : `Presenze ${rateLabel(platform)}`}
            {withYou !== null && ` · con te ${rateLabel(withYou)}`}
        </span>
    );
}

/** "90% su 10 sedute", "100% su 1 seduta" */
function rateLabel({ rate, sessions }: AttendanceRate): string {
    return `${rate}% su ${sessions === 1 ? '1 seduta' : `${sessions} sedute`}`;
}
