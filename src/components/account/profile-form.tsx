"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { SelectField, TextField } from "@/components/checkout/fields";
import { Button } from "@/components/ui/button";
import { profileSchema, type ProfileData, type ProfileInput } from "@/lib/account-schema";
import { sendJson } from "@/lib/client-api";
import { DISTRICTS } from "@/lib/sri-lanka";

export function ProfileForm({ defaults }: { defaults: ProfileInput }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileInput, unknown, ProfileData>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileInput, unknown, ProfileData>,
    mode: "onTouched",
    defaultValues: defaults,
  });
  const a = errors.address ?? {};

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (data) => {
        setMessage(null);
        const r = await sendJson("/api/account/profile", "PATCH", data);
        if (!r.ok) return setMessage({ ok: false, text: r.message });
        reset(data as unknown as ProfileInput);
        setMessage({ ok: true, text: "Your details have been saved." });
        router.refresh();
      })}
      className="flex flex-col gap-8"
    >
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-semibold">Your details</legend>
        <TextField
          label="First name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <TextField
          label="Last name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register("lastName")}
        />
        <TextField
          label="Phone"
          type="tel"
          autoComplete="tel"
          optional
          placeholder="077 123 4567"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-lg font-semibold">Default delivery address</legend>
        <p className="-mt-1 text-caption text-ink-muted sm:col-span-2">Used to fill in checkout faster.</p>
        <TextField
          label="Address"
          autoComplete="address-line1"
          className="sm:col-span-2"
          error={a.address1?.message}
          {...register("address.address1")}
        />
        <TextField
          label="Apartment, suite, etc."
          optional
          autoComplete="address-line2"
          className="sm:col-span-2"
          error={a.address2?.message}
          {...register("address.address2")}
        />
        <TextField
          label="City / town"
          autoComplete="address-level2"
          error={a.city?.message}
          {...register("address.city")}
        />
        <SelectField label="District" error={a.district?.message} {...register("address.district")}>
          <option value="" disabled>
            Choose…
          </option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Postal code"
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
          error={a.postcode?.message}
          {...register("address.postcode")}
        />
      </fieldset>

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={
            message.ok
              ? "bg-brand-tint px-4 py-3 text-body text-brand-strong"
              : "bg-[#fdecec] px-4 py-3 text-body text-danger"
          }
        >
          {message.text}
        </p>
      )}
      <div>
        <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
