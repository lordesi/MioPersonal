import QRCode from 'qrcode';
import { MARK_PATH } from '@/components/layout/brand-logo';

/** What the image shows (TrainerShareController::card). */
export type StoryCard = {
    name: string;
    headline: string;
    city: string;
    disciplines: string[];
    rating: number | null;
    reviewCount: number;
    photoUrl: string | null;
    /** Where the QR code leads. */
    link: string;
};

/** Instagram stories: 9:16. */
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const FONT = "'Geist', ui-sans-serif, system-ui, sans-serif";
const INK = '#0a0a0a';
const WHITE = '#ffffff';
const MUTED = '#a3a3a3';
const LINE = '#262626';

/** A PNG of the QR code, black on white, for print or the image. */
export function qrDataUrl(link: string, width = 1024): Promise<string> {
    return QRCode.toDataURL(link, {
        width,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: INK, light: WHITE },
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

/** The words of `text` in lines no wider than `width`, at most `max` lines. */
function lines(
    context: CanvasRenderingContext2D,
    text: string,
    width: number,
    max: number,
): string[] {
    const result: string[] = [];
    let line = '';

    for (const word of text.split(/\s+/)) {
        const next = line === '' ? word : `${line} ${word}`;

        if (context.measureText(next).width <= width || line === '') {
            line = next;
        } else {
            result.push(line);
            line = word;
        }
    }

    if (line !== '') {
        result.push(line);
    }

    if (result.length > max) {
        result.length = max;
        result[max - 1] = `${result[max - 1].replace(/\s*\S*$/, '')}…`;
    }

    return result;
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

/**
 * Draws the story on `canvas` (1080 × 1920), in black and white as the
 * site: logo, photo, name, headline, city and disciplines, stars, and a
 * white card with the QR code and "Prenota su MioPersonal".
 */
export async function drawStory(
    canvas: HTMLCanvasElement,
    card: StoryCard,
): Promise<void> {
    canvas.width = STORY_WIDTH;
    canvas.height = STORY_HEIGHT;
    const context = canvas.getContext('2d');

    if (!context) {
        return;
    }

    await Promise.all([
        document.fonts.load(`700 80px ${FONT}`),
        document.fonts.load(`500 40px ${FONT}`),
    ]).catch(() => undefined);

    const [photo, qr] = await Promise.all([
        card.photoUrl ? loadImage(card.photoUrl).catch(() => null) : null,
        qrDataUrl(card.link, 400).then(loadImage),
    ]);

    const center = STORY_WIDTH / 2;
    context.fillStyle = INK;
    context.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';

    // The logo: the mark of the site, white, at the top.
    context.save();
    context.translate(center - 63, 120);
    context.scale(0.3, 0.3);
    context.fillStyle = WHITE;
    context.fill(new Path2D(MARK_PATH));
    context.restore();
    context.fillStyle = WHITE;
    context.font = `600 40px ${FONT}`;
    context.fillText('MioPersonal', center, 250);

    // The photo in a circle, or the initials.
    const photoSize = 520;
    const photoTop = 330;
    context.save();
    context.beginPath();
    context.arc(
        center,
        photoTop + photoSize / 2,
        photoSize / 2,
        0,
        Math.PI * 2,
    );
    context.closePath();
    context.clip();

    if (photo) {
        const side = Math.min(photo.width, photo.height);
        context.drawImage(
            photo,
            (photo.width - side) / 2,
            (photo.height - side) / 2,
            side,
            side,
            center - photoSize / 2,
            photoTop,
            photoSize,
            photoSize,
        );
    } else {
        context.fillStyle = LINE;
        context.fillRect(
            center - photoSize / 2,
            photoTop,
            photoSize,
            photoSize,
        );
        context.fillStyle = WHITE;
        context.font = `700 180px ${FONT}`;
        context.fillText(
            initials(card.name),
            center,
            photoTop + photoSize / 2 + 64,
        );
    }

    context.restore();

    // Name, headline, city and disciplines.
    let y = photoTop + photoSize + 130;
    context.fillStyle = WHITE;
    context.font = `700 80px ${FONT}`;

    for (const line of lines(context, card.name, 940, 2)) {
        context.fillText(line, center, y);
        y += 92;
    }

    context.fillStyle = MUTED;
    context.font = `500 40px ${FONT}`;
    y += 6;

    for (const line of lines(context, card.headline, 900, 2)) {
        context.fillText(line, center, y);
        y += 54;
    }

    const where = [card.city, ...card.disciplines].join(' · ');
    context.fillStyle = WHITE;
    context.font = `500 36px ${FONT}`;
    y += 16;
    context.fillText(lines(context, where, 940, 1)[0] ?? '', center, y);

    // The stars, or "Nuovo su MioPersonal".
    const rating =
        card.rating === null
            ? 'Nuovo su MioPersonal'
            : `★ ${card.rating.toFixed(1).replace('.', ',')} · ${card.reviewCount} ${card.reviewCount === 1 ? 'recensione' : 'recensioni'}`;
    context.font = `600 36px ${FONT}`;
    const pillWidth = context.measureText(rating).width + 64;
    y += 50;
    context.fillStyle = LINE;
    context.beginPath();
    context.roundRect(center - pillWidth / 2, y, pillWidth, 72, 36);
    context.fill();
    context.fillStyle = WHITE;
    context.fillText(rating, center, y + 49);

    // The white card at the bottom: QR code and the call to action.
    const cardTop = 1430;
    const cardHeight = 400;
    context.fillStyle = WHITE;
    context.beginPath();
    context.roundRect(80, cardTop, STORY_WIDTH - 160, cardHeight, 40);
    context.fill();

    const qrSize = 320;
    context.drawImage(qr, 120, cardTop + 40, qrSize, qrSize);

    context.textAlign = 'left';
    context.fillStyle = INK;
    context.font = `700 56px ${FONT}`;
    context.fillText('Prenota', 490, cardTop + 150);
    context.fillText('con me su', 490, cardTop + 214);
    context.fillText('MioPersonal', 490, cardTop + 278);
    context.fillStyle = '#737373';
    context.font = `500 32px ${FONT}`;
    context.fillText('Inquadra il codice', 490, cardTop + 336);
}

/** The canvas as a PNG file, to download or share. */
export function canvasFile(
    canvas: HTMLCanvasElement,
    name: string,
): Promise<File | null> {
    return new Promise((resolve) =>
        canvas.toBlob(
            (blob) =>
                resolve(
                    blob ? new File([blob], name, { type: 'image/png' }) : null,
                ),
            'image/png',
        ),
    );
}

/** Saves a file with the browser's download. */
export function download(file: Blob, name: string): void {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
