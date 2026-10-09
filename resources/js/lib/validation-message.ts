export type FormControl =
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement;

/**
 * Italian message for a field the browser found invalid (`required`,
 * `type="email"`, `minLength`…), shown instead of its own bubble.
 */
export function validationMessage(field: FormControl): string {
    const { validity } = field;

    if (validity.valueMissing) {
        return field.type === 'checkbox'
            ? 'Spunta la casella per continuare.'
            : 'Compila questo campo.';
    }

    if (validity.typeMismatch && field.type === 'email') {
        return 'Inserisci un’email valida, es. nome@esempio.it.';
    }

    if (validity.tooShort && !(field instanceof HTMLSelectElement)) {
        return `Almeno ${field.minLength} caratteri.`;
    }

    return 'Controlla questo campo.';
}
