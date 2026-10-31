/**
 * Hero hand-phone asset. Drop a transparent PNG at /public/hero/hand-phone.png, set HERO_HAND_IMAGE to its path,
 * then tune PHONE_SCREEN so the live screen sits exactly on the photo's glass (open `/?debug=1` to see the box).
 * Until then an original SVG hand and CSS phone are drawn in the same coordinate space.
 */
export const HERO_HAND_IMAGE: string | null = null; // "/hero/hand-phone.png"

/** The art box is 1000 x 1400 units. */
export const HAND_BOX = { w: 1000, h: 1400 } as const;

/** Screen rectangle inside the art box, in art units (x, y, w, h) plus corner radius. 400/866 keeps the 390:844 ratio. */
export const PHONE_SCREEN = { x: 300, y: 120, w: 400, h: 866, radius: 58 } as const;
