/**
 * Single source of truth for PropFinova's public contact number.
 *
 * It used to be hardcoded in six places as three different placeholders
 * ('910000000000', '91XXXXXXXXXX', 'TBD Phone'), so changing it meant hunting
 * through the codebase. Import from here instead.
 */
export const SUPPORT_PHONE = '9999999999';

/** With country code, the form wa.me and tel: links need. */
export const SUPPORT_PHONE_E164 = `91${SUPPORT_PHONE}`;

/** Pretty form for display, e.g. "+91 99999 99999". */
export const SUPPORT_PHONE_DISPLAY = `+91 ${SUPPORT_PHONE.slice(0, 5)} ${SUPPORT_PHONE.slice(5)}`;

export const SUPPORT_TEL_HREF = `tel:+${SUPPORT_PHONE_E164}`;

export function whatsappHref(message) {
  const base = `https://wa.me/${SUPPORT_PHONE_E164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
