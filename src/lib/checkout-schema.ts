import { z } from "zod";
import { DISTRICTS, LK_POSTCODE, normaliseLkPhone } from "./sri-lanka";

/**
 * Checkout form schema — shared by the client form (React Hook Form) and the
 * server route, which re-validates everything. Contains no prices or totals:
 * WooCommerce calculates those from the session cart.
 */

const text = (label: string, max = 100) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${label}.`)
    .max(max, `${label[0].toUpperCase()}${label.slice(1)} is too long.`);

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

const phone = z
  .string()
  .trim()
  .refine((v) => normaliseLkPhone(v) !== null, "Enter a Sri Lankan phone number, e.g. 077 123 4567.")
  .transform((v) => normaliseLkPhone(v)!);

// WooCommerce's default address rules for Sri Lanka require a postcode
// (verified against the store). If the business changes that setting, relax this.
const postcode = z.string().trim().regex(LK_POSTCODE, "Enter your 5-digit postal code.");

export const addressSchema = z.object({
  firstName: text("first name", 60),
  lastName: text("last name", 60),
  address1: text("address", 150),
  address2: optionalText(150),
  city: text("city", 80),
  district: z.enum(DISTRICTS, { error: "Choose your district." }),
  postcode,
});

export const checkoutSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")).pipe(z.string().max(254)),
    phone,
    billing: addressSchema,
    shipToDifferentAddress: z.boolean().default(false),
    // Loosely typed here; validated strictly (and kept) only when shipping elsewhere.
    shipping: z.record(z.string(), z.string().optional()).optional(),
    note: optionalText(500),
    paymentMethod: z.string().trim().min(1, "Choose a payment method.").max(60),
    terms: z.literal(true, { error: "Please accept the terms and conditions." }),
  })
  .transform((v, ctx) => {
    if (!v.shipToDifferentAddress) return { ...v, shipping: undefined };
    const parsed = addressSchema.safeParse(v.shipping ?? {});
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ code: "custom", message: issue.message, path: ["shipping", ...issue.path] });
      }
      return z.NEVER;
    }
    return { ...v, shipping: parsed.data };
  });

export type CheckoutInput = Omit<z.input<typeof checkoutSchema>, "shipping"> & {
  shipping?: Partial<Record<keyof z.input<typeof addressSchema>, string>>;
};
export type CheckoutData = z.output<typeof checkoutSchema>;
export type AddressData = z.output<typeof addressSchema>;

/** WooCommerce Store API address shape. Billing addresses also carry the email. */
export function toWooAddress(a: AddressData, phone: string, email?: string) {
  return {
    first_name: a.firstName,
    last_name: a.lastName,
    company: "",
    address_1: a.address1,
    address_2: a.address2,
    city: a.city,
    state: a.district,
    postcode: a.postcode,
    country: "LK",
    phone,
    ...(email ? { email } : {}),
  };
}
