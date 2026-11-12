"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CONTENT_SECTIONS, saveRawContent, saveRawPage, uploadImage } from "@/services/admin/content";
import { endAdminSession, requireStaff, staffLogin, startAdminSession } from "@/services/admin/session";
import {
  addOrderNote,
  ADMIN_TAG,
  createCategory,
  createCoupon,
  createCustomer,
  createOrder,
  createProduct,
  createVariation,
  deleteCategory,
  deleteCoupon,
  deleteCustomer,
  deleteOrderNote,
  deleteVariation,
  getProduct,
  ORDER_STATUS_VALUES,
  trashOrder,
  trashProduct,
  updateCategory,
  updateCoupon,
  updateCustomer,
  updateOrder,
  updateProduct,
  updateVariation,
  type AdminAddress,
  type CouponInput,
  type ProductInput,
} from "@/services/admin/woo";
import { AuthError } from "@/services/auth/wordpress-auth";
import { CONTENT_TAG } from "@/services/wordpress/content";
import { DEFAULT_PAGES, sectionsToText } from "@/services/wordpress/pages";
import { StoreApiError } from "@/services/woocommerce/store-api";

/*
 * Every action re-confirms the staff member with WordPress first
 * (requireStaff), validates its input with Zod, then saves through
 * WooCommerce / the ZOOM X plugin and refreshes the caches it affects.
 * Next.js checks the request Origin for Server Actions, which blocks
 * cross-site form posts.
 */

// ── Helpers ──────────────────────────────────────────────────────────────

const qs = (params: Record<string, string>) => `?${new URLSearchParams(params)}`;
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const bool = (fd: FormData, k: string) => fd.get(k) === "on";
const id = z.coerce.number().int().positive();
const price = z.string().trim().regex(/^(\d{1,9}(\.\d{1,2})?)?$/, "Prices must be numbers like 650 or 650.00");
const wholeNumber = z.string().trim().regex(/^\d{0,7}$/, "Stock must be a whole number");
const text = (max: number) => z.string().trim().max(max);

/** Refreshes the admin and the storefront after any store change. */
function refreshStore(productId?: number) {
  revalidateTag(ADMIN_TAG, { expire: 0 });
  revalidateTag("products", { expire: 0 });
  revalidateTag("categories", { expire: 0 });
  if (productId) revalidateTag(`product:${productId}`, { expire: 0 });
}

/** WooCommerce's reason if it gave one, otherwise a friendly fallback. */
const reason = (err: unknown, fallback: string) =>
  err instanceof StoreApiError && err.detail ? `${fallback} ${err.detail}` : err instanceof AuthError ? `${fallback} ${err.message}` : fallback;

function fail(path: string, message: string): never {
  redirect(path + qs({ error: message }));
}

function done(path: string, message: string): never {
  redirect(path + qs({ saved: message }));
}

function parse<T extends z.ZodType>(schema: T, data: unknown, back: string): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) fail(back, r.error.issues[0].message);
  return r.data;
}

function saleCheck(regular: string, sale: string | undefined, back: string) {
  if (sale && regular && Number(sale) >= Number(regular)) fail(back, "The sale price must be lower than the regular price.");
}

/** Optional photo field: uploads it and returns the WordPress media id. */
async function photo(fd: FormData, field: string, alt: string, back: string): Promise<number | null> {
  const file = fd.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) fail(back, "Images must be 5 MB or smaller.");
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) fail(back, "Use a JPG, PNG or WebP image.");
  try {
    return (await uploadImage(file, alt)).id;
  } catch (err) {
    fail(back, reason(err, "Couldn’t upload the image."));
  }
}

const addressFrom = (fd: FormData, prefix: string): AdminAddress => ({
  first_name: str(fd, `${prefix}first_name`).slice(0, 100),
  last_name: str(fd, `${prefix}last_name`).slice(0, 100),
  address_1: str(fd, `${prefix}address_1`).slice(0, 200),
  address_2: str(fd, `${prefix}address_2`).slice(0, 200),
  city: str(fd, `${prefix}city`).slice(0, 100),
  state: str(fd, `${prefix}state`).slice(0, 100),
  postcode: str(fd, `${prefix}postcode`).slice(0, 20),
  country: "LK",
});

