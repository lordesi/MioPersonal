import { Plus, Trash2 } from 'lucide-react';
import FormField from '@/components/auth/form-field';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import { serviceMinuteOptions } from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

type Service = TrainerDraft['services'][number];

/** Step 4: at least one service, with duration and indicative price. */
export default function StepServices({ draft, update }: StepProps) {
    const change = (index: number, changes: Partial<Service>) =>
        update({
            services: draft.services.map((service, i) =>
                i === index ? { ...service, ...changes } : service,
            ),
        });

    return (
        <>
            <StepTitle
                title="Servizi e prezzi"
                description="Almeno un servizio. I prezzi sono indicativi: il pagamento lo concordi tu con il cliente."
            />

            <div className="flex flex-col gap-3">
                {draft.services.map((service, index) => (
                    <div
                        key={index}
                        className="grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[1.6fr_1fr_0.8fr_auto]"
                    >
                        <FormField label="Nome del servizio">
                            {({ id }) => (
                                <Input
                                    id={id}
                                    value={service.name}
                                    onChange={(event) =>
                                        change(index, {
                                            name: event.target.value,
                                        })
                                    }
                                />
                            )}
                        </FormField>
                        <FormField label="Durata">
                            {({ id }) => (
                                <Select
                                    value={String(service.minutes)}
                                    onValueChange={(minutes) =>
                                        change(index, {
                                            minutes: Number(minutes),
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id={id}
                                        className="w-full tabular-nums"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceMinuteOptions.map((minutes) => (
                                            <SelectItem
                                                key={minutes}
                                                value={String(minutes)}
                                            >
                                                {minutes} min
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </FormField>
                        <FormField label="Prezzo (€)">
                            {({ id }) => (
                                <Input
                                    id={id}
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    step={1}
                                    className="tabular-nums"
                                    // Euros on screen, whole cents in the draft.
                                    value={
                                        service.priceCents === null
                                            ? ''
                                            : service.priceCents / 100
                                    }
                                    onChange={(event) =>
                                        change(index, {
                                            priceCents:
                                                event.target.value === ''
                                                    ? null
                                                    : Math.round(
                                                          Number(
                                                              event.target
                                                                  .value,
                                                          ) * 100,
                                                      ),
                                        })
                                    }
                                />
                            )}
                        </FormField>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Rimuovi ${service.name || 'servizio'}`}
                            disabled={draft.services.length === 1}
                            onClick={() =>
                                update({
                                    services: draft.services.filter(
                                        (_, i) => i !== index,
                                    ),
                                })
                            }
                        >
                            <Trash2 />
                        </Button>
                    </div>
                ))}

                <Button
                    type="button"
                    variant="outline"
                    className="self-start"
                    onClick={() =>
                        update({
                            services: [
                                ...draft.services,
                                {
                                    name: 'Nuovo servizio',
                                    minutes: 60,
                                    priceCents: null,
                                },
                            ],
                        })
                    }
                >
                    <Plus aria-hidden="true" />
                    Aggiungi un servizio
                </Button>
            </div>
        </>
    );
}
