"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CONTENT_SECTIONS, saveRawContent, saveRawPage } from "@/services/admin/content";
import { endAdminSession, requireStaff, staffLogin, startAdminSession } from "@/services/admin/session";
import {
  addOrderNote,
  createCoupon,
  deleteCoupon,
  ORDER_STATUS_VALUES,
  updateOrderStatus,
  updateProduct,
  updateVariation,
  type ProductUpdate,
} from "@/services/admin/woo";
import { AuthError } from "@/services/auth/wordpress-auth";
import { CONTENT_TAG } from "@/services/wordpress/content";
import { DEFAULT_PAGES, sectionsToText } from "@/services/wordpress/pages";

/*
 * Every action below re-confirms the staff member with WordPress first
 * (requireStaff), validates its input with Zod, then saves through
 * WooCommerce / the ZOOM X plugin. Next.js checks the request Origin for
 * Server Actions, which blocks cross-site form posts.
 */

const qs = (params: Record<string, string>) => `?${new URLSearchParams(params)}`;
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const id = z.coerce.number().int().positive();
const price = z.string().trim().regex(/^(\d{1,9}(\.\d{1,2})?)?$/, "Prices must be numbers like 650 or 650.00");

/** Refreshes storefront caches after product changes. */
function refreshProducts(productId?: number) {
  revalidateTag("products", { expire: 0 });
  revalidateTag("categories", { expire: 0 });
  if (productId) revalidateTag(`product:${productId}`, { expire: 0 });
}

// ── Sign in / out ────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const ip = clientIp(await headers());
  if (!rateLimit(`admin-login:ip:${ip}`, 10, 15 * 60_000) || !rateLimit(`admin-login:acct:${email}`, 5, 15 * 60_000)) {
    redirect(`/admin/login${qs({ error: "Too many attempts. Please wait 15 minutes and try again." })}`);
  }
  let ok = false;
  try {
    if (email && password) {
      const staff = await staffLogin(email, password);
      await startAdminSession(staff.id);
      ok = true;
    }
  } catch (err) {
    if (!(err instanceof AuthError)) console.error("[admin] login failed");
  }
  redirect(ok ? "/admin" : `/admin/login${qs({ error: "Incorrect email or password, or this account isn’t a shop manager." })}`);
}

export async function signOutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

// ── Products ─────────────────────────────────────────────────────────────

const productForm = z.object({
  id,
  name: z.string().trim().min(1, "Name is required").max(200),
  status: z.enum(["publish", "draft", "private"]),
  regular_price: price,
  sale_price: price,
  manage_stock: z.boolean(),
  stock_quantity: z.string().trim().regex(/^\d{0,7}$/, "Stock must be a whole number"),
  stock_status: z.enum(["instock", "outofstock"]),
  featured: z.boolean(),
  short_description: z.string().max(2000),
  is_variable: z.boolean(),
});

export async function saveProductAction(formData: FormData) {
  await requireStaff();
  const parsed = productForm.safeParse({
    id: formData.get("id"),
    name: str(formData, "name"),
    status: str(formData, "status"),
    regular_price: str(formData, "regular_price"),
    sale_price: str(formData, "sale_price"),
    manage_stock: formData.get("manage_stock") === "on",
    stock_quantity: str(formData, "stock_quantity"),
    stock_status: str(formData, "stock_status") || "instock",
    featured: formData.get("featured") === "on",
    short_description: str(formData, "short_description"),
    is_variable: formData.get("is_variable") === "1",
  });
  const back = `/admin/products/${String(formData.get("id"))}`;
  if (!parsed.success) redirect(back + qs({ error: parsed.error.issues[0].message }));
  const p = parsed.data;
  if (p.sale_price && p.regular_price && Number(p.sale_price) >= Number(p.regular_price)) {
    redirect(back + qs({ error: "The sale price must be lower than the regular price." }));
  }

  // Variable products keep price and stock on each option (variation).
  const update: ProductUpdate = {
    name: p.name,
    status: p.status,
    featured: p.featured,
    // Plain text only: line breaks become paragraphs on the website.
    short_description: p.short_description,
    ...(p.is_variable
      ? {}
      : {
          regular_price: p.regular_price,
          sale_price: p.sale_price,
          manage_stock: p.manage_stock,
          ...(p.manage_stock
            ? { stock_quantity: p.stock_quantity === "" ? 0 : Number(p.stock_quantity) }
            : { stock_status: p.stock_status }),
        }),
  };
  let error = "";
  try {
    await updateProduct(p.id, update);
  } catch {
    error = "Couldn’t save the product. Please try again.";
  }
  refreshProducts(p.id);
  redirect(back + qs(error ? { error } : { saved: "Product saved. The website is updated." }));
}

