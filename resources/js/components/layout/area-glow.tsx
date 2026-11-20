/**
 * The turquoise glow behind the dark areas (trainer and client): on the left
 * of the page on desktop, at the bottom behind the tab bar on phones.
 */
export default function AreaGlow() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 bg-[radial-gradient(40%_50%_at_0%_25%,rgba(66,215,217,0.22)_0%,rgba(66,215,217,0)_100%),radial-gradient(30%_40%_at_5%_95%,rgba(66,215,217,0.12)_0%,rgba(66,215,217,0)_100%)] max-md:bg-[radial-gradient(90%_40%_at_20%_100%,rgba(66,215,217,0.18)_0%,rgba(66,215,217,0)_100%)]"
        />
    );
}
