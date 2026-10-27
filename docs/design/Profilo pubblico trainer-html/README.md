# Profilo pubblico trainer · A · card prenotazione nera — design reference

This is a design mockup created in a visual design tool, exported as a
standalone page. Treat it as a REFERENCE MOCKUP, not production code:
the markup and inline styles carry the design's precise values — colors,
font sizes, spacing, radii, shadows, layout — which an implementation
should replicate faithfully in its own components and styling system
rather than copy wholesale.

Differences agreed for the implementation (`resources/js/pages/public/profile.tsx`):

- "Dove ci alleniamo": the 4 options side by side on one row (2 × 2 on phones).
- No captions on the photos of the mosaic and of the full screen gallery.
- The mosaic shows only when the trainer has gallery photos.

## Contents

- `Trainer-Pubblico-A.dc.html` — the artboard (a Design Component: an `<x-dc>`
  template + a small logic class). The values to replicate live in its
  inline `style="…"` attributes and the `<helmet><style>` block.
- `support.js`, `vendor/react*.js` — the runtime that renders the
  component in a browser; not part of the design.

## Viewing

Serve the folder (e.g. `python3 -m http.server`) and open `Trainer-Pubblico-A.dc.html`;
some browsers block the scripts over file://.
