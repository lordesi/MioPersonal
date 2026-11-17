import { CalendarDays, ChevronRight, Layers } from 'lucide-react';
import { Chip } from '@/components/mp/filter-chips';
import { DumbbellIcon } from '@/components/mp/icons';
import ModalSheet, {
    ModalSheetBody,
    ModalSheetFooter,
} from '@/components/mp/modal-sheet';
import { Spinner } from '@/components/ui/spinner';
import type { TrainerBooking } from '@/hooks/use-trainer-booking';
import {
    perPersonLabel,
    servicePriceLabel,
    totalPriceCents,
    totalPriceLabel,
} from '@/lib/booking';
import { formatDuration, formatPrice, formatSlot } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerService, TrainingPlace } from '@/types';

/** "Pacchetto 10 sedute" or a bought package: the stacked icon. */
export const isPackage = (service: TrainerService) =>
    service.packageId !== null || (service.sessions ?? null) !== null;

/** Under the name: "Da 1 a 2 ore", "10 sedute da 1 ora · 31,50 € a seduta". */
export function serviceDescription(service: TrainerService): string {
    const sessions = service.sessions ?? null;

    if (sessions !== null && service.packageId === null) {
        const minutes = service.options[0]?.minutes ?? 60;

        return `${sessions} sedute da ${formatDuration(minutes)} · ${formatPrice(Math.round(service.priceCents / sessions))} a seduta`;
    }

    return (
        service.durationLabel.charAt(0).toUpperCase() +
        service.durationLabel.slice(1)
    );
}

/** "Dove" in a word: the gym's name, or what the place is. */
const placeLabel = (place: TrainingPlace) =>
    ({
        studio: 'In studio',
        gym: place.title,
        home: 'A domicilio',
        park: "All'aperto",
        online: 'Online',
    })[place.type];

/**
 * "Servizi" (designs "Servizi 1" / "Desktop · Servizi"): the service, the
 * day and time (it opens "Scegli data e ora"), where and how many people.
 */
