import { Link } from '@inertiajs/react';
import { Building2, ChevronRight } from 'lucide-react';
import ProfileSection from '@/components/profile/profile-section';
import type { TrainerGym } from '@/types';

/** "Palestre dove allena": the gyms of MioPersonal that accepted the trainer. */
export default function TrainerGyms({
    gyms,
    trainerFirstName,
}: {
    gyms: TrainerGym[];
    trainerFirstName: string;
}) {
    if (gyms.length === 0) {
        return null;
    }

    return (
        <ProfileSection
            titleId="gyms-title"
            title="Palestre dove allena"
            description={`Puoi allenarti con ${trainerFirstName} anche in queste palestre.`}
        >
            <ul className="flex flex-col gap-2.5">
                {gyms.map((gym) => (
                    <li key={gym.slug}>
                        <Link
                            href={gym.href}
                            className="flex items-center gap-3.5 rounded-2xl border p-3 hover:bg-accent"
                        >
                            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
                                {gym.coverUrl ? (
                                    <img
                                        src={gym.coverUrl}
                                        alt=""
                                        loading="lazy"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <Building2
                                        aria-hidden="true"
                                        className="size-6"
                                    />
                                )}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate font-semibold">
                                    {gym.name}
                                </span>
                                <span className="truncate text-sm text-muted-foreground">
                                    {gym.address}
                                </span>
                            </span>
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4.5 shrink-0 text-muted-foreground"
                            />
                        </Link>
                    </li>
                ))}
            </ul>
        </ProfileSection>
    );
}
