/**
 * Makes a photo smaller before the upload, without a library: it is drawn on
 * a <canvas> at most `maxSide` px on the longer side and saved as JPEG.
 * A phone photo goes from ~5 MB to a few hundred KB. When the browser can't
 * do it, or the photo is already small, the original file is returned (the
 * server checks it anyway).
 */
export async function shrinkImage(
    file: File,
    maxSide = 2000,
    quality = 0.85,
): Promise<File> {
    try {
        // imageOrientation: phone photos keep the way they were taken.
        const bitmap = await createImageBitmap(file, {
            imageOrientation: 'from-image',
        });
        const scale = Math.min(
            1,
            maxSide / Math.max(bitmap.width, bitmap.height),
        );
        const width = Math.round(bitmap.width * scale);
        const height = Math.round(bitmap.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        if (!context) {
            bitmap.close();

            return file;
        }

        // A white background: a transparent PNG doesn't turn black in JPEG.
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);
        context.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', quality),
        );

        // Keep the original when it is already lighter.
        if (!blob || blob.size >= file.size) {
            return file;
        }

        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';

        return new File([blob], name, { type: 'image/jpeg' });
    } catch {
        return file;
    }
}
