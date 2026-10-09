import type { ReactNode } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import StarRating from '@/components/trainer/star-rating';
import { cn } from '@/lib/utils';

type ReviewCardProps = {
    authorName: string;
    /** e.g. "Seduta singola · 2 giorni fa" */
    meta: string;
    rating: number;
    text: string;
    /** Trainer's public reply; label is "Risposta di Giulia:" or "La tua risposta:". */
    reply?: { label: string; text: string };
    /** Extra actions under the text, e.g. the trainer's "Rispondi" button. */
    children?: ReactNode;
    className?: string;
};

export default function ReviewCard({
    authorName,
    meta,
    rating,
    text,
    reply,
    children,
    className,
}: ReviewCardProps) {
    return (
        <article
            className={cn(
                'flex flex-col gap-2 rounded-xl border bg-card p-4 md:gap-2.5 md:p-5',
                className,
            )}
        >
            <div className="flex items-center gap-2.5 md:gap-3">
                <UserAvatar name={authorName} className="md:size-9" />
                <span className="flex flex-col">
                    <span className="text-sm font-semibold">{authorName}</span>
                    <span className="text-xs leading-4 text-muted-foreground">
                        {meta}
                    </span>
                </span>
                <StarRating value={rating} className="ml-auto" />
            </div>
            <p className="text-sm leading-[22px]">{text}</p>
            {reply && (
                <div className="rounded-r-lg border-l-3 border-foreground bg-muted px-3 py-2.5 text-[13px] leading-[19px]">
                    <strong className="font-semibold">{reply.label}</strong>{' '}
                    {reply.text}
                </div>
            )}
            {children}
        </article>
    );
}
