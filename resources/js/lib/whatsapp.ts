/**
 * The wa.me link of a phone number: digits only, with the country code.
 * Numbers saved without a prefix are Italian ("333 1234567" → 393331234567);
 * "0039…" counts as "+39…".
 */
export function whatsAppUrl(phone: string, text?: string): string {
    const trimmed = phone.trim();
    let digits = trimmed.replace(/\D/g, '');

    if (!trimmed.startsWith('+')) {
        if (digits.startsWith('00')) {
            digits = digits.slice(2);
        } else if (digits !== '' && digits.length <= 10) {
            digits = `39${digits}`;
        }
    }

    const query = text ? `?text=${encodeURIComponent(text)}` : '';

    return `https://wa.me/${digits}${query}`;
}
