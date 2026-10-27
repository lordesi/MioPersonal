type StepErrorsProps = {
    /** Messages from the server for the fields of the current step. */
    errors: string[];
    title?: string;
};

/** What to fix in this step, after "Continua" or "Invia per approvazione". */
export default function StepErrors({
    errors,
    title = 'Da sistemare in questo passo:',
}: StepErrorsProps) {
    if (errors.length === 0) {
        return null;
    }

    return (
        <div
            role="alert"
            className="flex flex-col gap-1.5 rounded-xl border-[1.5px] border-destructive px-3.5 py-3 text-sm"
        >
            <strong>{title}</strong>
            <ul className="list-disc pl-5 text-destructive">
                {[...new Set(errors)].map((error) => (
                    <li key={error}>{error}</li>
                ))}
            </ul>
        </div>
    );
}
