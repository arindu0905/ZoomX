import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { savePageAction } from "@/app/admin/actions";
import { AdminButton, AdminLinkButton, Card, Field, inputClass, Notice, PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { DEFAULT_PAGES, getContentPage, POLICY_SLUGS, sectionsToText } from "@/services/wordpress/pages";
/** Live per request behind the staff check; not validated for instant navigation (see ../layout.tsx). */export const instant = false;

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPage({ params, searchParams }: PageProps<"/admin/pages/[slug]">) {
  await requireStaff();
  const { slug } = await params;
  if (!(slug in DEFAULT_PAGES)) notFound();
  const sp = await searchParams;
  // The page as the website shows it now (edits merged over the standard text).
  const page = (await getContentPage(slug))!;
  const path = POLICY_SLUGS.includes(slug) ? `/policies/${slug}` : `/${slug}`;
  const edited = JSON.stringify(page) !== JSON.stringify(DEFAULT_PAGES[slug]);

  return (
    <>
      <PageHeader
        title={page.title}
        back={{ href: "/admin/pages", label: "Pages" }}
        actions={
          <AdminLinkButton href={path} target="_blank">
            View on website
          </AdminLinkButton>
        }
      />
      <Notice saved={typeof sp.saved === "string" ? sp.saved : undefined} error={typeof sp.error === "string" ? sp.error : undefined} />
      <form action={savePageAction} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <input type="hidden" name="slug" value={slug} />
        <Card>
          <div className="flex flex-col gap-4">
            <Field label="Headline">
              <input name="lead" defaultValue={page.lead ?? ""} maxLength={300} className={inputClass} />
            </Field>
            <Field
              label="Page text"
              hint="## Heading starts a section · - text makes a bullet point · leave a blank line between paragraphs. Replace any [bracketed] notes before approving."
            >
              <textarea name="body" rows={24} defaultValue={sectionsToText(page.sections)} maxLength={20000} className={`${inputClass} font-mono text-[13px] leading-relaxed`} />
            </Field>
          </div>
        </Card>
        <div className="flex flex-col gap-6">
          <Card title="Status">
            <div className="flex flex-col gap-3">
              <select name="status" defaultValue={page.status === "draft" ? "draft" : "approved"} className={inputClass} aria-label="Status">
                <option value="draft">Draft — shows a notice, hidden from Google</option>
                <option value="approved">Approved — published normally</option>
              </select>
              <AdminButton>Save and update website</AdminButton>
              {edited && (
                <AdminButton variant="secondary" name="restore" value="1" formNoValidate>
                  Restore standard text
                </AdminButton>
              )}
            </div>
          </Card>
          <Card title="Search & heading">
            <div className="flex flex-col gap-4">
              <Field label="Page title" hint="Browser tab, Google and breadcrumbs.">
                <input name="title" defaultValue={page.title} maxLength={200} className={inputClass} />
              </Field>
              <Field label="Search description">
                <textarea name="description" rows={3} defaultValue={page.description} maxLength={300} className={inputClass} />
              </Field>
              <Field label="Small line above the headline">
                <input name="eyebrow" defaultValue={page.eyebrow ?? ""} maxLength={200} className={inputClass} />
              </Field>
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
