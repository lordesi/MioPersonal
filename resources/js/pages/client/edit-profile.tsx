import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import PreferencesFields, {
    preferencesFormData,
} from '@/components/client/preferences-fields';
import type { SavedPreferences } from '@/components/client/preferences-fields';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
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
 * (pages/onboarding/complete-profile.tsx), changed from the client area.
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
        form.put(update.url(), { preserveScroll: true });
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

            <form
                onSubmit={save}
                className="flex w-full max-w-190 flex-col gap-4 md:gap-5"
            >
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

                <Button
                    type="submit"
                    disabled={form.processing}
                    className="h-12 self-start px-6 text-base font-semibold"
                >
                    Salva modifiche
                </Button>
            </form>
        </>
    );
}

EditProfile.layout = { section: 'profile' };
