import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountLoading, AccountShell } from "@/components/account/account-shell";
import { ProfileForm } from "@/components/account/profile-form";
import { DISTRICTS, type District } from "@/lib/sri-lanka";
import { getCustomerSession } from "@/services/auth/session";
import { getCustomer } from "@/services/woocommerce/customers";

export const metadata: Metadata = { title: "Your details", robots: { index: false, follow: false } };

export default function DetailsPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <Details />
    </Suspense>
  );
}

async function Details() {
  const session = await getCustomerSession();
  if (!session) redirect("/account");
  const c = await getCustomer(session.customerId);
  const a = c.billing;
  const district = (DISTRICTS as readonly string[]).includes(a.state) ? (a.state as District) : ("" as District);

  return (
    <AccountShell title="Details." current="/account/details">
      <div className="max-w-2xl">
        <p className="mb-8 text-body text-ink-muted">Signed in as {c.email}</p>
        <ProfileForm
          defaults={{
            firstName: c.first_name,
            lastName: c.last_name,
            phone: a.phone ?? "",
            address: { address1: a.address_1, address2: a.address_2, city: a.city, district, postcode: a.postcode },
          }}
        />
      </div>
    </AccountShell>
  );
}
