import type { Metadata } from "next";
import { saveContentAction } from "@/app/admin/actions";
import { AdminButton, Card, Field, inputClass, Notice, PageHeader } from "@/components/admin/ui";
import { CONTENT_SECTIONS, getRawContent } from "@/services/admin/content";
import { requireStaff } from "@/services/admin/session";
import { DEFAULT_CONTENT } from "@/services/wordpress/content";
/** Live per request behind the staff check; not validated for instant navigation (see ../layout.tsx). */export const instant = false;

export const metadata: Metadata = { title: "Site content" };

/** Placeholder = the website's standard text, so staff see what an empty box means. */
function standardText(section: string, field: string): string {
  const c = DEFAULT_CONTENT as unknown as Record<string, Record<string, unknown> | null>;
  const s = c[section];
  if (!s) return "";
  const [base, sub] = field.split("_");
  const v = s[field] ?? s[base];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    const idx = Number(sub) - 1;
    if (field.match(/_\d+_(title|body)$/) && v[idx]) return String((v[idx] as Record<string, string>)[field.endsWith("title") ? "title" : "body"] ?? "");
    return v.filter((x) => typeof x === "string").join("\n");
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, string>;
    return field.endsWith("_label") ? (o.label ?? "") : field.endsWith("_href") ? (o.href ?? "") : "";
  }
  if (section === "announcement" && field === "link_label") return (s.link as { label?: string } | undefined)?.label ?? "";
  if (section === "announcement" && field === "link_href") return (s.link as { href?: string } | undefined)?.href ?? "";
  return "";
}

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  await requireStaff();
  const sp = await searchParams;
  let raw: Record<string, Record<string, string>> = {};
  let loadError = "";
  try {
    raw = await getRawContent();
  } catch {
    loadError = "Couldn’t load the saved text. Saving now would replace it, so please refresh and try again.";
  }

  return (
    <>
      <PageHeader title="Site content" />
      <p className="-mt-3 mb-5 text-sm text-ink-muted">
        Homepage text and the announcement bar. <strong className="text-ink">Leave a box empty to keep the standard text</strong>{" "}
        (shown in grey). Only publish claims the business can back up.
      </p>
      <Notice saved={typeof sp.saved === "string" ? sp.saved : undefined} error={loadError || (typeof sp.error === "string" ? sp.error : undefined)} />
      <form action={saveContentAction} className="flex flex-col gap-6">
        {CONTENT_SECTIONS.map((section) => (
          <Card key={section.key} title={section.title}>
            {section.help && <p className="-mt-2 mb-4 text-xs text-ink-muted">{section.help}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((f) => {
                const name = `${section.key}.${f.key}`;
                const value = raw[section.key]?.[f.key] ?? "";
                const placeholder = standardText(section.key, f.key);
                if (f.type === "checkbox")
                  return (
                    <label key={name} className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input type="checkbox" name={name} defaultChecked={value === "1"} /> {f.label}
                    </label>
                  );
                const wide = f.type === "textarea" || f.type === "lines";
                return (
                  <div key={name} className={wide ? "sm:col-span-2" : undefined}>
                    <Field label={f.label} hint={f.help}>
                      {wide ? (
                        <textarea name={name} rows={f.type === "lines" ? 4 : 2} defaultValue={value} placeholder={placeholder} maxLength={2000} className={inputClass} />
                      ) : (
                        <input name={name} defaultValue={value} placeholder={placeholder} maxLength={2000} className={inputClass} />
                      )}
                    </Field>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
        <div className="sticky bottom-4 flex justify-end">
          <AdminButton disabled={!!loadError} className="shadow-lg">
            Save and update website
          </AdminButton>
        </div>
      </form>
    </>
  );
}
