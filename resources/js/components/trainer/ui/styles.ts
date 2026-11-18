/*
 * The classes of the new trainer area (docs: the "Design" canvas): black
 * ground, cards #1c1c1c, panels #141414 with a thin border, turquoise for
 * what matters. They work inside .theme-dark (trainer-layout.tsx).
 */

/** The glass of the side menu and of the tab bar. */
export const glassClassName =
    'border border-white/10 bg-[rgba(28,28,28,0.62)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_8px_32px_-8px_rgba(0,0,0,0.7)] backdrop-blur-[24px] backdrop-saturate-[1.8]';

/** A big panel of the desktop pages: "Statistiche", the list of the clients. */
export const panelClassName =
    'rounded-[30px] border border-border bg-[#141414]';

/** A card on the black: a request, a session, a package. */
export const cardClassName = 'rounded-[22px] bg-card';

/** A card with the thin outline of the phone pages. */
export const outlineCardClassName =
    'rounded-[26px] bg-[#121212] shadow-[inset_0_0_0_1px_#2c2c2c]';

/**
 * The turquoise button, as "Continua" of "Diventa trainer": the page behind,
 * turquoise outline and text. "Apri scheda", "Aggiungi cliente", "Copia link".
 */
export const brandButtonClassName =
    'btn-brand h-11 px-5 text-[15px] disabled:pointer-events-none disabled:opacity-60';

/**
 * Filled turquoise: only the final action of a page or a card, as "Invia
 * per approvazione". "Accetta", "Salva modifiche", "Salva nota".
 */
export const brandFilledButtonClassName =
    'inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[15px] font-semibold text-[#0a0a0a] shadow-[0_8px_24px_0_rgba(66,215,217,0.28)] outline-none transition-colors hover:bg-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60';

/** The grey outline button: "Rifiuta", "Aggiungi nota". */
export const outlineButtonClassName =
    'inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#707070] bg-transparent px-4 text-[15px] font-semibold text-foreground outline-none transition-colors hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60';

/** The quiet button: "Oggi", "Annulla". The page behind, a grey outline. */
export const softButtonClassName =
    'inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-transparent px-4 text-[15px] font-semibold text-foreground shadow-[inset_0_0_0_1px_var(--field)] outline-none transition-colors hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60';

/** A tab or a segment ("Sedute · Dati · Note", "Scheda · Chat"): turquoise outline when chosen. */
export const segmentClassName =
    'rounded-full text-[15px] font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:text-brand aria-pressed:shadow-[inset_0_0_0_1.5px_var(--brand)] aria-selected:text-brand aria-selected:shadow-[inset_0_0_0_1.5px_var(--brand)]';

/** A round icon button with the grey outline (44px). */
export const roundOutlineClassName =
    'inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[#707070] bg-transparent text-foreground outline-none transition-colors hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60';

/** A round icon button on a dark fill (40px): the arrows. */
export const roundSoftClassName =
    'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40';

/** The small grey title over a list: "IN PROGRAMMA", "ATTIVITÀ". */
export const listLabelClassName =
    'px-2.5 text-xs leading-4 font-semibold tracking-[0.4px] text-muted-foreground uppercase';

/** The title of a block: "Da confermare", "Statistiche". */
export const blockTitleClassName = 'text-[22px] leading-7 font-bold';

/** The title of a page: "Clienti", "Calendario". */
export const pageTitleClassName =
    'text-[28px] leading-8.5 font-bold tracking-[0.38px]';

/** A chip of the filters: grey outline, turquoise when chosen (aria-pressed). */
export const filterChipClassName =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#3a3a3a] bg-transparent px-3 text-[13px] font-semibold whitespace-nowrap text-[#d4d4d4] outline-none transition-colors hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:border-brand aria-pressed:text-brand';

/** A row that lights up under the mouse. */
export const pressableRowClassName =
    'transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [@media(hover:hover)]:hover:bg-white/5';

/**
 * A list as in "Diventa trainer": a dark card on phones, rows split by thin
 * lines on the page on desktop. The rows take `stepRowClassName`.
 */
export const stepListClassName =
    'flex flex-col rounded-[26px] bg-card px-4 md:rounded-none md:bg-transparent md:px-0';

export const stepRowClassName =
    'border-b border-separator py-4 last:border-b-0 md:border-border';

/** A box as in "Diventa trainer": a dark card on phones, a thin outline on desktop. */
export const stepBoxClassName =
    'rounded-[26px] bg-card p-4 md:rounded-[20px] md:bg-transparent md:p-5 md:shadow-[inset_0_0_0_1px_var(--border)]';