const variationForm = z.object({
  product_id: id,
  id,
  regular_price: price,
  sale_price: price,
  stock_quantity: z.string().trim().regex(/^\d{1,7}$/, "Stock must be a whole number"),
});

export async function saveVariationAction(formData: FormData) {
  await requireStaff();
  const back = `/admin/products/${String(formData.get("product_id"))}`;
  const parsed = variationForm.safeParse(Object.fromEntries(["product_id", "id", "regular_price", "sale_price", "stock_quantity"].map((k) => [k, str(formData, k)])));
  if (!parsed.success) redirect(back + qs({ error: parsed.error.issues[0].message }));
  const v = parsed.data;
  if (v.sale_price && v.regular_price && Number(v.sale_price) >= Number(v.regular_price)) {
    redirect(back + qs({ error: "The sale price must be lower than the regular price." }));
  }
  let error = "";
  try {
    await updateVariation(v.product_id, v.id, {
      regular_price: v.regular_price,
      sale_price: v.sale_price,
      manage_stock: true,
      stock_quantity: Number(v.stock_quantity),
    });
  } catch {
    error = "Couldn’t save that option. Please try again.";
  }
  refreshProducts(v.product_id);
  redirect(back + qs(error ? { error } : { saved: "Option saved. The website is updated." }));
}

// ── Orders ───────────────────────────────────────────────────────────────

export async function updateOrderStatusAction(formData: FormData) {
  await requireStaff();
  const parsed = z.object({ id, status: z.enum(ORDER_STATUS_VALUES) }).safeParse({ id: formData.get("id"), status: str(formData, "status") });
  const back = `/admin/orders/${String(formData.get("id"))}`;
  if (!parsed.success) redirect(back + qs({ error: "Choose a valid status." }));
  let error = "";
  try {
    await updateOrderStatus(parsed.data.id, parsed.data.status);
  } catch {
    error = "Couldn’t update the order. Please try again.";
  }
  // Stock may change (cancel/refund restock), so refresh product data too.
  refreshProducts();
  redirect(back + qs(error ? { error } : { saved: "Order status updated. WooCommerce has emailed the customer where applicable." }));
}

export async function addOrderNoteAction(formData: FormData) {
  await requireStaff();
  const parsed = z
    .object({ id, note: z.string().trim().min(1, "Write a note first").max(2000), to_customer: z.boolean() })
    .safeParse({ id: formData.get("id"), note: str(formData, "note"), to_customer: formData.get("to_customer") === "on" });
  const back = `/admin/orders/${String(formData.get("id"))}`;
  if (!parsed.success) redirect(back + qs({ error: parsed.error.issues[0].message }));
  let error = "";
  try {
    await addOrderNote(parsed.data.id, parsed.data.note, parsed.data.to_customer);
  } catch {
    error = "Couldn’t add the note. Please try again.";
  }
  redirect(back + qs(error ? { error } : { saved: parsed.data.to_customer ? "Note sent to the customer." : "Private note added." }));
}

// ── Discounts ────────────────────────────────────────────────────────────

const couponForm = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Codes need at least 3 characters")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - or _ only"),
  discount_type: z.enum(["percent", "fixed_cart"]),
  amount: z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter the discount amount"),
  description: z.string().max(200),
  date_expires: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
  usage_limit: z.string().regex(/^\d{0,6}$/),
  minimum_amount: price,
});

