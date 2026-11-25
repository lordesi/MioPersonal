import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import PreferencesFields, {
    PhotoUpload,
    preferencesFormData,
} from '@/components/client/preferences-fields';
import type {
    BirthYears,
    SavedPreferences,
} from '@/components/client/preferences-fields';
import {
    areaButtonClassName,
    areaTitleClassName,
} from '@/components/mp/area-bits';
import { cn } from '@/lib/utils';
import { update } from '@/routes/client/profile';
import type { CatalogOption, CityWithCoordinates } from '@/types';

type EditProfileProps = {
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityWithCoordinates[];
    /** Null until the client saves the answers once. */
    preferences: SavedPreferences | null;
    birthYears: BirthYears;
};

/**
 * "Modifica profilo" (design "Modifica profilo cliente · V1"): the photo
 * with the pencil, then the answers of "Completa il tuo profilo" in sections
 * that open one at a time, and "Salva modifiche". The photo is saved as soon
 * as it is chosen; after saving, the page stays open with the toast.
 */
export default function EditProfile({
    disciplines,
    cities,
    preferences,
    birthYears,
}: EditProfileProps) {
    const { auth } = usePage().props;
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
            <Head title="Modifica profilo" />

            <h1 className={areaTitleClassName}>Modifica profilo</h1>

            <form
                onSubmit={save}
                className="flex w-full max-w-170 flex-col gap-6"
            >
                <PhotoUpload
                    name={auth?.user?.name ?? ''}
                    src={auth?.user?.avatar}
                />

                <div className="flex flex-col">
                    <PreferencesFields
                        data={form.data}
                        setData={form.setData}
                        disciplines={disciplines}
                        cities={cities}
                        birthYears={birthYears}
                    />
                </div>

                {firstError && (
                    <p role="alert" className="text-sm text-destructive">
                        {firstError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={!form.isDirty || form.processing}
                    className={cn(
                        areaButtonClassName('primary', 'lg'),
                        'w-full md:w-auto md:self-start',
                    )}
                >
                    {form.processing ? 'Salvo…' : 'Salva modifiche'}
                </button>
            </form>
        </>
    );
}

EditProfile.layout = { section: 'edit-profile' };
