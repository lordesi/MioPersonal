import { Form } from '@inertiajs/react';
import AccountSettingsController from '@/actions/App/Http/Controllers/AccountSettingsController';
import SettingsSection from '@/components/account/settings-section';
import FormField from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PersonalDataSectionProps = {
    firstName: string;
    lastName: string;
};

/**
 * Name and surname, saved on the server.
 * TODO: add "Telefono" once the users table has a phone column (ask first).
 */
export default function PersonalDataSection({
    firstName,
    lastName,
}: PersonalDataSectionProps) {
    return (
        <SettingsSection
            id="dati"
            title="Dati personali"
            description="Il trainer li vede solo dopo aver confermato una prenotazione."
        >
            <Form
                {...AccountSettingsController.updatePersonal.form()}
                options={{ preserveScroll: true }}
                // "✓ Salvato" stays until the next change.
                setDefaultsOnSuccess
                className="flex flex-col gap-4"
            >
                {({ errors, processing, wasSuccessful, isDirty }) => (
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
                                        className="h-11 text-base md:text-base"
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
                                        className="h-11 text-base md:text-base"
                                    />
                                )}
                            </FormField>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-10 font-semibold"
                            >
                                Salva modifiche
                            </Button>
                            {wasSuccessful && !isDirty && (
                                <span role="status" className="text-sm">
                                    ✓ Salvato
                                </span>
                            )}
                        </div>
                    </>
                )}
            </Form>
        </SettingsSection>
    );
}
