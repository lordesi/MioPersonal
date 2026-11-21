import { useEffect, useRef, useState } from 'react';
import type { ComponentProps, PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/utils';

const MAX_SCALE = 4;
/** The double tap (or double click): this much, or back to 1. */
const TAP_SCALE = 2.5;
/** Fingers that move less than this are a tap, not a drag. */
const TAP_SLOP = 10;
const DOUBLE_TAP_MS = 300;
/** A sideways drag this long, not zoomed, goes to the next photo. */
const SWIPE = 60;

type Point = { x: number; y: number };
type View = { scale: number; x: number; y: number };

const unzoomed: View = { scale: 1, x: 0, y: 0 };

/** Not past the edges: the photo always covers where it was. */
function clamp(element: HTMLImageElement | null, next: View): View {
    const scale = Math.min(MAX_SCALE, Math.max(1, next.scale));

    if (!element || scale === 1) {
        return unzoomed;
    }

    const maxX = ((scale - 1) * element.offsetWidth) / 2;
    const maxY = ((scale - 1) * element.offsetHeight) / 2;

    return {
        scale,
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
}

/** Zoomed to `scale`, the point `anchor` (from the center) stays still. */
function zoomAround(
    element: HTMLImageElement | null,
    from: View,
    scale: number,
    anchor: Point,
): View {
    return clamp(element, {
        scale,
        x: anchor.x - ((anchor.x - from.x) * scale) / from.scale,
        y: anchor.y - ((anchor.y - from.y) * scale) / from.scale,
    });
}

/**
 * A point of the screen, from the center of the photo as laid out (the
 * rect is the zoomed one: its center moved by the offset of `view`).
 */
function fromCenter(
    element: HTMLImageElement | null,
    view: View,
    point: Point,
): Point {
    if (!element) {
        return point;
    }

    const rect = element.getBoundingClientRect();

    return {
        x: point.x - (rect.left + rect.width / 2) + view.x,
        y: point.y - (rect.top + rect.height / 2) + view.y,
    };
}

type ZoomableImageProps = ComponentProps<'img'> & {
    /** A swipe sideways while not zoomed: −1 the previous photo, 1 the next. */
    onSwipe?: (step: -1 | 1) => void;
};

/**
 * A photo full screen that zooms on its own, as in the gallery of the
 * phone: two fingers (or the trackpad), a double tap or double click, then
 * dragging it around. Not zoomed, a swipe sideways changes photo.
 * `data-zoomable` lets its gestures through (lib/zoom-lock.ts). Give it a
 * `key` per photo: a new photo starts again not zoomed.
 */
export default function ZoomableImage({
    onSwipe,
    className,
    style,
    ...props
}: ZoomableImageProps) {
    const image = useRef<HTMLImageElement>(null);
    const [view, setView] = useState<View>(unzoomed);
    const [moving, setMoving] = useState(false);

    const pointers = useRef(new Map<number, Point>());
    /** Where the gesture started: the view then, the fingers then. */
    const start = useRef<{
        view: View;
        middle: Point;
        distance: number;
        moved: boolean;
    } | null>(null);
    const lastTap = useRef<{ at: number; point: Point } | null>(null);
    /** The phones zoom with their own double tap, not with dblclick. */
    const lastPointer = useRef('mouse');

    const toggleAt = (point: Point) => {
        setView((current) =>
            current.scale > 1
                ? unzoomed
                : zoomAround(
                      image.current,
                      current,
                      TAP_SCALE,
                      fromCenter(image.current, current, point),
                  ),
        );
    };

    /** The middle of the fingers, and how far apart (0 with one). */
    const measure = () => {
        const [first, second] = [...pointers.current.values()];

        if (!second) {
            return { middle: first, distance: 0 };
        }

        return {
            middle: {
                x: (first.x + second.x) / 2,
                y: (first.y + second.y) / 2,
            },
            distance: Math.hypot(first.x - second.x, first.y - second.y),
        };
    };

    const begin = () => {
        const { middle, distance } = measure();

        start.current = {
            view,
            middle: fromCenter(image.current, view, middle),
            distance,
            moved: start.current?.moved ?? false,
        };
    };

    const onPointerDown = (event: ReactPointerEvent<HTMLImageElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        lastPointer.current = event.pointerType;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        });

        if (pointers.current.size === 1) {
            start.current = null;
        }

        begin();
        setMoving(true);
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLImageElement>) => {
        if (!pointers.current.has(event.pointerId) || !start.current) {
            return;
        }

        pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        });

        const from = start.current;
        const { middle, distance } = measure();
        const here = fromCenter(image.current, view, middle);
        const dx = here.x - from.middle.x;
        const dy = here.y - from.middle.y;

        if (Math.hypot(dx, dy) > TAP_SLOP || distance > 0) {
            from.moved = true;
        }

        if (distance > 0 && from.distance > 0) {
            // Two fingers: zoom around them, and follow them.
            const zoomed = zoomAround(
                image.current,
                from.view,
                (from.view.scale * distance) / from.distance,
                from.middle,
            );

            setView(
                clamp(image.current, {
                    ...zoomed,
                    x: zoomed.x + dx,
                    y: zoomed.y + dy,
                }),
            );
        } else if (from.view.scale > 1) {
            // One finger on a zoomed photo: drag it.
            setView(
                clamp(image.current, {
                    ...from.view,
                    x: from.view.x + dx,
                    y: from.view.y + dy,
                }),
            );
        }
    };

    const onPointerEnd = (event: ReactPointerEvent<HTMLImageElement>) => {
        const point = pointers.current.get(event.pointerId);

        if (!point) {
            return;
        }

        const from = start.current;
        const wasAlone = pointers.current.size === 1;

        pointers.current.delete(event.pointerId);

        if (pointers.current.size > 0) {
            // One finger of two lifted: the other one goes on dragging.
            begin();

            return;
        }

        setMoving(false);

        if (!from || !wasAlone || event.type === 'pointercancel') {
            return;
        }

        const here = fromCenter(image.current, view, point);
        const dx = here.x - from.middle.x;
        const dy = here.y - from.middle.y;

        // Not zoomed, a swipe sideways: the next photo.
        if (
            onSwipe &&
            from.view.scale === 1 &&
            Math.abs(dx) > SWIPE &&
            Math.abs(dx) > Math.abs(dy)
        ) {
            onSwipe(dx < 0 ? 1 : -1);

            return;
        }

        // The mouse has the double click (onDoubleClick).
        if (from.moved || event.pointerType === 'mouse') {
            return;
        }

        const previous = lastTap.current;

        if (
            previous &&
            event.timeStamp - previous.at < DOUBLE_TAP_MS &&
            Math.hypot(point.x - previous.point.x, point.y - previous.point.y) <
                TAP_SLOP * 3
        ) {
            lastTap.current = null;
            toggleAt(point);
        } else {
            lastTap.current = { at: event.timeStamp, point };
        }
    };

    // The pinch of the trackpad (Ctrl + wheel): zoom around the pointer.
    // A listener of its own: React's wheel listener can't preventDefault.
    useEffect(() => {
        const element = image.current;

        if (!element) {
            return;
        }

        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey) {
                return;
            }

            event.preventDefault();

            const point = { x: event.clientX, y: event.clientY };

            setView((current) =>
                zoomAround(
                    element,
                    current,
                    current.scale * Math.exp(-event.deltaY / 100),
                    fromCenter(element, current, point),
                ),
            );
        };

        element.addEventListener('wheel', onWheel, { passive: false });

        return () => element.removeEventListener('wheel', onWheel);
    }, []);

    return (
        <img
            {...props}
            ref={image}
            data-zoomable=""
            draggable={false}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onDoubleClick={(event) => {
                if (lastPointer.current === 'mouse') {
                    toggleAt({ x: event.clientX, y: event.clientY });
                }
            }}
            style={{
                ...style,
                transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
                transition: moving ? 'none' : 'transform 200ms ease-out',
            }}
            className={cn(
                'touch-none select-none',
                view.scale > 1
                    ? 'cursor-grab active:cursor-grabbing'
                    : 'cursor-zoom-in',
                className,
            )}
        />
    );
}
