/**
 * Hero hand-phone asset: a photo of a hand holding a phone, cut out to a transparent PNG at /public/hero/hand-phone.png
 * and placed on the 1000 x 1400 art box. PHONE_SCREEN is the photo's glass; open `/?debug=1` to see the box.
 * Set HERO_HAND_IMAGE to null to fall back to the drawn SVG hand.
 */
export const HERO_HAND_IMAGE: string | null = "/hero/hand-phone.png";

/** The art box is 1000 x 1400 units. */
export const HAND_BOX = { w: 1000, h: 1400 } as const;

/** Screen rectangle inside the art box, in art units (x, y, w, h) plus corner radius. 400/866 keeps the 390:844 ratio. */
export const PHONE_SCREEN = { x: 300, y: 120, w: 400, h: 861, radius: 40 } as const;
