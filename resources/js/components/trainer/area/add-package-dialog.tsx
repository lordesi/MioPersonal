import { router } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import {
    BottomSheet,
    FloatingPanel,
    PanelHeader,
} from '@/components/trainer/session/panel-shell';
import type { PopoverAnchor } from '@/components/trainer/session/panel-shell';
import {
    ClientSection,
    ErrorText,
    PanelFooter,
    Pill,
    SectionLabel,
    TextField,
    durationLabel,
    focusRing,
    inputClassName,
} from '@/components/trainer/session/session-form-parts';
import {
    CLIENT_ERROR_KEYS,
    clientError,
    useClientPicker,
} from '@/components/trainer/session/use-client-picker';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { store } from '@/routes/trainer/packages';
import type { SessionOptions } from '@/types';

/** The most sessions in one package (TrainerPackageController::MAX_SESSIONS). */
const MAX_SESSIONS = 100;

/** DURATA DI OGNI SEDUTA: as in "Aggiungi seduta". */
const LENGTHS = [30, 45, 60, 90];

type Errors = Partial<Record<string, string>>;

/** "120" or "120,50" → 12050 cents; NaN when it isn't a price. */
function priceCents(value: string): number {
    const text = value.trim().replace(/\s|€/g, '').replace(',', '.');

    return /^\d+(\.\d{1,2})?$/.test(text)
        ? Math.round(Number(text) * 100)
        : Number.NaN;
}

/** 12050 → "120,50"; 12000 → "120". */
function priceText(cents: number): string {
    return cents % 100 === 0
        ? String(cents / 100)
        : (cents / 100).toFixed(2).replace('.', ',');
}

/**
 * "Aggiungi pacchetto" of "Pacchetti attivi" (TrainerPackageController),
 * made as "Aggiungi seduta": a sheet on phones, a popover on desktop. The
 * client (of the list or new), one of the packages of "Servizi e prezzi"
 * or one written by hand, the sessions included, the price and how long
 * each session lasts. Then "Aggiungi seduta" uses it up.
 */
export default function AddPackageDialog({
    open,
    onOpenChange,
    options,
    anchor = null,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    options: SessionOptions;
    anchor?: PopoverAnchor | null;
}) {
    return open ? (
        <PackageForm
            options={options}
            anchor={anchor}
            onClose={() => onOpenChange(false)}
        />
    ) : null;
}

