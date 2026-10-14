type ChangeRequestNoticeProps = {
    /** The chips the team chose in "Cosa deve sistemare?". */
    reasons: string[];
    message: string | null;
};

/** "Chiedi modifiche" of the team, at the top of the registration the trainer reopens. */
export default function ChangeRequestNotice({
    reasons,
    message,
}: ChangeRequestNoticeProps) {
    return (
        <div
            role="status"
            className="flex flex-col gap-1.5 rounded-xl border-[1.5px] border-foreground px-3.5 py-3 text-sm"
        >
            <strong>Il nostro team ti chiede di sistemare il profilo</strong>
            {reasons.length > 0 && (
                <ul className="list-disc pl-5">
                    {reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                    ))}
                </ul>
            )}
            {message && <p className="text-muted-foreground">{message}</p>}
            <span className="text-muted-foreground">
                Correggi i passi, poi invia di nuovo dal riepilogo.
            </span>
        </div>
    );
}
