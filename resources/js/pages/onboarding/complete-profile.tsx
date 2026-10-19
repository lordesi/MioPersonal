import { Head, Link, useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';
import type { FormEvent } from 'react';
import PreferencesFields, {
    preferencesFormData,
} from '@/components/client/preferences-fields';
import type { SavedPreferences } from '@/components/client/preferences-fields';
import MinimalHeader from '@/components/layout/minimal-header';
import ProgressBar from '@/components/shared/progress-bar';
import { Button } from '@/components/ui/button';
import { home as clientHome } from '@/routes/client';
import { update } from '@/routes/client/complete-profile';
import type { CatalogOption, CityWithCoordinates } from '@/types';

type CompleteProfileProps = {
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityWithCoordinates[];
    /** Null until the client saves the page once. */
    preferences: SavedPreferences | null;
};

/**
 * Optional page right after the client sign-up; later the same answers are
 * changed from "Modifica il mio profilo" (pages/client/edit-profile.tsx).
 * Saved in `client_preferences`; the photo is saved as soon as it is chosen.
 */
export default function CompleteProfile({
    disciplines,
    cities,
    preferences,
}: CompleteProfileProps) {
    const form = useForm(preferencesFormData(preferences));
    const { data, setData } = form;

    // Account and name count as already done, as in the design.
    const filled =
        2 +
        Number(data.goal !== null) +
        Number(data.disciplines.length > 0) +
        Number(data.times.length > 0) +
        Number(data.budget_max_cents !== null) +
        Number(data.city !== null);
    const percent = Math.round((filled / 7) * 100);

    const save = (event: FormEvent) => {
        event.preventDefault();
        form.put(update.url());
    };

    // Only possible if someone changes the page by hand: one line is enough.
    const firstError = Object.values(form.errors)[0];

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Completa il tuo profilo" />

            <MinimalHeader logoLinksHome={false}>
                <Link
                    href={clientHome()}
                    className="font-medium text-foreground"
                >
                    Salta per ora
                </Link>
            </MinimalHeader>

            <form
                onSubmit={save}
                className="mx-auto flex w-full max-w-190 flex-col gap-5 px-4 pt-5 pb-10 md:px-8 md:pt-10 md:pb-16"
            >
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm tabular-nums">
                            <span className="font-medium">
                                Profilo completo al {percent}%
                            </span>
                            <span className="text-muted-foreground">
                                Facoltativo
                            </span>
                        </div>
                        <ProgressBar
                            value={percent}
                            label="Completamento del profilo"
                        />
                    </div>
                    <span className="inline-flex h-6.5 items-center gap-1.5 self-start rounded-full bg-primary px-2.5 text-xs font-semibold text-primary-foreground">
                        <Check aria-hidden="true" className="size-3.5" />
                        Account creato
                    </span>
                    <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-4xl">
                        Completa il tuo profilo
                    </h1>
                    <p className="text-muted-foreground">
                        Un minuto in più ci aiuta a suggerirti i trainer e gli
                        orari giusti.
                    </p>
                </div>

                <PreferencesFields
                    data={data}
                    setData={setData}
                    disciplines={disciplines}
                    cities={cities}
                />

                {firstError && (
                    <p role="alert" className="text-sm text-destructive">
                        {firstError}
                    </p>
                )}

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="h-12 flex-[1_1_220px] text-base font-semibold"
                    >
                        Salva e continua
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-12 flex-[1_1_220px] text-base"
                    >
                        <Link href={clientHome()}>Salta per ora</Link>
                    </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                    Puoi completare o cambiare tutto quando vuoi da «Modifica
                    profilo». Non ti chiediamo dati sulla salute.
                </p>
            </form>
        </div>
    );
}
