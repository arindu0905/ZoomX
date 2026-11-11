import Link from "next/link";
import type { Announcement } from "@/lib/site";

/**
 * Slim promotional / delivery message above the navigation.
 * Renders nothing unless the client has approved a message in `site.announcement`.
 */
export function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  if (!announcement) return null;
  return (
    <aside aria-label="Announcement" className="bg-brand-strong text-center text-caption tracking-[0.08em] text-white">
      <p className="mx-auto max-w-page px-gutter py-2.5">
        {announcement.message}
        {announcement.link && (
          <>
            {" "}
            <Link href={announcement.link.href} className="font-semibold underline underline-offset-[0.3em] hover:decoration-2">
              {announcement.link.label}
            </Link>
          </>
        )}
      </p>
    </aside>
  );
}
