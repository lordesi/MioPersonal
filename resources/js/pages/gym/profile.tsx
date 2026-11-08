import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    GymContactsFields,
    GymDetailsFields,
    GymPhotosFields,
    GymServicesFields,
} from '@/components/gym/gym-form-fields';
import type { GymDraft } from '@/components/onboarding/gym/draft';
import {
    isDetailsComplete,
    isServicesComplete,
    toGymPayload,
} from '@/components/onboarding/gym/draft';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { amenities as amenitiesPage } from '@/routes/gym';
import { update } from '@/routes/gym/profile';
import type { CatalogOption } from '@/types';

type GymProfileEditProps = {
    draft: Omit<GymDraft, 'cover' | 'gallery'>;
    cities: CatalogOption[];
    amenities: CatalogOption[];
};

/** "Modifica profilo": public right away, no new review. */
export default function GymProfileEdit({
    draft: saved,
    cities,
    amenities,
}: GymProfileEditProps) {
    const [draft, setDraft] = useState<GymDraft>({
        ...saved,
        cover: null,
        gallery: [],
    });
    const form = useForm({});
    const change = (changes: Partial<GymDraft>) =>
        setDraft((current) => ({ ...current, ...changes }));
    const errors = form.errors as Partial<Record<string, string>>;
    const ready = isDetailsComplete(draft) && isServicesComplete(draft);

    const save = () => {
        form.transform(() => ({
            ...toGymPayload(draft, false),
            // Files go as FormData: PUT is sent as POST with _method.
            _method: 'put',
        }));
        form.post(update.url(), {
            queryStringArrayFormat: 'indices',
            preserveScroll: true,
            onSuccess: () => change({ cover: null }),
            onError: () => window.scrollTo({ top: 0 }),
        });
    };

    return (
        <>
            <Head title="Modifica profilo" />

            <PageHeading
                title="Modifica profilo"
                description="Le modifiche sono pubbliche subito."
            />

            <StepErrors
                errors={Object.values(errors).filter(
                    (message): message is string => !!message,
                )}
                title="Da sistemare:"
            />

            <form
                noValidate
                className="flex max-w-200 flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault();

                    if (ready && !form.processing) {
                        save();
                    }
                }}
            >
                <GymDetailsFields
                    draft={draft}
                    update={change}
                    errors={errors}
                    cities={cities}
                />
                <GymServicesFields
                    draft={draft}
                    update={change}
                    errors={errors}
                    amenities={amenities}
                />
                <p className="text-sm text-muted-foreground">
                    Vuoi raccontare meglio un servizio, ad esempio il bagno
                    turco?{' '}
                    <Link
                        href={amenitiesPage()}
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        Aggiungi foto e descrizioni
                    </Link>
                </p>
                <GymPhotosFields
                    draft={draft}
                    update={change}
                    errors={errors}
                    withGallery={false}
                />
                <GymContactsFields
                    draft={draft}
                    update={change}
                    errors={errors}
                />
                <div className="sticky bottom-20 z-10 flex justify-end rounded-[20px] border bg-card/95 p-3 shadow-lg backdrop-blur-sm md:bottom-4">
                    <Button
                        type="submit"
                        disabled={!ready || form.processing}
                        className="h-11 rounded-xl px-5 font-semibold"
                    >
                        {form.processing && <Spinner />}
                        Salva modifiche
                    </Button>
                </div>
            </form>
        </>
    );
}

GymProfileEdit.layout = { section: 'profile' };
