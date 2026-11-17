// `npm audit --omit=dev --audit-level=high`, with a short list of advisories
// we accept on purpose. Run by the "Audit dependencies" step of tests.yml.
//
// Fails on every high or critical advisory that is not in ALLOWED. Packages
// that are flagged only because they depend on an allowed one don't count.
import { execSync } from 'node:child_process';

/**
 * Advisories accepted on purpose: the reason, and when to remove each one.
 */
const ALLOWED = new Set([
    // picomatch ReDoS (all versions up to 4.0.7, no fixed release yet). It
    // only reads the file patterns of the build tools (vite, tinyglobby),
    // never text from the site's users. Remove it once picomatch is fixed.
    'GHSA-fc5q-39xc-vjpf',
]);

const LEVELS = new Set(['high', 'critical']);

let output;

try {
    output = execSync('npm audit --omit=dev --json', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
    });
} catch (error) {
    // npm audit exits with 1 when it finds anything: the JSON is still there.
    output = error.stdout;
}

const report = JSON.parse(output);
const blocking = [];
const allowed = [];

for (const [name, entry] of Object.entries(report.vulnerabilities ?? {})) {
    for (const via of entry.via) {
        // A string is "depends on <package>": that package is checked itself.
        if (typeof via === 'string' || !LEVELS.has(via.severity)) {
            continue;
        }

        const id = via.url.split('/').pop();
        const line = `${name}: ${via.title} (${via.url})`;

        (ALLOWED.has(id) ? allowed : blocking).push(line);
    }
}

for (const line of allowed) {
    console.log(`allowed  ${line}`);
}

if (blocking.length > 0) {
    for (const line of blocking) {
        console.error(`BLOCKING ${line}`);
    }

    process.exit(1);
}

console.log('No high or critical advisories outside the allowed list.');
