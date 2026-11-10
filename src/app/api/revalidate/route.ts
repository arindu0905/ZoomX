import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, readJson } from "@/lib/api-route";
import { getServerEnv } from "@/lib/env";
import { ALLOWED_TAG } from "@/lib/revalidation";
import { safeEqual } from "@/lib/security";

const bodySchema = z.object({ tags: z.array(z.string().regex(ALLOWED_TAG)).min(1).max(50) });

/**
 * Manual cache refresh for operators, e.g.
 *   curl -X POST $SITE/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *        -H "Content-Type: application/json" -d '{"tags":["products","categories"]}'
 */
export async function POST(request: NextRequest) {
  const secret = getServerEnv().REVALIDATE_SECRET;
  if (!secret) return apiError(503, "unavailable", "Revalidation not configured.");
  const auth = request.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${secret}`)) return apiError(401, "unauthorized", "Unauthorized.");

  const body = await readJson(request, bodySchema);
  if ("response" in body) return body.response;
  for (const tag of body.data.tags) revalidateTag(tag, { expire: 0 });
  return apiOk({ ok: true, revalidated: body.data.tags });
}
