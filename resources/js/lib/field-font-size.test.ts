import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

/*
 * On iPhone, touching a field written smaller than 16px zooms the page in,
 * and it stays zoomed after typing. So on phones every field is at least
 * 16px (17px, as iOS, where the design says so); desktop (`md:`) can be
 * smaller. This test reads the components and lists the fields that break
 * the rule.
 */

const root = fileURLToPath(new URL('..', import.meta.url));

const fieldTag =
    /<(input|textarea|select|Input|Textarea|PasswordInput|CommandInput)\b/g;

/** Types that show no text: checkboxes, photos… */
const noTextType = /type=["'](checkbox|radio|file|hidden|range|color)["']/;

/** The breakpoints of the desktop: a size behind them is not on phones. */
const desktopVariant = /(^|:)(sm|md|lg|xl|2xl|min-\[[^\]]+\]):/;

/** Sizes of a part of the field, not of what is typed: `file:text-sm`. */
const partVariant = /(^|:)(file|placeholder|selection):/;

function tsxFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);

        if (statSync(path).isDirectory()) {
            return tsxFiles(path);
        }

        return path.endsWith('.tsx') ? [path] : [];
    });
}

/** The tag from `<` to its `>`, skipping the `>` inside `{…}` and strings. */
function tagSource(source: string, start: number): string {
    let depth = 0;
    let quote: string | null = null;

    for (let i = start + 1; i < source.length; i++) {
        const char = source[i];

        if (quote) {
            if (char === quote && source[i - 1] !== '\\') {
                quote = null;
            }
        } else if (char === '"' || char === "'" || char === '`') {
            quote = char;
        } else if (char === '{') {
            depth++;
        } else if (char === '}') {
            depth--;
        } else if (char === '>' && depth === 0) {
            return source.slice(start, i + 1);
        }
    }

    return source.slice(start);
}

/** The strings of the tag, and of the class constants it names (`pillClassName`). */
function classStrings(tag: string, source: string): string[] {
    const strings = [...tag.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map(
        (match) => match[2],
    );

    for (const [name] of tag.matchAll(/\b\w*[cC]lass(Name)?\w*\b/g)) {
        const constant = new RegExp(
            `const ${name}\\s*=\\s*(["'\`])((?:(?!\\1)[^\\\\]|\\\\.)*)\\1`,
        ).exec(source);

        if (constant) {
            strings.push(constant[2]);
        }
    }

    return strings;
}

/** The font size in px of a Tailwind class on phones, or null. */
function phonePixels(token: string): number | null {
    if (desktopVariant.test(token) || partVariant.test(token)) {
        return null;
    }

    const utility = token.split(':').pop() ?? '';

    if (utility === 'text-xs') {
        return 12;
    }

    if (utility === 'text-sm') {
        return 14;
    }

    const arbitrary = /^text-\[(\d+(?:\.\d+)?)(px|rem)\]$/.exec(utility);

    if (arbitrary) {
        const value = Number(arbitrary[1]);

        return arbitrary[2] === 'rem' ? value * 16 : value;
    }

    return null;
}

function smallFields(): string[] {
    const found: string[] = [];

    for (const file of tsxFiles(root)) {
        const source = readFileSync(file, 'utf8');

        for (const match of source.matchAll(fieldTag)) {
            const tag = tagSource(source, match.index);

            if (noTextType.test(tag)) {
                continue;
            }

            const small = classStrings(tag, source)
                .flatMap((text) => text.split(/\s+/))
                .filter((token) => {
                    const pixels = phonePixels(token);

                    return pixels !== null && pixels < 16;
                });

            if (small.length > 0) {
                const line = source.slice(0, match.index).split('\n').length;

                found.push(
                    `${relative(root, file).replaceAll('\\', '/')}:${line} ${small.join(' ')}`,
                );
            }
        }
    }

    return found;
}

describe('the fields on phones', () => {
    it('are written at least at 16px, so iPhone does not zoom in', () => {
        expect(smallFields()).toEqual([]);
    });
});
