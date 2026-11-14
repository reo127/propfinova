/**
 * Single source of truth for PropFinova's public contact number, mirroring
 * src/lib/contact.js on the web so the app and the site never disagree.
 */
export const SUPPORT_PHONE = "9999999999";

export const SUPPORT_PHONE_E164 = `91${SUPPORT_PHONE}`;

export const SUPPORT_PHONE_DISPLAY = `+91 ${SUPPORT_PHONE.slice(0, 5)} ${SUPPORT_PHONE.slice(5)}`;

export const SUPPORT_TEL_HREF = `tel:+${SUPPORT_PHONE_E164}`;

export function whatsappHref(message) {
  const base = `https://wa.me/${SUPPORT_PHONE_E164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
