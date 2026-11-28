import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import TrainerProfileEditController from '@/actions/App/Http/Controllers/TrainerProfileEditController';
import AccordionSection from '@/components/client/accordion-section';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    isCertificationValid,
    isProfileComplete,
    MAX_GOALS,
    needsCity,
    placeOptions,
    toProfilePayload,
} from '@/components/onboarding/trainer/draft';
import StepCertifications from '@/components/onboarding/trainer/step-certifications';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import StepPlaces from '@/components/onboarding/trainer/step-places';
import StepProfile, {
    usePhotoPreview,
} from '@/components/onboarding/trainer/step-profile';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import GalleryPhotos from '@/components/trainer/profile/gallery-photos';
import type { GalleryPhoto } from '@/components/trainer/profile/gallery-photos';
import ProfilePage, {
    SaveBar,
} from '@/components/trainer/profile-pages/profile-page';
import type { GymOption } from '@/components/onboarding/trainer/draft';
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
    /** "In palestra": the approved gyms of MioPersonal. */
    gyms: GymOption[];
    /** "Foto della galleria", saved one action at a time. */
    gallery: GalleryPhoto[];
    maxGalleryPhotos: number;
};

export default function Profile({
    draft,
    editable,
    disciplines,
    cities,
    gyms,
    gallery,
    maxGalleryPhotos,
}: ProfileProps) {
    return (
        <>
            <Head title="Modifica profilo" />

            <ProfilePage
                title="Modifica profilo"
                intro="Quello che vedono i clienti sul tuo profilo pubblico."
            >
                {draft === null ? (
                    <p className="text-[15px] text-muted-foreground">
                        Finché il profilo non è approvato lo modifichi dalla{' '}
                        <Link
                            href={register()}
                            className="font-semibold text-brand underline-offset-4 hover:underline"
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
                        gyms={gyms}
                        gallery={gallery}
                        maxGalleryPhotos={maxGalleryPhotos}
                    />
                )}
            </ProfilePage>
        </>
    );
}

/**
 * The sections of the design "Trainer · Modifica profilo" (steps 2, 3 and 6
 * of "Diventa trainer"), each with what is chosen under its title, then
 * "Salva modifiche". The fields are saved with one button, public right
 * away; the gallery photos are saved one action at a time. The services
 * are changed from "Servizi". Locked before the approval: everything is
 * shown, nothing can be changed.
 */
function ProfileForm({
    saved,
    locked,
    disciplines,
    cities,
    gyms,
    gallery,
    maxGalleryPhotos,
}: {
    saved: Omit<TrainerDraft, 'photo'>;
    locked: boolean;
    disciplines: CatalogOption[];
    cities: CityOption[];
    gyms: GymOption[];
    gallery: GalleryPhoto[];
    maxGalleryPhotos: number;
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
        (!draft.places.includes('gym') || draft.gyms.length > 0) &&
        (!draft.places.includes('studio') ||
            draft.studios.every(
                (studio) =>
                    studio.name.trim() !== '' && studio.address.trim() !== '',
            )) &&
        (!needsCity(draft) || draft.city !== '') &&
        draft.certifications.every(isCertificationValid);

    const errors = Object.values(form.errors as Record<string, string>);

    // What is chosen, under the title of each section.
    const labelOf = (
        options: { value: string; label: string }[],
        value: string,
    ) => options.find((option) => option.value === value)?.label ?? value;
    const disciplinesSummary = draft.disciplines
        .map((value) => labelOf(disciplines, value))
        .join(', ');
    const placesSummary = [
        draft.places.map((place) => labelOf(placeOptions, place)).join(', '),
        draft.city === '' ? '' : labelOf(cities, draft.city),
    ]
        .filter(Boolean)
        .join(' · ');
    const certifications = draft.certifications.length;

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

    let status: string | undefined;

    if (locked) {
        status = 'Prima di poter modificare il profilo, deve essere approvato.';
    } else if (form.hasErrors) {
        status = 'Controlla i campi segnati';
    } else if (changed) {
        status = complete
            ? 'Modifiche non salvate'
            : 'Completa i campi obbligatori per salvare';
    }

    return (
        <>
            <form
                noValidate
                onSubmit={askToSave}
                className="flex flex-col gap-7"
            >
                <StepErrors errors={errors} title="Da sistemare nel profilo:" />
                {/* Disabled: the browser turns off every field and button inside. */}
                <fieldset
                    disabled={locked}
                    className="flex min-w-0 flex-col border-t border-separator"
                >
                    <AccordionSection
                        title="Foto profilo"
                        summary={photo ? 'Caricata' : 'Nessuna foto'}
                        defaultOpen
                    >
                        <StepProfile
                            part="photo"
                            compact
                            draft={draft}
                            update={update}
                            name={userName}
                            photo={photo}
                        />
                    </AccordionSection>
                    <AccordionSection
                        title="Foto della galleria"
                        summary={
                            gallery.length === 0
                                ? 'Nessuna foto'
                                : `${gallery.length} di ${maxGalleryPhotos}`
                        }
                        defaultOpen
                    >
                        {/* Its buttons don't submit this form: each action is saved right away. */}
                        <GalleryPhotos
                            hideTitle
                            photos={gallery}
                            max={maxGalleryPhotos}
                        />
                    </AccordionSection>
                    <AccordionSection
                        title="Presentazione"
                        summary={
                            draft.headline.trim() || 'Titolo, bio ed esperienza'
                        }
                        defaultOpen
                    >
                        <StepProfile
                            part="about"
                            draft={draft}
                            update={update}
                            name={userName}
                            photo={photo}
                        />
                    </AccordionSection>
                    <AccordionSection
                        title="Discipline e obiettivi"
                        summary={disciplinesSummary || 'Nessuna disciplina'}
                        defaultOpen
                    >
                        <StepPlaces
                            part="disciplines"
                            draft={draft}
                            update={update}
                            disciplines={disciplines}
                            cities={cities}
                            gymOptions={gyms}
                        />
                    </AccordionSection>
                    <AccordionSection
                        title="Dove alleni"
                        summary={placesSummary || 'Nessun luogo'}
                        defaultOpen
                    >
                        <StepPlaces
                            part="places"
                            draft={draft}
                            update={update}
                            disciplines={disciplines}
                            cities={cities}
                            gymOptions={gyms}
                        />
                    </AccordionSection>
                    <AccordionSection
                        title="Certificazioni"
                        summary={
                            certifications === 0
                                ? 'Nessuna certificazione'
                                : certifications === 1
                                  ? '1 certificazione'
                                  : `${certifications} certificazioni`
                        }
                        defaultOpen
                    >
                        <StepCertifications
                            hideTitle
                            draft={draft}
                            update={update}
                        />
                    </AccordionSection>
                </fieldset>

                <SaveBar
                    status={status}
                    disabled={locked || !changed || !complete}
                    saving={form.processing}
                />
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

Profile.layout = { section: 'profile' };
