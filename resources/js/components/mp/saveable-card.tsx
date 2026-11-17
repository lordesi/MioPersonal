import ProfileCard from '@/components/mp/profile-card';
import type { ProfileCardProps } from '@/components/mp/profile-card';
import { useFavorite } from '@/hooks/use-favorite';
import type { FavoriteKind } from '@/hooks/use-favorite';

type SaveableCardProps = Omit<ProfileCardProps, 'favorite'> & {
    /** The trainer or gym to save. */
    slug: string;
    favoriteKind: FavoriteKind;
    /** Saved by the logged-in client, from the server. */
    saved?: boolean;
};

/** A ProfileCard with the heart: guests go to the login, trainers and gyms don't see it. */
export default function SaveableCard({
    slug,
    favoriteKind,
    saved = false,
    ...card
}: SaveableCardProps) {
    const favorite = useFavorite(slug, saved, favoriteKind);

    return (
        <ProfileCard
            {...card}
            favorite={
                favorite.canSave
                    ? {
                          pressed: favorite.pressed,
                          onPressedChange: favorite.change,
                      }
                    : undefined
            }
        />
    );
}
