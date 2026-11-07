/** App\Enums\SocialProvider: the order is the one of the icons. */
export type SocialProvider = 'instagram' | 'tiktok' | 'facebook' | 'youtube';

/** A social shown on the profile: username without "@" and its page. */
export type SocialLink = {
    provider: SocialProvider;
    handle: string;
    url: string;
};

/** `socials` of "Diventa trainer" and "Modifica profilo" (App\Support\TrainerSocials::props). */
export type TrainerSocialsProps = {
    /** The socials that can be linked now (with app credentials). */
    providers: { provider: SocialProvider; label: string }[];
    linked: SocialLink[];
};
