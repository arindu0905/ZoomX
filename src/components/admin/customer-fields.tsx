import type { AdminCustomer } from "@/services/admin/woo";
import { AddressFields } from "./address-fields";
import { Field, inputClass } from "./ui";

/** Name, email, phone and address for a customer account (names match readCustomer()/addressFrom()). */
export function CustomerFields({ customer }: { customer?: AdminCustomer }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input name="first_name" defaultValue={customer?.first_name ?? ""} required maxLength={100} className={inputClass} />
        </Field>
        <Field label="Last name">
          <input name="last_name" defaultValue={customer?.last_name ?? ""} maxLength={100} className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={customer?.email ?? ""} required maxLength={200} className={inputClass} />
        </Field>
        <Field label="Phone">
          <input name="phone" type="tel" defaultValue={customer?.billing.phone ?? ""} maxLength={20} className={inputClass} />
        </Field>
      </div>
      <h3 className="mt-2 text-sm font-semibold">Delivery address</h3>
      <AddressFields value={customer?.billing} withName={false} />
    </div>
  );
}
