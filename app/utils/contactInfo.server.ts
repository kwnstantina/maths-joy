/**
 * How students can reach Greg (the human). Read per request from env vars so
 * the number or booking link can change on Vercel without a rebuild. Shared
 * by the contact page and Greg AI's contact card.
 */

const DEFAULT_EMAIL = "gregkirmaths@gmail.com";
const DEFAULT_PHONE = "+306987495775";

export interface ContactInfo {
  email: string;
  /** E.164-ish, used for tel: links. */
  phone: string;
  /** Digits only, for wa.me links. Null when WhatsApp is turned off. */
  whatsapp: string | null;
  /** External booking calendar (Calendly, Cal.com, …). Null when unset. */
  bookingUrl: string | null;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function getContactInfo(): ContactInfo {
  const phone = (process.env.CONTACT_PHONE || DEFAULT_PHONE).replace(/\s/g, "");

  // CONTACT_WHATSAPP=off disables the button; unset falls back to the phone.
  const whatsappRaw = process.env.CONTACT_WHATSAPP ?? phone;
  const whatsapp = ["off", "false", "0", ""].includes(whatsappRaw.trim().toLowerCase())
    ? null
    : digitsOnly(whatsappRaw) || null;

  // Only https links: this ends up in an <a href> on every page.
  const booking = process.env.BOOKING_URL?.trim();
  const bookingUrl = booking && booking.startsWith("https://") ? booking : null;

  return {
    email: process.env.CONTACT_PUBLIC_EMAIL || DEFAULT_EMAIL,
    phone,
    whatsapp,
    bookingUrl,
  };
}
