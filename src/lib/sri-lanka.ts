/**
 * Sri Lanka address helpers. The 25 administrative districts are public
 * reference data (not business data). WooCommerce core defines no states for
 * LK, so the district is sent in the address `state` field as text.
 */

export const DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
] as const;

export type District = (typeof DISTRICTS)[number];

/**
 * Normalises a Sri Lankan phone number to E.164 (+94XXXXXXXXX) or returns
 * null. Accepts 0XXXXXXXXX, 94XXXXXXXXX and +94XXXXXXXXX, with spaces or
 * dashes. National numbers are 9 digits after the leading 0 / country code;
 * mobile (7X) and landline area codes are both accepted.
 */
export function normaliseLkPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const m = /^(?:\+94|0094|94|0)([1-9]\d{8})$/.exec(digits);
  return m ? `+94${m[1]}` : null;
}

/** Sri Lankan postal codes are 5 digits. */
export const LK_POSTCODE = /^\d{5}$/;