export async function createCouponAction(formData: FormData) {
  await requireStaff();
  const parsed = couponForm.safeParse(
    Object.fromEntries(["code", "discount_type", "amount", "description", "date_expires", "usage_limit", "minimum_amount"].map((k) => [k, str(formData, k)])),
  );
  if (!parsed.success) redirect(`/admin/coupons${qs({ error: parsed.error.issues[0].message })}`);
  const c = parsed.data;
  if (c.discount_type === "percent" && Number(c.amount) > 100) redirect(`/admin/coupons${qs({ error: "A percentage discount can’t be over 100." })}`);
  let error = "";
  try {
    await createCoupon({
      code: c.code.toLowerCase(),
      discount_type: c.discount_type,
      amount: c.amount,
      description: c.description,
      date_expires: c.date_expires || null,
      usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
      minimum_amount: c.minimum_amount,
    });
  } catch {
    error = "Couldn’t create the code. It may already exist.";
  }
  redirect(`/admin/coupons${qs(error ? { error } : { saved: `Discount code ${c.code.toUpperCase()} created.` })}`);
}

export async function deleteCouponAction(formData: FormData) {
  await requireStaff();
  const parsed = id.safeParse(formData.get("id"));
  if (!parsed.success) redirect("/admin/coupons");
  let error = "";
  try {
    await deleteCoupon(parsed.data);
  } catch {
    error = "Couldn’t delete the code. Please try again.";
  }
  redirect(`/admin/coupons${qs(error ? { error } : { saved: "Discount code deleted." })}`);
}

// ── Site content & pages ─────────────────────────────────────────────────

export async function saveContentAction(formData: FormData) {
  await requireStaff();
  const content: Record<string, Record<string, string>> = {};
  for (const section of CONTENT_SECTIONS) {
    for (const f of section.fields) {
      const raw = f.type === "checkbox" ? (formData.get(`${section.key}.${f.key}`) === "on" ? "1" : "") : str(formData, `${section.key}.${f.key}`);
      if (raw.length > 2000) redirect(`/admin/content${qs({ error: `“${f.label}” is too long.` })}`);
      if (raw) (content[section.key] ??= {})[f.key] = raw;
    }
  }
  let error = "";
  try {
    await saveRawContent(content);
  } catch {
    error = "Couldn’t save. Please try again.";
  }
  revalidateTag(CONTENT_TAG, { expire: 0 });
  redirect(`/admin/content${qs(error ? { error } : { saved: "Saved. The website is updated." })}`);
}

const pageForm = z.object({
  slug: z.string().refine((s) => s in DEFAULT_PAGES, "Unknown page"),
  title: z.string().max(200),
  description: z.string().max(300),
  eyebrow: z.string().max(200),
  lead: z.string().max(300),
  status: z.enum(["draft", "approved"]),
  body: z.string().max(20000),
});

export async function savePageAction(formData: FormData) {
  await requireStaff();
  const restore = formData.get("restore") === "1";
  const parsed = pageForm.safeParse(
    Object.fromEntries(["slug", "title", "description", "eyebrow", "lead", "status", "body"].map((k) => [k, str(formData, k)])),
  );
  const slug = String(formData.get("slug") ?? "");
  if (!parsed.success) redirect(`/admin/pages/${encodeURIComponent(slug)}${qs({ error: parsed.error.issues[0].message })}`);
  const p = parsed.data;

  // Store only what differs from the built-in page, so later improvements to it still show.
  const base = DEFAULT_PAGES[p.slug];
  const defaults: Record<string, string> = {
    title: base.title,
    description: base.description,
    eyebrow: base.eyebrow ?? "",
    lead: base.lead ?? "",
    status: base.status === "draft" ? "draft" : "approved",
    body: sectionsToText(base.sections),
  };
  const norm = (s: string) => s.replace(/\r\n?/g, "\n").trim();
  const changed = Object.fromEntries(
    (["title", "description", "eyebrow", "lead", "status", "body"] as const)
      .filter((k) => p[k] !== "" && norm(p[k]) !== norm(defaults[k]))
      .map((k) => [k, norm(p[k])]),
  );

  let error = "";
  try {
    await saveRawPage(p.slug, restore || Object.keys(changed).length === 0 ? null : changed);
  } catch {
    error = "Couldn’t save. Please try again.";
  }
  revalidateTag(CONTENT_TAG, { expire: 0 });
  redirect(
    `/admin/pages/${p.slug}${qs(error ? { error } : { saved: restore ? "Restored the standard text." : "Saved. The website is updated." })}`,
  );
}
