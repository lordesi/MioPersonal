import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
/** Side of the saved photo, in px: avatars are never bigger than this. */
const OUTPUT_SIZE = 512;
/** How far an arrow key moves the photo, as a share of the frame. */
const KEY_STEP = 0.02;

type Size = { width: number; height: number };

type PhotoCropDialogProps = {
    /** Address of the chosen file (URL.createObjectURL); null = closed. */
    src: string | null;
    onCancel: () => void;
    /** The square part chosen by the client, as a JPG ready to upload. */
    onConfirm: (photo: File) => void;
};

/**
 * "Ritaglia la foto": opens after choosing a photo, so a photo that isn't
 * square is cut instead of squashed. The client drags the photo and zooms;
 * only the part inside the circle is saved.
 */
export default function PhotoCropDialog({
    src,
    onCancel,
    onConfirm,
}: PhotoCropDialogProps) {
    return (
        <Dialog
            open={src !== null}
            onOpenChange={(open) => !open && onCancel()}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ritaglia la foto</DialogTitle>
                    <DialogDescription>
                        Trascina per spostare la foto, usa il cursore per lo
                        zoom.
                    </DialogDescription>
                </DialogHeader>
                {/* A new photo starts again from the center, without zoom. */}
                {src && (
                    <CropEditor
                        key={src}
                        src={src}
                        onCancel={onCancel}
                        onConfirm={onConfirm}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Sizes and positions are in "frames": 1 = the side of the square frame.
 * At zoom 1 the short side of the photo fills the frame exactly, as with
 * object-cover. `offset` is how far the center of the photo is moved from
 * the center of the frame.
 */
function CropEditor({
    src,
    onCancel,
    onConfirm,
}: {
    src: string;
    onCancel: () => void;
    onConfirm: (photo: File) => void;
}) {
    const frameRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const dragRef = useRef<{
        pointerX: number;
        pointerY: number;
        x: number;
        y: number;
    } | null>(null);
    // Null until the photo is loaded: its proportions are needed for everything.
    const [natural, setNatural] = useState<Size | null>(null);
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // The photo shown, in frames (always at least 1 x 1).
    const shortSide = natural ? Math.min(natural.width, natural.height) : 1;
    const shown = {
        width: natural ? (zoom * natural.width) / shortSide : 1,
        height: natural ? (zoom * natural.height) / shortSide : 1,
    };

    // The photo can't move so far that an empty corner shows in the frame.
    const clamp = (x: number, y: number, size: Size = shown) => {
        const maxX = (size.width - 1) / 2;
        const maxY = (size.height - 1) / 2;

        return {
            x: Math.min(maxX, Math.max(-maxX, x)),
            y: Math.min(maxY, Math.max(-maxY, y)),
        };
    };

    const changeZoom = (value: number) => {
        setZoom(value);
        // Zooming out can leave the photo too far: it is brought back.
        setOffset(
            clamp(offset.x, offset.y, {
                width: (shown.width * value) / zoom,
                height: (shown.height * value) / zoom,
            }),
        );
    };

    const startDrag = (event: PointerEvent<HTMLDivElement>) => {
        // Keeps receiving the moves even outside the frame.
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            ...offset,
        };
    };

    const drag = (event: PointerEvent<HTMLDivElement>) => {
        const start = dragRef.current;
        const frameSide = frameRef.current?.clientWidth;

        if (!start || !frameSide) {
            return;
        }

        setOffset(
            clamp(
                start.x + (event.clientX - start.pointerX) / frameSide,
                start.y + (event.clientY - start.pointerY) / frameSide,
            ),
        );
    };

    const endDrag = () => {
        dragRef.current = null;
    };

    // The arrows move the photo, for who doesn't use a mouse.
    const moveWithKeys = (event: KeyboardEvent<HTMLDivElement>) => {
        const moves: Record<string, [number, number]> = {
            ArrowLeft: [-KEY_STEP, 0],
            ArrowRight: [KEY_STEP, 0],
            ArrowUp: [0, -KEY_STEP],
            ArrowDown: [0, KEY_STEP],
        };
        const move = moves[event.key];

        if (!move) {
            return;
        }

        event.preventDefault();
        setOffset(clamp(offset.x + move[0], offset.y + move[1]));
    };

    /** Draws the part inside the frame on a square canvas and makes it a JPG. */
    const confirm = () => {
        const image = imageRef.current;

        if (!image || !natural) {
            return;
        }

        // One frame, in pixels of the original photo.
        const frameInPixels = shortSide / zoom;
        const left = ((shown.width - 1) / 2 - offset.x) * frameInPixels;
        const top = ((shown.height - 1) / 2 - offset.y) * frameInPixels;
        // A small photo isn't made bigger: it would only weigh more.
        const side = Math.min(OUTPUT_SIZE, Math.round(frameInPixels));

        const canvas = document.createElement('canvas');
        canvas.width = side;
        canvas.height = side;
        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        // JPG has no transparency: the transparent parts of a PNG become white.
        context.fillStyle = '#fff';
        context.fillRect(0, 0, side, side);
        context.drawImage(
            image,
            left,
            top,
            frameInPixels,
            frameInPixels,
            0,
            0,
            side,
            side,
        );

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    onConfirm(
                        new File([blob], 'photo.jpg', { type: 'image/jpeg' }),
                    );
                }
            },
            'image/jpeg',
            0.9,
        );
    };

    return (
        <>
            <div
                ref={frameRef}
                tabIndex={0}
                role="group"
                aria-label="Foto da ritagliare: usa le frecce per spostarla"
                onPointerDown={startDrag}
                onPointerMove={drag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={moveWithKeys}
                className="relative aspect-square w-full cursor-grab touch-none overflow-hidden rounded-xl bg-muted outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
            >
                <img
                    ref={imageRef}
                    src={src}
                    alt="Anteprima della foto scelta"
                    draggable={false}
                    onLoad={(event) =>
                        setNatural({
                            width: event.currentTarget.naturalWidth,
                            height: event.currentTarget.naturalHeight,
                        })
                    }
                    // Size and position change while dragging: they can't be classes.
                    style={{
                        width: `${shown.width * 100}%`,
                        height: `${shown.height * 100}%`,
                        left: `${((1 - shown.width) / 2 + offset.x) * 100}%`,
                        top: `${((1 - shown.height) / 2 + offset.y) * 100}%`,
                    }}
                    className="pointer-events-none absolute max-w-none"
                />
                {/* The circle of the avatar: what's outside is faded. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full border-2 border-background ring-[100vmax] ring-background/60"
                />
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Zoom</span>
                <Slider
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={[zoom]}
                    onValueChange={([value]) => changeZoom(value)}
                    thumbLabel="Zoom"
                    valueText={`${Math.round(zoom * 100)}%`}
                    disabled={!natural}
                    className="py-2"
                />
            </div>

            <DialogFooter className="gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={onCancel}
                >
                    Annulla
                </Button>
                <Button
                    type="button"
                    className="h-10 font-semibold"
                    disabled={!natural}
                    onClick={confirm}
                >
                    Usa questa foto
                </Button>
            </DialogFooter>
        </>
    );
}
