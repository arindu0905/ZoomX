import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-route";
import { getServerEnv } from "@/lib/env";
import { verifyWordPressSignature } from "@/lib/security";
import { CONTENT_TAG } from "@/services/wordpress/content";

/**
 * Called by WordPress (ZOOM X → Site content → Save) so edited copy appears
 * immediately. Signed with the shared WORDPRESS_AUTH_SECRET; refreshes only
 * the site-content cache.
 */
export async function POST(request: NextRequest) {
  const secret = getServerEnv().WORDPRESS_AUTH_SECRET;
  if (!secret) return apiError(503, "unavailable", "Content refresh not configured.");
  const raw = await request.text();
  const ok = verifyWordPressSignature(
    raw,
    request.headers.get("x-zoomx-timestamp"),
    request.headers.get("x-zoomx-signature"),
    secret,
  );
  if (!ok) return apiError(401, "unauthorized", "Unauthorized.");
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return apiOk({ ok: true, revalidated: [CONTENT_TAG] });
}
