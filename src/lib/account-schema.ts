import { z } from "zod";
import { addressSchema } from "./checkout-schema";
import { normaliseLkPhone } from "./sri-lanka";

/** Account form schemas — shared by client forms and server routes. */

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")).pipe(z.string().max(254));
// Length only: WordPress hashes and stores it; no composition rules are invented here.
const newPassword = z.string().min(8, "Use at least 8 characters.").max(200, "That password is too long.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(200),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(60),
  lastName: z.string().trim().min(1, "Enter your last name.").max(60),
  email,
  password: newPassword,
});

export const forgotSchema = z.object({ email });

export const resetSchema = z.object({
  login: z.string().trim().min(1).max(254),
  key: z.string().trim().min(1).max(100),
  password: newPassword,
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(60),
  lastName: z.string().trim().min(1, "Enter your last name.").max(60),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || normaliseLkPhone(v) !== null, "Enter a Sri Lankan phone number, e.g. 077 123 4567.")
    .transform((v) => (v ? normaliseLkPhone(v)! : "")),
  address: addressSchema.omit({ firstName: true, lastName: true }),
});

export const trackSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^#?\d{1,12}$/, "Enter your order number, e.g. 1024."),
  email,
});

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;
export type TrackInput = z.input<typeof trackSchema>;
