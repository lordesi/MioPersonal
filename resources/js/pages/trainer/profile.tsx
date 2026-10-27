import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import TrainerProfileEditController from '@/actions/App/Http/Controllers/TrainerProfileEditController';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    isCertificationValid,
    isProfileComplete,
    MAX_GOALS,
    needsCity,
    stepOfField,
    toProfilePayload,
} from '@/components/onboarding/trainer/draft';
import { usePhotoPreview } from '@/components/onboarding/trainer/step-profile';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import PageHeading from '@/components/trainer/area/page-heading';
import CertificationsSection from '@/components/trainer/profile/certifications-section';
import GalleryPhotos from '@/components/trainer/profile/gallery-photos';
import type { GalleryPhoto } from '@/components/trainer/profile/gallery-photos';
import ProfilePreview, {
    profileChecks,
} from '@/components/trainer/profile/profile-preview';
import PublicProfileSection from '@/components/trainer/profile/public-profile-section';
import SearchSection from '@/components/trainer/profile/search-section';
import { register } from '@/routes/trainer';
import type { CatalogOption, CityOption } from '@/types';

type ProfileProps = {
    /** null until the registration is sent: it is filled in from "Diventa trainer". */
    draft: Omit<TrainerDraft, 'photo'> | null;
    /** False until the team approves the profile: shown, but locked. */
    editable: boolean;
    /** Options of "Discipline, obiettivi, luoghi e città", from the catalog. */
    disciplines: CatalogOption[];
    cities: CityOption[];
    /** "Foto della galleria", saved one action at a time. */
    gallery: GalleryPhoto[];
    maxGalleryPhotos: number;
    /** "Nuovo" (value null) or the stars, in the preview. */
    rating: { value: number | null; count: number } | null;
};

export default function Profile({
    draft,
    editable,
    disciplines,
    cities,
    gallery,
    maxGalleryPhotos,
    rating,
}: ProfileProps) {
    return (
        <>
            <Head title="Modifica profilo" />

            <PageHeading title="Modifica profilo" />

            {draft === null || rating === null ? (
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
                    locked={!editable}
                    disciplines={disciplines}
                    cities={cities}
                    gallery={gallery}
                    maxGalleryPhotos={maxGalleryPhotos}
                    rating={rating}
                />
            )}
        </>
    );
}

/**
 * The four sections on the left (steps 2, 3 and 6 of "Diventa trainer"),
 * the preview with "Salva modifiche" on the right. The fields are saved
 * with one button, public right away; the gallery photos are saved one
 * action at a time. The services are changed from "Servizi". Locked
 * before the approval: everything is shown, nothing can be changed.
 */
function ProfileForm({
    saved,
    locked,
    disciplines,
    cities,
    gallery,
    maxGalleryPhotos,
    rating,
}: {
    saved: Omit<TrainerDraft, 'photo'>;
    locked: boolean;
    disciplines: CatalogOption[];
    cities: CityOption[];
    gallery: GalleryPhoto[];
    maxGalleryPhotos: number;
    rating: { value: number | null; count: number };
}) {
    const userName = usePage().props.auth?.user?.name ?? '';
    const [draft, setDraft] = useState<TrainerDraft>({
        ...saved,
        photo: null,
    });
    const photo = usePhotoPreview(draft);
    // Only the request: the fields live in `draft`.
    const form = useForm({});
    const [changed, setChanged] = useState(false);
    // "Salva modifiche" asks first: the changes are public right away.
    const [confirming, setConfirming] = useState(false);

    const update = (changes: Partial<TrainerDraft>) => {
        setDraft({ ...draft, ...changes });
        setChanged(true);
    };

    // The same checks as the server (TrainerProfileUpdateRequest).
    const complete =
        isProfileComplete(draft) &&
        draft.disciplines.length > 0 &&
        draft.goals.length > 0 &&
        draft.goals.length <= MAX_GOALS &&
        draft.places.length > 0 &&
        (!draft.places.includes('studio') ||
            draft.studios.every(
                (studio) =>
                    studio.name.trim() !== '' && studio.address.trim() !== '',
            )) &&
        (!needsCity(draft) || draft.city !== '') &&
        draft.certifications.every(isCertificationValid);

    const errorsOf = (step: number) =>
        Object.entries(form.errors as Record<string, string>)
            .filter(([field]) => stepOfField(field) === step)
            .map(([, message]) => message);

    // The button and Enter in a field only open the dialog.
    const askToSave = (event: React.FormEvent) => {
        event.preventDefault();

        if (!locked && changed && complete && !form.processing) {
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

    // null when nothing changed: the preview shows no status.
    let status: string | null = 'Modifiche non salvate';

    if (locked) {
        status = 'Prima di poter modificare il profilo, deve essere approvato.';
    } else if (form.processing) {
        status = 'Salvataggio…';
    } else if (!changed) {
        status = null;
    }

    return (
        <>
            <form
                noValidate
                onSubmit={askToSave}
                className="flex flex-wrap items-start gap-5"
            >
                {/* Disabled: the browser turns off every field and button inside. */}
                <fieldset
                    disabled={locked}
                    className="flex min-w-0 flex-[3_1_560px] flex-col gap-4"
                >
                    <PublicProfileSection
                        draft={draft}
                        update={update}
                        photo={photo}
                        userName={userName}
                        errors={errorsOf(2)}
                    />
                    {/* Its buttons don't submit this form: each action is saved right away. */}
                    <GalleryPhotos photos={gallery} max={maxGalleryPhotos} />
                    <SearchSection
                        draft={draft}
                        update={update}
                        disciplines={disciplines}
                        cities={cities}
                        errors={errorsOf(3)}
                    />
                    <CertificationsSection
                        draft={draft}
                        update={update}
                        errors={errorsOf(6)}
                    />
                </fieldset>
                <aside className="min-w-0 flex-[2_1_320px] lg:sticky lg:top-6">
                    <ProfilePreview
                        draft={draft}
                        userName={userName}
                        photo={photo}
                        rating={rating}
                        disciplines={disciplines}
                        cities={cities}
                        checks={profileChecks(draft, photo, gallery.length)}
                        status={status}
                        changed={changed}
                        canSave={changed && complete}
                        saving={form.processing}
                    />
                </aside>
            </form>
            <ConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title="Salvare le modifiche?"
                description="Saranno visibili subito sul tuo profilo pubblico."
                confirmLabel="Salva"
                onConfirm={save}
            />
        </>
    );
}