function PackageForm({
    options,
    anchor,
    onClose,
}: {
    options: SessionOptions;
    anchor: PopoverAnchor | null;
    onClose: () => void;
}) {
    const isMobile = useIsMobile();
    const templates = options.packages;
    const first = templates[0];
    const client = useClientPicker(options.clients);
    const [serviceId, setServiceId] = useState<number | null>(
        first?.id ?? null,
    );
    const [name, setName] = useState(first?.name ?? '');
    const [sessions, setSessions] = useState(first?.sessions ?? 10);
    const [price, setPrice] = useState(
        first ? priceText(first.priceCents) : '',
    );
    const [minutes, setMinutes] = useState(first?.minutes ?? 60);
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);
    const priceId = useId();

    const choose = (id: number | null) => {
        setServiceId(id);
        const template = templates.find((item) => item.id === id);

        if (template) {
            setName(template.name);
            setSessions(template.sessions);
            setPrice(priceText(template.priceCents));
            setMinutes(template.minutes);
        }
    };

    const save = () =>
        router.post(
            store.url(),
            {
                ...client.fields,
                service_id: serviceId,
                name: name.trim(),
                sessions,
                price_cents: price.trim() === '' ? 0 : priceCents(price),
                minutes,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: setErrors,
                onSuccess: onClose,
            },
        );

    const fieldKeys = [
        ...CLIENT_ERROR_KEYS,
        'service_id',
        'name',
        'sessions',
        'price_cents',
        'minutes',
    ];
    const otherErrors = Object.entries(errors)
        .filter(([key]) => !fieldKeys.includes(key))
        .map(([, message]) => message ?? '')
        .filter(Boolean);

    const content = (
        <>
            <PanelHeader
                title="Nuovo pacchetto"
                subtitle={
                    isMobile
                        ? undefined
                        : 'Scegli il cliente e quante sedute include'
                }
            />
            <ClientSection form={client} error={clientError(errors)} />

            {templates.length > 0 && (
                <Section label="PACCHETTO">
                    <div className="flex flex-wrap gap-1.5">
                        {templates.map((template) => (
                            <Pill
                                key={template.id}
                                on={serviceId === template.id}
                                onClick={() => choose(template.id)}
                            >
                                {template.name}
                            </Pill>
                        ))}
                        <Pill
                            on={serviceId === null}
                            onClick={() => choose(null)}
                        >
                            Personalizzato
                        </Pill>
                    </div>
                    <ErrorText>{errors.service_id}</ErrorText>
                </Section>
            )}

            <div className="flex flex-col gap-2">
                <TextField
                    label="Nome del pacchetto"
                    placeholder="Es. Pacchetto 10 sedute"
                    value={name}
                    onChange={setName}
                />
                <ErrorText>{errors.name}</ErrorText>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                <Section label="SEDUTE INCLUSE">
                    <div className="flex h-14 items-center justify-between rounded-[14px] bg-[#1C1E21] px-1.5">
                        <StepButton
                            label="Una seduta in meno"
                            disabled={sessions <= 1}
                            onClick={() => setSessions(sessions - 1)}
                        >
                            <Minus aria-hidden="true" className="size-4.5" />
                        </StepButton>
                        <output
                            aria-live="polite"
                            className="text-[22px] font-bold tabular-nums"
                        >
                            {sessions}
                        </output>
                        <StepButton
                            label="Una seduta in più"
                            disabled={sessions >= MAX_SESSIONS}
                            onClick={() => setSessions(sessions + 1)}
                        >
                            <Plus aria-hidden="true" className="size-4.5" />
                        </StepButton>
                    </div>
                    <ErrorText>{errors.sessions}</ErrorText>
                </Section>
                <div className="flex flex-col gap-2.5">
                    <label htmlFor={priceId} className="flex">
                        <SectionLabel>PREZZO</SectionLabel>
                    </label>
                    <div className="relative flex items-center">
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-4 text-[17px] text-muted-foreground"
                        >
                            €
                        </span>
                        <input
                            id={priceId}
                            inputMode="decimal"
                            placeholder="0"
                            value={price}
                            onChange={(event) => setPrice(event.target.value)}
                            className={cn(inputClassName, 'pl-9 tabular-nums')}
                        />
                    </div>
                    <ErrorText>{errors.price_cents}</ErrorText>
                </div>
            </div>

            <Section label="DURATA DI OGNI SEDUTA">
                <div className="flex flex-wrap gap-1.5">
                    {(LENGTHS.includes(minutes)
                        ? LENGTHS
                        : [...LENGTHS, minutes].sort((a, b) => a - b)
                    ).map((length) => (
                        <Pill
                            key={length}
                            on={minutes === length}
                            onClick={() => setMinutes(length)}
                        >
                            {durationLabel(length)}
                        </Pill>
                    ))}
                </div>
                <ErrorText>{errors.minutes}</ErrorText>
            </Section>

            <PanelFooter
                onCancel={onClose}
                onConfirm={save}
                label="Aggiungi pacchetto"
                processing={processing}
                errors={otherErrors}
            />
        </>
    );

    const onOpenChange = (next: boolean) => !next && onClose();

    return isMobile ? (
        <BottomSheet open onOpenChange={onOpenChange} label="Nuovo pacchetto">
            {content}
        </BottomSheet>
    ) : (
        <FloatingPanel
            open
            onOpenChange={onOpenChange}
            anchor={anchor}
            label="Nuovo pacchetto"
        >
            {content}
        </FloatingPanel>
    );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2.5">
            <SectionLabel>{label}</SectionLabel>
            {children}
        </div>
    );
}

function StepButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-foreground hover:bg-white/5 disabled:cursor-default disabled:opacity-35',
                focusRing,
            )}
        >
            {children}
        </button>
    );
}