// ── Sign in / out ────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const ip = clientIp(await headers());
  if (!rateLimit(`admin-login:ip:${ip}`, 10, 15 * 60_000) || !rateLimit(`admin-login:acct:${email}`, 5, 15 * 60_000)) {
    fail("/admin/login", "Too many attempts. Please wait 15 minutes and try again.");
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
  if (!ok) fail("/admin/login", "Incorrect email or password, or this account isn’t a shop manager.");
  redirect("/admin");
}

export async function signOutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

// ── Products ─────────────────────────────────────────────────────────────

const productFields = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  status: z.enum(["publish", "draft", "private"]),
  sku: text(60),
  regular_price: price,
  sale_price: price,
  manage_stock: z.boolean(),
  stock_quantity: wholeNumber,
  stock_status: z.enum(["instock", "outofstock"]),
  featured: z.boolean(),
  short_description: text(2000),
  description: text(20000),
  categories: z.array(id).max(10),
});

function readProduct(fd: FormData) {
  return {
    name: str(fd, "name"),
    status: str(fd, "status") || "draft",
    sku: str(fd, "sku"),
    regular_price: str(fd, "regular_price"),
    sale_price: str(fd, "sale_price"),
    manage_stock: bool(fd, "manage_stock"),
    stock_quantity: str(fd, "stock_quantity"),
    stock_status: str(fd, "stock_status") || "instock",
    featured: bool(fd, "featured"),
    short_description: str(fd, "short_description"),
    description: str(fd, "description"),
    categories: fd.getAll("categories").map(String),
  };
}

