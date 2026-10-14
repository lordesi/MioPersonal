import { Head } from '@inertiajs/react';

/** "Impostazioni e registro": empty for now, only the title in the header. */
export default function Settings() {
    return <Head title="Admin · Impostazioni e registro" />;
}

Settings.layout = { section: 'settings' };
