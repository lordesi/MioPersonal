import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import TrainerServicesController from '@/actions/App/Http/Controllers/TrainerServicesController';
import type { Pricing } from '@/components/onboarding/trainer/draft';
import {
    isPricingValid,
    toServicesPayload,
} from '@/components/onboarding/trainer/draft';
import ProfilePage, {
    SaveBar,
} from '@/components/trainer/profile-pages/profile-page';
import ServicesEditor from '@/components/trainer/services/services-editor';
import { register } from '@/routes/trainer';

type ServicesProps = {
    /** null until the registration is sent. */
    pricing: Pricing | null;
};

export default function Services({ pricing }: ServicesProps) {
    return (
        <>
            <Head title="Servizi e prezzi" />

            <ProfilePage title="Servizi e prezzi" className="max-w-170">
                {pricing === null ? (
                    <p className="text-[15px] text-muted-foreground">
                        Scegli i tuoi servizi nella{' '}
                        <Link
                            href={register()}
                            className="font-semibold text-brand underline-offset-4 hover:underline"
                        >
                            registrazione da trainer
                        </Link>
                        : poi potrai cambiarli da qui.
                    </p>
                ) : (
                    <ServicesForm saved={pricing} />
                )}
            </ProfilePage>
        </>
    );
}

/**
 * The kinds of session, their durations and prices and the extras, saved
 * with one button, public right away. Online costs as in person.
 */
function ServicesForm({ saved }: { saved: Pricing }) {
    const [pricing, setPricing] = useState(saved);
    const [changed, setChanged] = useState(false);
    // Only the request: the fields live in `pricing`.
    const form = useForm({});
    const complete = isPricingValid(pricing, false);
    const errors = Object.values(form.errors as Record<string, string>);

    const save = (event: React.FormEvent) => {
        event.preventDefault();

        if (!complete || form.processing) {
            return;
        }

        form.transform(() => toServicesPayload(pricing, false));
        form.put(TrainerServicesController.update.url(), {
            preserveScroll: true,
            // Start again from what was saved.
            onSuccess: (page) => {
                const next = (page.props as unknown as ServicesProps).pricing;

                if (next) {
                    setPricing(next);
                }

                setChanged(false);
            },
        });
    };

    return (
        <form noValidate onSubmit={save} className="flex flex-col gap-9">
            {errors.length > 0 && (
                <ul
                    role="alert"
                    className="flex flex-col gap-1 rounded-[20px] p-4 text-[15px] text-destructive shadow-[inset_0_0_0_1.5px_var(--destructive)]"
                >
                    {errors.map((message) => (
                        <li key={message}>{message}</li>
                    ))}
                </ul>
            )}

            <ServicesEditor
                pricing={pricing}
                onChange={(next) => {
                    setPricing(next);
                    setChanged(true);
                }}
            />

            <SaveBar
                start
                disabled={!changed || !complete}
                saving={form.processing}
            />
        </form>
    );
}

Services.layout = { section: 'services' };
