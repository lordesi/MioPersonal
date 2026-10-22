import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import PreferencesFields, {
    preferencesFormData,
} from '@/components/client/preferences-fields';
import type { SavedPreferences } from '@/components/client/preferences-fields';
import PreferencesPreview from '@/components/client/preferences-preview';
import PageHeading from '@/components/trainer/area/page-heading';
import { update } from '@/routes/client/profile';
import type { CatalogOption, CityWithCoordinates } from '@/types';

type EditProfileProps = {
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityWithCoordinates[];
    /** Null until the client saves the answers once. */
    preferences: SavedPreferences | null;
};

/**
 * "Modifica il mio profilo": the answers of "Completa il tuo profilo"
 * (pages/onboarding/complete-profile.tsx), changed from the client area,
 * with the black "Anteprima" panel and its "Salva modifiche" on the right.
 * After saving, the page stays open with the "Profilo aggiornato." toast.
 */
export default function EditProfile({
    disciplines,
    cities,
    preferences,
}: EditProfileProps) {
    const form = useForm(preferencesFormData(preferences));

    const save = (event: FormEvent) => {
        event.preventDefault();
        form.put(update.url(), {
            preserveScroll: true,
            // The saved answers are the new starting point: "Salva modifiche" turns off.
            onSuccess: () => form.setDefaults(),
        });
    };

    // Only possible if someone changes the page by hand: one line is enough.
    const firstError = Object.values(form.errors)[0];

    return (
        <>
            <Head title="Modifica il mio profilo" />

            <PageHeading
                title="Modifica il mio profilo"
                description="Ci aiuta a suggerirti i trainer e gli orari giusti. Non ti chiediamo dati sulla salute."
            />

            <form onSubmit={save} className="flex flex-wrap items-start gap-5">
                <div className="flex min-w-0 flex-[3_1_560px] flex-col gap-4">
                    <PreferencesFields
                        data={form.data}
                        setData={form.setData}
                        disciplines={disciplines}
                        cities={cities}
                    />

                    {firstError && (
                        <p role="alert" className="text-sm text-destructive">
                            {firstError}
                        </p>
                    )}
                </div>
                <aside className="min-w-0 flex-[2_1_320px] lg:sticky lg:top-6">
                    <PreferencesPreview
                        data={form.data}
                        disciplines={disciplines}
                        cities={cities}
                        changed={form.isDirty}
                        saving={form.processing}
                    />
                </aside>
            </form>
        </>
    );
}

EditProfile.layout = { section: 'profile' };
