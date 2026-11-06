import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import Panel from '@/components/trainer/area/panel';
import PageHeading from '@/components/trainer/area/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice, formatUntilDay } from '@/lib/format';
import { destroy, store, update } from '@/routes/gym/promotions';
import type { CatalogOption } from '@/types';

type Promotion = {
    id: number;
    title: string;
    description: string;
    planId: number | null;
    planName: string | null;
    promoPriceCents: number | null;
    discountPercent: number | null;
    startsOn: string | null;
    endsOn: string | null;
    state: 'active' | 'upcoming' | 'expired';
};

type GymPromotionsProps = {
    promotions: Promotion[];
    plans: CatalogOption[];
    maxActive: number;
    /** Today in Rome, "YYYY-MM-DD". */
    today: string;
};

const states = {
    active: { label: 'Attiva', variant: 'default' },
    upcoming: { label: 'Programmata', variant: 'secondary' },
    expired: { label: 'Scaduta', variant: 'outline' },
} as const;

const NO_PLAN = 'none';

/** "Promozioni": public between their dates, at most a few at once. */
export default function GymPromotions({
    promotions,
    plans,
    maxActive,
    today,
}: GymPromotionsProps) {
    const [editing, setEditing] = useState<Promotion | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Promotion | null>(null);
    const form = useForm({
        title: '',
        description: '',
        gym_plan_id: null as number | null,
        kind: 'percent' as 'price' | 'percent',
        promo_price_cents: null as number | null,
        discount_percent: null as number | null,
        starts_on: today as string | null,
        ends_on: null as string | null,
    });
    const [price, setPrice] = useState('');

    const open = (promotion: Promotion | 'new') => {
        form.clearErrors();

        if (promotion === 'new') {
            form.setData({
                title: '',
                description: '',
                gym_plan_id: null,
                kind: 'percent',
                promo_price_cents: null,
                discount_percent: null,
                starts_on: today,
                ends_on: null,
            });
            setPrice('');
        } else {
            form.setData({
                title: promotion.title,
                description: promotion.description,
                gym_plan_id: promotion.planId,
                kind: promotion.promoPriceCents !== null ? 'price' : 'percent',
                promo_price_cents: promotion.promoPriceCents,
                discount_percent: promotion.discountPercent,
                starts_on: promotion.startsOn,
                ends_on: promotion.endsOn,
            });
            setPrice(
                promotion.promoPriceCents === null
                    ? ''
                    : (promotion.promoPriceCents / 100)
                          .toString()
                          .replace('.', ','),
            );
        }

        setEditing(promotion);
    };

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        };

        if (editing === 'new') {
            form.post(store.url(), options);
        } else if (editing) {
            form.patch(update.url(editing.id), options);
        }
    };

    const active = promotions.filter((item) => item.state === 'active').length;

    return (
        <>
            <Head title="Promozioni" />

            <PageHeading
                title="Promozioni"
                description={`Compaiono nel profilo e nella ricerca solo tra le date scelte. Attive: ${active} di ${maxActive}.`}
                action={
                    <Button type="button" onClick={() => open('new')}>
                        <Plus aria-hidden="true" />
                        Nuova promozione
                    </Button>
                }
            />

            {promotions.length === 0 ? (
                <Panel>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag aria-hidden="true" className="size-4" />
                        Nessuna promozione. Es. “Iscrizione gratuita a
                        settembre” o “-20% sull’annuale”.
                    </p>
                </Panel>
            ) : (
                <ul className="flex flex-col gap-3">
                    {promotions.map((promotion) => (
                        <li key={promotion.id}>
                            <Panel
                                title={promotion.title}
                                action={
                                    <div className="flex items-center gap-1">
                                        <Badge
                                            variant={
                                                states[promotion.state].variant
                                            }
                                        >
                                            {states[promotion.state].label}
                                        </Badge>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Modifica ${promotion.title}`}
                                            onClick={() => open(promotion)}
                                        >
                                            <Pencil aria-hidden="true" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Elimina ${promotion.title}`}
                                            onClick={() =>
                                                setDeleting(promotion)
                                            }
                                        >
                                            <Trash2 aria-hidden="true" />
                                        </Button>
                                    </div>
                                }
                            >
                                {promotion.description && (
                                    <p className="text-sm">
                                        {promotion.description}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    {[
                                        promotion.promoPriceCents !== null
                                            ? formatPrice(
                                                  promotion.promoPriceCents,
                                              )
                                            : `-${promotion.discountPercent}%`,
                                        promotion.planName &&
                                            `su ${promotion.planName}`,
                                        promotion.endsOn
                                            ? `fino ${formatUntilDay(promotion.endsOn)}`
                                            : 'senza scadenza',
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                            </Panel>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog
                open={editing !== null}
                onOpenChange={(isOpen) => !isOpen && setEditing(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editing === 'new'
                                ? 'Nuova promozione'
                                : 'Modifica promozione'}
                        </DialogTitle>
                        <DialogDescription>
                            Un prezzo scontato o una percentuale, anche su un
                            abbonamento.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        id="promotion-form"
                        noValidate
                        className="flex flex-col gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submit();
                        }}
                    >
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="promo-title">Titolo</Label>
                            <Input
                                id="promo-title"
                                value={form.data.title}
                                maxLength={100}
                                placeholder="Es. Iscrizione gratuita"
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="promo-description">
                                Descrizione (facoltativa)
                            </Label>
                            <Textarea
                                id="promo-description"
                                rows={3}
                                maxLength={500}
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="promo-plan">Abbonamento</Label>
                            <Select
                                value={
                                    form.data.gym_plan_id === null
                                        ? NO_PLAN
                                        : String(form.data.gym_plan_id)
                                }
                                onValueChange={(value) =>
                                    form.setData(
                                        'gym_plan_id',
                                        value === NO_PLAN
                                            ? null
                                            : Number(value),
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="promo-plan"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_PLAN}>
                                        Nessuno in particolare
                                    </SelectItem>
                                    {plans.map((plan) => (
                                        <SelectItem
                                            key={plan.value}
                                            value={plan.value}
                                        >
                                            {plan.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.gym_plan_id} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="promo-kind">Tipo</Label>
                                <Select
                                    value={form.data.kind}
                                    onValueChange={(kind) =>
                                        form.setData(
                                            'kind',
                                            kind as 'price' | 'percent',
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="promo-kind"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percent">
                                            Sconto %
                                        </SelectItem>
                                        <SelectItem value="price">
                                            Prezzo promo
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {form.data.kind === 'percent' ? (
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="promo-percent">
                                        Sconto (%)
                                    </Label>
                                    <Input
                                        id="promo-percent"
                                        type="number"
                                        min={1}
                                        max={90}
                                        value={form.data.discount_percent ?? ''}
                                        onChange={(event) =>
                                            form.setData(
                                                'discount_percent',
                                                Number(event.target.value) ||
                                                    null,
                                            )
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="promo-price">
                                        Prezzo (€)
                                    </Label>
                                    <Input
                                        id="promo-price"
                                        inputMode="decimal"
                                        value={price}
                                        onChange={(event) => {
                                            const text =
                                                event.target.value.replace(
                                                    /[^\d,.]/g,
                                                    '',
                                                );
                                            setPrice(text);
                                            form.setData(
                                                'promo_price_cents',
                                                text === ''
                                                    ? null
                                                    : Math.round(
                                                          Number(
                                                              text.replace(
                                                                  ',',
                                                                  '.',
                                                              ),
                                                          ) * 100,
                                                      ),
                                            );
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        <InputError
                            message={
                                form.errors.discount_percent ??
                                form.errors.promo_price_cents ??
                                form.errors.kind
                            }
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="promo-start">Dal</Label>
                                <Input
                                    id="promo-start"
                                    type="date"
                                    value={form.data.starts_on ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'starts_on',
                                            event.target.value || null,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="promo-end">
                                    Al (facoltativo)
                                </Label>
                                <Input
                                    id="promo-end"
                                    type="date"
                                    min={form.data.starts_on ?? today}
                                    value={form.data.ends_on ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'ends_on',
                                            event.target.value || null,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <InputError
                            message={
                                form.errors.starts_on ?? form.errors.ends_on
                            }
                        />
                    </form>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditing(null)}
                        >
                            Annulla
                        </Button>
                        <Button
                            type="submit"
                            form="promotion-form"
                            disabled={
                                form.processing || form.data.title.trim() === ''
                            }
                        >
                            {form.processing && <Spinner />}
                            Salva
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(isOpen) => !isOpen && setDeleting(null)}
                title="Eliminare la promozione?"
                description={deleting?.title ?? ''}
                confirmLabel="Elimina"
                onConfirm={() => {
                    if (deleting) {
                        router.delete(destroy.url(deleting.id), {
                            preserveScroll: true,
                            onFinish: () => setDeleting(null),
                        });
                    }
                }}
            />
        </>
    );
}

GymPromotions.layout = { section: 'promotions' };
