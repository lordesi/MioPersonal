import { Head, Link, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import TrainerProfileEditController from '@/actions/App/Http/Controllers/TrainerProfileEditController';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    isProfileComplete,
    isCertificationValid,
    needsCity,
    stepOfField,
    toProfilePayload,
} from '@/components/onboarding/trainer/draft';
import StepCertifications from '@/components/onboarding/trainer/step-certifications';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import StepPlaces from '@/components/onboarding/trainer/step-places';
import StepProfile from '@/components/onboarding/trainer/step-profile';
import { EditingProfileContext } from '@/components/onboarding/trainer/step-title';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import PageHeading from '@/components/trainer/area/page-heading';
import GalleryPhotos from '@/components/trainer/profile/gallery-photos';
import type { GalleryPhoto } from '@/components/trainer/profile/gallery-photos';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes/trainer';
import type { CatalogOption, CityOption } from '@/types';

type ProfileProps = {
    /** null until the team approves the profile: it is changed from "Diventa trainer". */
    draft: Omit<TrainerDraft, 'photo'> | null;
    /** Options of "Discipline, luoghi e città", from the catalog. */
    disciplines: CatalogOption[];
    cities: CityOption[];
    /** "Foto della galleria", saved one action at a time. */
    gallery: GalleryPhoto[];
    maxGalleryPhotos: number;
};

export default function Profile({
    draft,
    disciplines,
    cities,
    gallery,
    maxGalleryPhotos,
}: ProfileProps) {
    return (
        <>
            <Head title="Modifica profilo" />

            <PageHeading
                title="Modifica profilo"
                description="Le modifiche sono visibili sul tuo profilo pubblico appena le salvi."
            />

            {draft === null ? (
                <p className="text-sm text-muted-foreground">
                    Finché il profilo non è approvato lo modifichi dalla{' '}
                    <Link
                        href={register()}
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        registrazione da trainer
                    </Link>
                    .
                </p>
            ) : (
                <ProfileForm
                    saved={draft}
                    disciplines={disciplines}
                    cities={cities}
                    gallery={
                        <GalleryPhotos
                            photos={gallery}
                            max={maxGalleryPhotos}
                        />
                    }
                />
            )}
        </>
    );
}

/**
 * Steps 2, 3 and 6 of "Diventa trainer" on one page, saved with one
 * button. The steps edit one draft, as in the registration. The services
 * (step 4) are changed from "Servizi".
 */
function ProfileForm({
    saved,
    disciplines,
    cities,
    gallery,
}: {
    saved: Omit<TrainerDraft, 'photo'>;
    disciplines: CatalogOption[];
    cities: CityOption[];
    /** Shown after the profile photo; its buttons don't submit this form. */
    gallery: ReactNode;
}) {
    const [draft, setDraft] = useState<TrainerDraft>({
        ...saved,
        photo: null,
    });
    // Only the request: the fields live in `draft`.
    const form = useForm({});
    const [changed, setChanged] = useState(false);
    // "Salva modifiche" asks first: the changes are public right away.
    const [confirming, setConfirming] = useState(false);

    const update = (changes: Partial<TrainerDraft>) => {
        setDraft({ ...draft, ...changes });
        setChanged(true);
    };

    // The same checks that let the registration go on, step by step.
    const complete =
        isProfileComplete(draft) &&
        draft.disciplines.length > 0 &&
        draft.places.length > 0 &&
        (!needsCity(draft) || draft.city !== '') &&
        draft.certifications.every(isCertificationValid);

    const errorsOf = (step: number) =>
        Object.entries(form.errors as Record<string, string>)
            .filter(([field]) => stepOfField(field) === step)
            .map(([, message]) => message);

    // The button and Enter in a field only open the dialog.
    const askToSave = (event: React.FormEvent) => {
        event.preventDefault();

        if (complete && !form.processing) {
            setConfirming(true);
        }
    };

    const save = () => {
        // With files the data goes as FormData: PUT travels as a POST with _method.
        form.transform(() => ({ _method: 'put', ...toProfilePayload(draft) }));
        form.post(TrainerProfileEditController.update.url(), {
            preserveScroll: true,
            // Lists of objects in FormData need indices.
            queryStringArrayFormat: 'indices',
            // Start again from what was saved: new photo URL and new
            // certification ids (an old id would lose its file next time).
            onSuccess: (page) => {
                const next = (page.props as unknown as ProfileProps).draft;

                if (next) {
                    setDraft({ ...next, photo: null });
                }

                setChanged(false);
            },
        });
    };

    return (
        <EditingProfileContext.Provider value={true}>
            <form
                noValidate
                onSubmit={askToSave}
                className="flex flex-col gap-5"
            >
                <Card errors={errorsOf(2)}>
                    <StepProfile draft={draft} update={update} />
                </Card>
                {gallery}
                <Card errors={errorsOf(3)}>
                    <StepPlaces
                        draft={draft}
                        update={update}
                        disciplines={disciplines}
                        cities={cities}
                    />
                </Card>
                <Card errors={errorsOf(6)}>
                    <StepCertifications draft={draft} update={update} />
                </Card>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="submit"
                        disabled={!complete || form.processing}
                        className="h-10 font-semibold"
                    >
                        {form.processing && <Spinner />}
                        Salva modifiche
                    </Button>
                    {!complete && (
                        <span className="text-sm text-muted-foreground">
                            Completa i campi obbligatori per salvare.
                        </span>
                    )}
                    {form.recentlySuccessful && !changed && (
                        <span role="status" className="text-sm">
                            ✓ Salvato
                        </span>
                    )}
                </div>
            </form>
            <ConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title="Salvare le modifiche?"
                description="Saranno visibili subito sul tuo profilo pubblico."
                confirmLabel="Salva"
                onConfirm={save}
            />
        </EditingProfileContext.Provider>
    );
}

/** One step of the registration, as a card of the page. */
function Card({ errors, children }: { errors: string[]; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-5 rounded-xl border bg-card p-4 md:p-5">
            <StepErrors errors={errors} />
            {children}
        </section>
    );
}
