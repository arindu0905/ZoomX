import type { NextRequest } from "next/server";
import { apiError, apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { profileSchema } from "@/lib/account-schema";
import { getCustomerSession } from "@/services/auth/session";
import { updateCustomer } from "@/services/woocommerce/customers";

/** Updates the signed-in customer's name, phone and default address. */
export async function PATCH(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const session = await getCustomerSession();
  if (!session) return apiError(401, "unauthorized", "Please sign in again.");
  const body = await readJson(request, profileSchema);
  if ("response" in body) return body.response;
  const d = body.data;
  const addr = {
    first_name: d.firstName,
    last_name: d.lastName,
    address_1: d.address.address1,
    address_2: d.address.address2,
    city: d.address.city,
    state: d.address.district,
    postcode: d.address.postcode,
    country: "LK",
  };
  try {
    // The id comes from the signed session only.
    await updateCustomer(session.customerId, {
      first_name: d.firstName,
      last_name: d.lastName,
      billing: { ...addr, phone: d.phone },
      shipping: addr,
    });
    return apiOk({ ok: true });
  } catch (err) {
    return handleApiError("profile", err);
  }
}
