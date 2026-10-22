import { ChevronDown } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import PackagePanel from '@/components/client/package-panel';
import { Button } from '@/components/ui/button';
import type { ClientPackage } from '@/types';

/** How much (px) each card behind sticks out under the one in front. */
const PEEK = 10;
/** How much narrower each card behind is (4% per step). */
const SHRINK = 0.04;
/** Cards visible behind the first one; the others hide behind the last. */
const MAX_BEHIND = 2;

type PackageStackProps = {
    packages: ClientPackage[];
    now: Date;
};

/**
 * The client's packages as a deck of cards, so that 3 packages don't take
 * the height of 3 cards: only the first one is shown, the others stick out
 * under it. A click sends the first card to the back and the others move
 * up by one.
 */
export default function PackageStack({ packages, now }: PackageStackProps) {
    // How many times the deck has been turned: the card in front is
    // packages[shift % packages.length].
    const [shift, setShift] = useState(0);

    if (packages.length === 1) {
        return <PackagePanel pack={packages[0]} now={now} />;
    }

    const count = packages.length;
    const front = shift % count;
    const behind = Math.min(count - 1, MAX_BEHIND);

    function next() {
        setShift((value) => (value + 1) % count);
    }

    // Clicking the card turns the deck, but not when the click is on one of
    // its links or buttons (trainer name, "Prenota la prossima").
    function handleClick(event: MouseEvent<HTMLDivElement>) {
        if ((event.target as HTMLElement).closest('a, button')) {
            return;
        }

        next();
    }

    return (
        // The keyboard uses the button in the card's title instead.
        <div
            className="grid cursor-pointer"
            style={{ paddingBottom: behind * PEEK }}
            onClick={handleClick}
        >
            {packages.map((pack, index) => {
                // 0 = in front, 1 = right behind it, and so on.
                const position = (index - front + count) % count;
                const step = Math.min(position, MAX_BEHIND);

                return (
                    <PackagePanel
                        key={pack.id}
                        pack={pack}
                        now={now}
                        // All the cards share the same grid cell: the deck is
                        // as tall as the tallest one.
                        className="origin-bottom transition-[transform,opacity] duration-300 ease-out [grid-area:1/1] motion-reduce:transition-none"
                        style={{
                            zIndex: count - position,
                            transform: `translateY(${step * PEEK}px) scale(${1 - step * SHRINK})`,
                            opacity: position > MAX_BEHIND ? 0 : 1,
                        }}
                        // The cards behind are covered: no focus, no screen reader.
                        inert={position > 0}
                        aria-hidden={position > 0 ? true : undefined}
                        action={
                            position === 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={next}
                                    aria-label={`Pacchetto ${front + 1} di ${count}: mostra il successivo`}
                                    className="-my-1 gap-1 text-muted-foreground tabular-nums"
                                >
                                    {front + 1} di {count}
                                    <ChevronDown aria-hidden="true" />
                                </Button>
                            )
                        }
                    />
                );
            })}
        </div>
    );
}
