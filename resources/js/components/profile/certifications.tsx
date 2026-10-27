import { Award } from 'lucide-react';
import ProfileSection from '@/components/profile/profile-section';
import type { TrainerProfile } from '@/types';

export default function Certifications({
    certifications,
}: {
    certifications: TrainerProfile['certifications'];
}) {
    return (
        <ProfileSection titleId="certifications-title" title="Certificazioni">
            <ul className="flex flex-col gap-3">
                {certifications.map((certification) => (
                    <li
                        key={certification.title}
                        className="flex items-start gap-3"
                    >
                        <span className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <Award aria-hidden="true" className="size-4.5" />
                        </span>
                        <span className="flex flex-col">
                            <span className="text-[15px] leading-[22px] font-semibold">
                                {certification.title}
                            </span>
                            <span className="text-[13px] leading-[18px] text-muted-foreground">
                                {certification.issuer}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </ProfileSection>
    );
}
