import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    BottomSheet,
    FloatingPanel,
    PanelHeader,
} from '@/components/trainer/session/panel-shell';
import type { PopoverAnchor } from '@/components/trainer/session/panel-shell';
import {
    ErrorText,
    PanelFooter,
    TextField,
} from '@/components/trainer/session/session-form-parts';
import { useIsMobile } from '@/hooks/use-mobile';
import { add } from '@/routes/trainer/clients';

type Errors = Partial<Record<string, string>>;

/**
 * "Aggiungi cliente", the "+" of "Clienti" (TrainerClientRecordsController::add),
 * made as "Aggiungi seduta": a sheet on phones, a popover on desktop. The
 * name and the contacts; the card of the client opens after, with the
 * personal link to invite them.
 */
export default function AddClientDialog({
    open,
    onOpenChange,
    anchor = null,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    anchor?: PopoverAnchor | null;
}) {
    return open ? (
        <ClientForm anchor={anchor} onClose={() => onOpenChange(false)} />
    ) : null;
}

function ClientForm({
    anchor,
    onClose,
}: {
    anchor: PopoverAnchor | null;
    onClose: () => void;
}) {
    const isMobile = useIsMobile();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    const save = () =>
        router.post(
            add.url(),
            { name: name.trim(), phone, email },
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: setErrors,
                onSuccess: onClose,
            },
        );

    const content = (
        <>
            <PanelHeader
                title="Nuovo cliente"
                subtitle={
                    isMobile
                        ? undefined
                        : 'Il nome basta: i contatti servono per invitarlo'
                }
            />
            <div className="flex flex-col gap-2.5">
                <TextField
                    label="Nome e cognome"
                    placeholder="Es. Marta Colombo"
                    autoComplete="name"
                    value={name}
                    onChange={setName}
                />
                <ErrorText>{errors.name}</ErrorText>
                <div className="grid grid-cols-2 gap-2.5">
                    <TextField
                        label="Telefono"
                        placeholder="+39"
                        type="tel"
                        value={phone}
                        onChange={setPhone}
                    />
                    <TextField
                        label="Email"
                        placeholder="Facoltativa"
                        type="email"
                        value={email}
                        onChange={setEmail}
                    />
                </div>
                <ErrorText>{errors.phone ?? errors.email}</ErrorText>
            </div>
            <PanelFooter
                onCancel={onClose}
                onConfirm={save}
                label="Aggiungi cliente"
                processing={processing}
                disabled={name.trim() === ''}
            />
        </>
    );

    const onOpenChange = (next: boolean) => !next && onClose();

    return isMobile ? (
        <BottomSheet open onOpenChange={onOpenChange} label="Nuovo cliente">
            {content}
        </BottomSheet>
    ) : (
        <FloatingPanel
            open
            onOpenChange={onOpenChange}
            anchor={anchor}
            label="Nuovo cliente"
        >
            {content}
        </FloatingPanel>
    );
}
