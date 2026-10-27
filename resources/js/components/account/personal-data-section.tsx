import { Form } from '@inertiajs/react';
import { UserRound } from 'lucide-react';
import AccountSettingsController from '@/actions/App/Http/Controllers/AccountSettingsController';
import SectionFooter from '@/components/account/section-footer';
import SettingsSection from '@/components/account/settings-section';
import { PhoneFields } from '@/components/auth/account-fields';
import FormField from '@/components/auth/form-field';
import { Input } from '@/components/ui/input';

type PersonalDataSectionProps = {
    firstName: string;
    lastName: string;
    phone: string | null;
    /** Who sees these data, when the page needs to say it. */
    description?: string;
    /** Who sees the phone, when the page needs to say it. */
    phoneHint?: string;
};

/** Name, surname and phone, all required, saved on the server. */
export default function PersonalDataSection({
    firstName,
    lastName,
    phone,
    description,
    phoneHint,
}: PersonalDataSectionProps) {
    return (
        <SettingsSection
            id="dati"
            title="Dati personali"
            icon={UserRound}
            description={description}
        >
            <Form
                {...AccountSettingsController.updatePersonal.form()}
                options={{ preserveScroll: true }}
                // After saving, the new values are the starting ones: the button goes grey.
                setDefaultsOnSuccess
                className="flex flex-col gap-4.5"
            >
                {({ errors, processing, isDirty }) => (
                    <>
                        <div className="grid gap-3.5 sm:grid-cols-2">
                            <FormField label="Nome" error={errors.first_name}>
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        name="first_name"
                                        defaultValue={firstName}
                                        required
                                        autoComplete="given-name"
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.first_name}
                                        className="h-12 rounded-xl text-[15px] md:text-[15px]"
                                    />
                                )}
                            </FormField>
                            <FormField label="Cognome" error={errors.last_name}>
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        name="last_name"
                                        defaultValue={lastName}
                                        required
                                        autoComplete="family-name"
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.last_name}
                                        className="h-12 rounded-xl text-[15px] md:text-[15px]"
                                    />
                                )}
                            </FormField>
                        </div>
                        <div className="max-w-115">
                            <PhoneFields
                                errors={errors}
                                hint={phoneHint}
                                defaultPhone={phone ?? ''}
                            />
                        </div>
                        <SectionFooter
                            dirty={isDirty}
                            processing={processing}
                        />
                    </>
                )}
            </Form>
        </SettingsSection>
    );
}
