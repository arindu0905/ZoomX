import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageHeader, TableCard } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { getContentPages, POLICY_SLUGS } from "@/services/wordpress/pages";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesList() {
  await requireStaff();
  const pages = await getContentPages();
  return (
    <>
      <PageHeader title="Pages" />
      <TableCard>
        <thead>
          <tr>
            <th>Page</th>
            <th>Address</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pages).map(([slug, p]) => {
            const path = POLICY_SLUGS.includes(slug) ? `/policies/${slug}` : `/${slug}`;
            return (
              <tr key={slug} className="hover:bg-canvas-alt/60">
                <td>
                  <Link href={`/admin/pages/${slug}`} className="font-semibold hover:underline">
                    {p.title}
                  </Link>
                </td>
                <td className="text-ink-muted">{path}</td>
                <td>
                  <Badge status={p.status === "draft" ? "draft" : "publish"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>
    </>
  );
}
