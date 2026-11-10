import type { NextRequest } from "next/server";
import { apiOk, guardMutation } from "@/lib/api-route";
import { endCustomerSession } from "@/services/auth/session";

export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  await endCustomerSession();
  return apiOk({ ok: true });
}
