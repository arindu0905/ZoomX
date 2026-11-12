import { DISTRICTS } from "@/lib/sri-lanka";
import type { AdminAddress } from "@/services/admin/woo";
import { Field, inputClass } from "./ui";

/** Name + Sri Lankan delivery address fields (field names match addressFrom() in actions.ts). */
export function AddressFields({ value = {}, withName = true }: { value?: AdminAddress; withName?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {withName && (
        <>
          <Field label="First name">
            <input name="first_name" defaultValue={value.first_name ?? ""} maxLength={100} className={inputClass} />
          </Field>
          <Field label="Last name">
            <input name="last_name" defaultValue={value.last_name ?? ""} maxLength={100} className={inputClass} />
          </Field>
        </>
      )}
      <div className="sm:col-span-2">
        <Field label="Address">
          <input name="address_1" defaultValue={value.address_1 ?? ""} maxLength={200} className={inputClass} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Apartment, suite, etc. (optional)">
          <input name="address_2" defaultValue={value.address_2 ?? ""} maxLength={200} className={inputClass} />
        </Field>
      </div>
      <Field label="City / town">
        <input name="city" defaultValue={value.city ?? ""} maxLength={100} className={inputClass} />
      </Field>
      <Field label="District">
        <select name="state" defaultValue={value.state ?? ""} className={inputClass}>
          <option value="">—</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Postal code">
        <input name="postcode" defaultValue={value.postcode ?? ""} inputMode="numeric" maxLength={20} className={inputClass} />
      </Field>
    </div>
  );
}