/** Plain text from the form → simple paragraphs for WooCommerce (escaped; never raw HTML). */
const toHtml = (s: string) =>
  s
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`)
    .join("");

function productPayload(p: z.infer<typeof productFields>, isVariable: boolean): ProductInput {
  return {
    name: p.name,
    status: p.status,
    featured: p.featured,
    sku: p.sku,
    short_description: toHtml(p.short_description),
    description: toHtml(p.description),
    categories: p.categories.map((c) => ({ id: c })),
    // Variable products keep price and stock on each option.
    ...(isVariable
      ? {}
      : {
          regular_price: p.regular_price,
          sale_price: p.sale_price,
          manage_stock: p.manage_stock,
          ...(p.manage_stock ? { stock_quantity: p.stock_quantity === "" ? 0 : Number(p.stock_quantity) } : { stock_status: p.stock_status }),
        }),
  };
}

export async function createProductAction(formData: FormData) {
  await requireStaff();
  const back = "/admin/products/new";
  const p = parse(productFields, readProduct(formData), back);
  const isVariable = str(formData, "type") === "variable";
  const optionName = str(formData, "option_name").slice(0, 60);
  const options = str(formData, "option_values")
    .split(/[,\n]/)
    .map((o) => o.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 20);
  if (isVariable && (!optionName || options.length === 0)) fail(back, "For a product with options, give the option a name (e.g. Fragrance) and at least one choice.");
  if (!isVariable) saleCheck(p.regular_price, p.sale_price, back);

  const imageId = await photo(formData, "image", p.name, back);
  let createdId = 0;
  try {
    const created = await createProduct({
      ...productPayload(p, isVariable),
      type: isVariable ? "variable" : "simple",
      ...(imageId ? { images: [{ id: imageId }] } : {}),
      ...(isVariable ? { attributes: [{ name: optionName, options, visible: true, variation: true }] } : {}),
    });
    createdId = created.id;
    // One option per choice, at the given price; staff then set stock per option.
    if (isVariable) {
      for (const option of options) {
        await createVariation(created.id, {
          attributes: [{ name: optionName, option }],
          regular_price: p.regular_price,
          manage_stock: true,
          stock_quantity: p.stock_quantity === "" ? 0 : Number(p.stock_quantity),
        });
      }
    }
  } catch (err) {
    if (!createdId) fail(back, reason(err, "Couldn’t create the product."));
  }
  refreshStore(createdId);
  done(`/admin/products/${createdId}`, isVariable ? "Product created. Set the price and stock for each option below." : "Product created.");
}

export async function saveProductAction(formData: FormData) {
  await requireStaff();
  const productId = parse(id, formData.get("id"), "/admin/products");
  const back = `/admin/products/${productId}`;
  const p = parse(productFields, readProduct(formData), back);
  const isVariable = formData.get("is_variable") === "1";
  if (!isVariable) saleCheck(p.regular_price, p.sale_price, back);

  const update: ProductInput = productPayload(p, isVariable);
  const newImage = await photo(formData, "image", p.name, back);
  const keepImages = formData.getAll("keep_image").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (newImage || formData.get("images_touched") === "1") {
    update.images = [...keepImages, ...(newImage ? [newImage] : [])].map((i) => ({ id: i }));
  }
  try {
    await updateProduct(productId, update);
  } catch (err) {
    fail(back, reason(err, "Couldn’t save the product."));
  }
  refreshStore(productId);
  done(back, "Product saved. The website is updated.");
}

export async function trashProductAction(formData: FormData) {
  await requireStaff();
  const productId = parse(id, formData.get("id"), "/admin/products");
  try {
    await trashProduct(productId);
  } catch (err) {
    fail(`/admin/products/${productId}`, reason(err, "Couldn’t delete the product."));
  }
  refreshStore(productId);
  done("/admin/products", "Product moved to the trash. It can be restored from WordPress → Products → Trash for 30 days.");
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
  const back = `/admin/products/${str(formData, "product_id")}`;
  const v = parse(variationForm, Object.fromEntries(["product_id", "id", "regular_price", "sale_price", "stock_quantity"].map((k) => [k, str(formData, k)])), back);
  saleCheck(v.regular_price, v.sale_price, back);
  try {
    await updateVariation(v.product_id, v.id, {
      regular_price: v.regular_price,
      sale_price: v.sale_price,
      manage_stock: true,
      stock_quantity: Number(v.stock_quantity),
    });
  } catch (err) {
    fail(back, reason(err, "Couldn’t save that option."));
  }
  refreshStore(v.product_id);
  done(back, "Option saved. The website is updated.");
}

export async function addVariationAction(formData: FormData) {
  await requireStaff();
  const productId = parse(id, formData.get("product_id"), "/admin/products");
  const back = `/admin/products/${productId}`;
  const v = parse(
    z.object({
      option: z.string().trim().min(1, "Name the new option").max(60),
      regular_price: price.refine((s) => s !== "", "Set a price for the new option"),
      stock_quantity: z.string().trim().regex(/^\d{1,7}$/, "Stock must be a whole number"),
    }),
    { option: str(formData, "option"), regular_price: str(formData, "regular_price"), stock_quantity: str(formData, "stock_quantity") || "0" },
    back,
  );
  try {
    const product = await getProduct(productId);
    const attr = product.attributes.find((a) => a.variation);
    if (!attr) fail(back, "This product has no option type to add to.");
    if (attr.options.some((o) => o.toLowerCase() === v.option.toLowerCase())) fail(back, `“${v.option}” already exists.`);
    // Add the choice to the product's option list, then create its variation.
    await updateProduct(productId, {
      attributes: product.attributes.map((a) => ({ id: a.id, name: a.name, visible: a.visible, variation: a.variation, options: a === attr ? [...a.options, v.option] : a.options })),
    });
    await createVariation(productId, {
      attributes: [{ name: attr.name, option: v.option }],
      regular_price: v.regular_price,
      manage_stock: true,
      stock_quantity: Number(v.stock_quantity),
    });
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err; // redirect()
    fail(back, reason(err, "Couldn’t add the option."));
  }
  refreshStore(productId);
  done(back, `Option “${v.option}” added.`);
}

export async function deleteVariationAction(formData: FormData) {
  await requireStaff();
  const productId = parse(id, formData.get("product_id"), "/admin/products");
  const variationId = parse(id, formData.get("id"), `/admin/products/${productId}`);
  try {
    await deleteVariation(productId, variationId);
  } catch (err) {
    fail(`/admin/products/${productId}`, reason(err, "Couldn’t delete the option."));
  }
  refreshStore(productId);
  done(`/admin/products/${productId}`, "Option deleted.");
}

// ── Categories ───────────────────────────────────────────────────────────

const categoryForm = z.object({ name: z.string().trim().min(1, "Name is required").max(100), description: text(1000) });

export async function createCategoryAction(formData: FormData) {
  await requireStaff();
  const c = parse(categoryForm, { name: str(formData, "name"), description: str(formData, "description") }, "/admin/categories");
  const imageId = await photo(formData, "image", c.name, "/admin/categories");
  try {
    await createCategory({ ...c, ...(imageId ? { image: { id: imageId } } : {}) });
  } catch (err) {
    fail("/admin/categories", reason(err, "Couldn’t create the category."));
  }
  refreshStore();
  done("/admin/categories", `Category “${c.name}” created.`);
}

export async function updateCategoryAction(formData: FormData) {
  await requireStaff();
  const catId = parse(id, formData.get("id"), "/admin/categories");
  const c = parse(categoryForm, { name: str(formData, "name"), description: str(formData, "description") }, "/admin/categories");
  const imageId = await photo(formData, "image", c.name, "/admin/categories");
  try {
    await updateCategory(catId, { ...c, ...(imageId ? { image: { id: imageId } } : {}) });
  } catch (err) {
    fail("/admin/categories", reason(err, "Couldn’t save the category."));
  }
  refreshStore();
  done("/admin/categories", `Category “${c.name}” saved.`);
}

export async function deleteCategoryAction(formData: FormData) {
  await requireStaff();
  const catId = parse(id, formData.get("id"), "/admin/categories");
  try {
    await deleteCategory(catId);
  } catch (err) {
    fail("/admin/categories", reason(err, "Couldn’t delete the category."));
  }
  refreshStore();
  done("/admin/categories", "Category deleted. Its products are kept.");
}

// ── Orders ───────────────────────────────────────────────────────────────

export async function createOrderAction(formData: FormData) {
  await requireStaff();
  const back = "/admin/orders/new";
  const billing = addressFrom(formData, "");
  const contact = parse(
    z.object({
      email: z.union([z.literal(""), z.email("Enter a valid email")]),
      phone: z.string().trim().regex(/^[+\d\s-]{0,20}$/, "Enter a valid phone number"),
    }),
    { email: str(formData, "email"), phone: str(formData, "phone") },
    back,
  );
  if (!billing.first_name) fail(back, "Enter the customer’s name.");

  // Item rows: item = "productId" or "productId:variationId".
  const items = formData
    .getAll("item")
    .map((v, i) => ({ v: String(v), qty: Number(formData.getAll("qty")[i] ?? 0) }))
    .filter((r) => r.v && r.qty > 0)
    .map((r) => {
      const [p, vId] = r.v.split(":").map(Number);
      return { product_id: p, ...(vId ? { variation_id: vId } : {}), quantity: Math.min(Math.floor(r.qty), 999) };
    })
    .filter((r) => Number.isInteger(r.product_id) && r.product_id > 0);
  if (items.length === 0) fail(back, "Add at least one product.");

  const status = parse(z.enum(ORDER_STATUS_VALUES), str(formData, "status") || "processing", back);
  const delivery = parse(price, str(formData, "delivery"), back);
  const paymentTitle = str(formData, "payment").slice(0, 60) || "Cash on delivery";

  let orderId = 0;
  try {
    const order = await createOrder({
      status,
      // WooCommerce rejects an empty email, so leave it out when not given.
      billing: { ...billing, ...(contact.email ? { email: contact.email } : {}), phone: contact.phone },
      shipping: billing,
      line_items: items,
      payment_method: paymentTitle === "Cash on delivery" ? "cod" : "other",
      payment_method_title: paymentTitle,
      customer_note: str(formData, "note").slice(0, 1000),
      ...(delivery ? { shipping_lines: [{ method_id: "flat_rate", method_title: "Delivery", total: delivery }] } : {}),
    });
    orderId = order.id;
  } catch (err) {
    fail(back, reason(err, "Couldn’t create the order."));
  }
  refreshStore();
  done(`/admin/orders/${orderId}`, "Order created. WooCommerce calculated the totals and reduced stock.");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireStaff();
  const orderId = parse(id, formData.get("id"), "/admin/orders");
  const back = `/admin/orders/${orderId}`;
  const status = parse(z.enum(ORDER_STATUS_VALUES), str(formData, "status"), back);
  try {
    await updateOrder(orderId, { status });
  } catch (err) {
    fail(back, reason(err, "Couldn’t update the order."));
  }
  refreshStore(); // cancel/refund restocks
  done(back, "Order status updated. WooCommerce has emailed the customer where applicable.");
}

export async function saveOrderDetailsAction(formData: FormData) {
  await requireStaff();
  const orderId = parse(id, formData.get("id"), "/admin/orders");
  const back = `/admin/orders/${orderId}`;
  const contact = parse(
    z.object({
      email: z.union([z.literal(""), z.email("Enter a valid email")]),
      phone: z.string().trim().regex(/^[+\d\s-]{0,20}$/, "Enter a valid phone number"),
    }),
    { email: str(formData, "email"), phone: str(formData, "phone") },
    back,
  );
  try {
    await updateOrder(orderId, {
      billing: { ...addressFrom(formData, ""), ...(contact.email ? { email: contact.email } : {}), phone: contact.phone },
      shipping: addressFrom(formData, ""),
      customer_note: str(formData, "customer_note").slice(0, 1000),
    });
  } catch (err) {
    fail(back, reason(err, "Couldn’t save the order details."));
  }
  refreshStore();
  done(back, "Customer and delivery details saved.");
}

export async function trashOrderAction(formData: FormData) {
  await requireStaff();
  const orderId = parse(id, formData.get("id"), "/admin/orders");
  try {
    await trashOrder(orderId);
  } catch (err) {
    fail(`/admin/orders/${orderId}`, reason(err, "Couldn’t delete the order."));
  }
  refreshStore();
  done("/admin/orders", "Order moved to the trash. It can be restored in WooCommerce for 30 days.");
}

export async function addOrderNoteAction(formData: FormData) {
  await requireStaff();
  const orderId = parse(id, formData.get("id"), "/admin/orders");
  const back = `/admin/orders/${orderId}`;
  const note = parse(z.string().trim().min(1, "Write a note first").max(2000), str(formData, "note"), back);
  const toCustomer = bool(formData, "to_customer");
  try {
    await addOrderNote(orderId, note, toCustomer);
  } catch (err) {
    fail(back, reason(err, "Couldn’t add the note."));
  }
  revalidateTag(ADMIN_TAG, { expire: 0 });
  done(back, toCustomer ? "Note sent to the customer." : "Private note added.");
}

export async function deleteOrderNoteAction(formData: FormData) {
  await requireStaff();
  const orderId = parse(id, formData.get("order_id"), "/admin/orders");
  const noteId = parse(id, formData.get("id"), `/admin/orders/${orderId}`);
  try {
    await deleteOrderNote(orderId, noteId);
  } catch (err) {
    fail(`/admin/orders/${orderId}`, reason(err, "Couldn’t delete the note."));
  }
  revalidateTag(ADMIN_TAG, { expire: 0 });
  done(`/admin/orders/${orderId}`, "Note deleted.");
}

// ── Customers ────────────────────────────────────────────────────────────

const customerForm = z.object({
  email: z.email("Enter a valid email"),
  first_name: z.string().trim().min(1, "Enter a first name").max(100),
  last_name: text(100),
  phone: z.string().trim().regex(/^[+\d\s-]{0,20}$/, "Enter a valid phone number"),
});

function readCustomer(fd: FormData) {
  const c = { email: str(fd, "email"), first_name: str(fd, "first_name"), last_name: str(fd, "last_name"), phone: str(fd, "phone") };
  return c;
}

export async function createCustomerAction(formData: FormData) {
  await requireStaff();
  const back = "/admin/customers/new";
  const c = parse(customerForm, readCustomer(formData), back);
  const address = addressFrom(formData, "");
  let customerId = 0;
  try {
    const created = await createCustomer({
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      billing: { ...address, first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone },
      shipping: { ...address, first_name: c.first_name, last_name: c.last_name },
    });
    customerId = created.id;
  } catch (err) {
    fail(back, reason(err, "Couldn’t create the customer."));
  }
  refreshStore();
  done(`/admin/customers/${customerId}`, "Customer created. WooCommerce has emailed them a link to set their password.");
}

export async function updateCustomerAction(formData: FormData) {
  await requireStaff();
  const customerId = parse(id, formData.get("id"), "/admin/customers");
  const back = `/admin/customers/${customerId}`;
  const c = parse(customerForm, readCustomer(formData), back);
  const address = addressFrom(formData, "");
  try {
    await updateCustomer(customerId, {
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      billing: { ...address, first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone },
      shipping: { ...address, first_name: c.first_name, last_name: c.last_name },
    });
  } catch (err) {
    fail(back, reason(err, "Couldn’t save the customer."));
  }
  refreshStore();
  done(back, "Customer saved.");
}

export async function deleteCustomerAction(formData: FormData) {
  await requireStaff();
  const customerId = parse(id, formData.get("id"), "/admin/customers");
  try {
    await deleteCustomer(customerId);
  } catch (err) {
    fail(`/admin/customers/${customerId}`, reason(err, "Couldn’t delete the customer."));
  }
  refreshStore();
  done("/admin/customers", "Customer account deleted. Their past orders are kept.");
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
  description: text(200),
  date_expires: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
  usage_limit: z.string().regex(/^\d{0,6}$/, "Max uses must be a whole number"),
  minimum_amount: price,
  free_shipping: z.boolean(),
});

function readCoupon(fd: FormData, back: string): CouponInput {
  const c = parse(
    couponForm,
    {
      ...Object.fromEntries(["code", "discount_type", "amount", "description", "date_expires", "usage_limit", "minimum_amount"].map((k) => [k, str(fd, k)])),
      free_shipping: bool(fd, "free_shipping"),
    },
    back,
  );
  if (c.discount_type === "percent" && Number(c.amount) > 100) fail(back, "A percentage discount can’t be over 100.");
  return {
    code: c.code.toLowerCase(),
    discount_type: c.discount_type,
    amount: c.amount,
    description: c.description,
    date_expires: c.date_expires || null,
    usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
    minimum_amount: c.minimum_amount,
    free_shipping: c.free_shipping,
  };
}

export async function createCouponAction(formData: FormData) {
  await requireStaff();
  const data = readCoupon(formData, "/admin/coupons");
  try {
    await createCoupon(data);
  } catch (err) {
    fail("/admin/coupons", reason(err, "Couldn’t create the code."));
  }
  revalidateTag(ADMIN_TAG, { expire: 0 });
  done("/admin/coupons", `Discount code ${data.code!.toUpperCase()} created.`);
}

export async function updateCouponAction(formData: FormData) {
  await requireStaff();
  const couponId = parse(id, formData.get("id"), "/admin/coupons");
  const back = `/admin/coupons/${couponId}`;
  const data = readCoupon(formData, back);
  try {
    await updateCoupon(couponId, data);
  } catch (err) {
    fail(back, reason(err, "Couldn’t save the code."));
  }
  revalidateTag(ADMIN_TAG, { expire: 0 });
  done("/admin/coupons", `Discount code ${data.code!.toUpperCase()} saved.`);
}

export async function deleteCouponAction(formData: FormData) {
  await requireStaff();
  const couponId = parse(id, formData.get("id"), "/admin/coupons");
  try {
    await deleteCoupon(couponId);
  } catch (err) {
    fail("/admin/coupons", reason(err, "Couldn’t delete the code."));
  }
  revalidateTag(ADMIN_TAG, { expire: 0 });
  done("/admin/coupons", "Discount code deleted.");
}

// ── Site content & pages ─────────────────────────────────────────────────

export async function saveContentAction(formData: FormData) {
  await requireStaff();
  const content: Record<string, Record<string, string>> = {};
  for (const section of CONTENT_SECTIONS) {
    for (const f of section.fields) {
      const raw = f.type === "checkbox" ? (bool(formData, `${section.key}.${f.key}`) ? "1" : "") : str(formData, `${section.key}.${f.key}`);
      if (raw.length > 2000) fail("/admin/content", `“${f.label}” is too long.`);
      if (raw) (content[section.key] ??= {})[f.key] = raw;
    }
  }
  try {
    await saveRawContent(content);
  } catch (err) {
    fail("/admin/content", reason(err, "Couldn’t save."));
  }
  revalidateTag(CONTENT_TAG, { expire: 0 });
  done("/admin/content", "Saved. The website is updated.");
}

const pageForm = z.object({
  slug: z.string().refine((s) => s in DEFAULT_PAGES, "Unknown page"),
  title: text(200),
  description: text(300),
  eyebrow: text(200),
  lead: text(300),
  status: z.enum(["draft", "approved"]),
  body: z.string().max(20000),
});

export async function savePageAction(formData: FormData) {
  await requireStaff();
  const restore = formData.get("restore") === "1";
  const slug = str(formData, "slug");
  const p = parse(pageForm, Object.fromEntries(["slug", "title", "description", "eyebrow", "lead", "status", "body"].map((k) => [k, str(formData, k)])), `/admin/pages/${encodeURIComponent(slug)}`);

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
    (["title", "description", "eyebrow", "lead", "status", "body"] as const).filter((k) => p[k] !== "" && norm(p[k]) !== norm(defaults[k])).map((k) => [k, norm(p[k])]),
  );
  try {
    await saveRawPage(p.slug, restore || Object.keys(changed).length === 0 ? null : changed);
  } catch (err) {
    fail(`/admin/pages/${p.slug}`, reason(err, "Couldn’t save."));
  }
  revalidateTag(CONTENT_TAG, { expire: 0 });
  done(`/admin/pages/${p.slug}`, restore ? "Restored the standard text." : "Saved. The website is updated.");
}
