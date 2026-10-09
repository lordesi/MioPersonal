type ResponsiveTextProps = {
    /** Shorter copy the design uses below md. */
    mobile: string;
    desktop: string;
};

/** Shows a different copy on mobile and desktop, as some design screens do. */
export default function ResponsiveText({
    mobile,
    desktop,
}: ResponsiveTextProps) {
    return (
        <>
            <span className="md:hidden">{mobile}</span>
            <span className="hidden md:inline">{desktop}</span>
        </>
    );
}