export default function ServicesSheet({
    open,
    onOpenChange,
    services,
    booking,
    onChooseTime,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    services: TrainerService[];
    booking: TrainerBooking;
    /** Opens "Scegli data e ora" in place of this window. */
    onChooseTime: () => void;
}) {
    const { service, minutes, start, people } = booking;

    if (!service) {
        return null;
    }

    const slot = start ? formatSlot(start, minutes / 60) : null;

    return (
        <ModalSheet open={open} onOpenChange={onOpenChange} title="Servizi">
            <ModalSheetBody className="flex flex-col gap-5.5">
                <fieldset className="min-w-0">
                    <legend className="mb-2.5 text-[15px] font-semibold">
                        Servizio
                    </legend>
                    <div className="flex flex-col gap-2 md:gap-2.5">
                        {services.map((item) => (
                            <ServiceOption
                                key={item.id}
                                service={item}
                                selected={item.id === service.id}
                                onSelect={() => booking.changeService(item.id)}
                            />
                        ))}
                    </div>
                </fieldset>

                <fieldset className="min-w-0">
                    <legend className="mb-2.5 text-[15px] font-semibold">
                        Giorno e ora
                    </legend>
                    <button
                        type="button"
                        onClick={onChooseTime}
                        className="flex min-h-13 w-full items-center gap-3 rounded-[14px] px-4 text-left shadow-[inset_0_0_0_1px_var(--field)] outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 md:min-h-16 md:gap-3.5 md:rounded-[20px] md:px-4.5 md:shadow-[inset_0_0_0_1px_var(--border)]"
                    >
                        <span className="flex text-brand md:size-11 md:items-center md:justify-center md:rounded-[14px] md:shadow-[inset_0_0_0_1px_var(--brand)]">
                            <CalendarDays
                                aria-hidden="true"
                                className="size-5"
                            />
                        </span>
                        <span
                            className={cn(
                                'min-w-0 flex-1 truncate text-[17px] tabular-nums',
                                !slot && 'text-muted-foreground',
                            )}
                        >
                            {slot ?? 'Scegli data e ora'}
                        </span>
                        <ChevronRight
                            aria-hidden="true"
                            className="size-5 text-muted-foreground"
                        />
                    </button>
                </fieldset>

                {/* With one place the server copies it: nothing to choose. */}
                {booking.inPersonPlaces.length > 1 && (
                    <fieldset className="min-w-0">
                        <legend className="mb-2.5 text-[15px] font-semibold">
                            Dove
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {booking.inPersonPlaces.map((place) => (
                                <Chip
                                    key={place.id}
                                    pressed={booking.placeId === place.id}
                                    onClick={() =>
                                        booking.setPlaceId(
                                            booking.placeId === place.id
                                                ? null
                                                : place.id,
                                        )
                                    }
                                >
                                    {placeLabel(place)}
                                </Chip>
                            ))}
                        </div>
                    </fieldset>
                )}

                {booking.peopleMax > 1 && (
                    <fieldset className="min-w-0">
                        <legend className="mb-2.5 text-[15px] font-semibold">
                            Quante persone?
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(
                                { length: booking.peopleMax },
                                (_, index) => index + 1,
                            ).map((count) => (
                                <Chip
                                    key={count}
                                    pressed={people === count}
                                    onClick={() => booking.setPeople(count)}
                                >
                                    {count === 1 ? 'Solo io' : count}
                                </Chip>
                            ))}
                        </div>
                        {people > 1 && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {perPersonLabel(
                                    totalPriceCents(service, minutes, people),
                                    people,
                                )}
                            </p>
                        )}
                    </fieldset>
                )}
            </ModalSheetBody>

            <ModalSheetFooter>
                <span className="hidden flex-col md:flex">
                    <span className="text-[13px] text-muted-foreground">
                        {service.name}
                    </span>
                    <span className="text-xl leading-6 font-bold tabular-nums">
                        {start || people > 1
                            ? totalPriceLabel(service, minutes, people)
                            : servicePriceLabel(service)}
                    </span>
                </span>
                {slot ? (
                    <button
                        type="button"
                        disabled={booking.booking}
                        onClick={booking.bookSlot}
                        className="btn-brand h-12.5 w-full text-[17px] md:w-auto md:min-w-60 md:px-6"
                    >
                        {booking.booking && <Spinner />}
                        Prenota · {slot}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onChooseTime}
                        className="btn-brand h-12.5 w-full text-[17px] md:w-60"
                    >
                        Scegli un orario
                    </button>
                )}
            </ModalSheetFooter>
        </ModalSheet>
    );
}

/** One service: icon, name and description, price, the round mark. */
function ServiceOption({
    service,
    selected,
    onSelect,
}: {
    service: TrainerService;
    selected: boolean;
    onSelect: () => void;
}) {
    const Icon = isPackage(service) ? Layers : DumbbellIcon;

    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            className={cn(
                'flex w-full items-center gap-3 rounded-[20px] bg-[#121212] px-4 py-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:min-h-19 md:gap-3.5 md:bg-transparent md:px-4.5',
                selected
                    ? 'shadow-[inset_0_0_0_1.5px_var(--brand)]'
                    : 'shadow-[inset_0_0_0_1px_var(--border)]',
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl md:size-11 md:rounded-[14px]',
                    selected
                        ? 'bg-brand-soft text-brand md:bg-transparent md:shadow-[inset_0_0_0_1px_var(--brand)]'
                        : 'bg-card md:bg-secondary',
                )}
            >
                <Icon className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[17px] font-semibold">
                        {service.name}
                    </span>
                    {service.mostBooked && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                            Il più prenotato
                        </span>
                    )}
                </span>
                <span className="text-[13px] text-muted-foreground md:text-sm">
                    {serviceDescription(service)}
                </span>
            </span>
            <span className="text-[15px] font-semibold whitespace-nowrap tabular-nums md:text-[17px]">
                {servicePriceLabel(service)}
            </span>
            <span
                aria-hidden="true"
                className={cn(
                    'size-5.5 shrink-0 rounded-full',
                    selected
                        ? 'border-[7px] border-brand'
                        : 'border-2 border-field',
                )}
            />
        </button>
    );
}
