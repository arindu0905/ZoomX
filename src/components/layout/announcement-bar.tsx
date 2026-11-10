import Link from "next/link";
import type { Announcement } from "@/lib/site";

/**
 * Slim promotional / delivery message above the navigation.
 * Renders nothing unless the client has approved a message in `site.announcement`.
 */
export function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  if (!announcement) return null;
  return (
    <aside aria-label="Announcement" className="bg-canvas-alt text-center text-caption text-ink">
      <p className="mx-auto max-w-page px-gutter py-2.5">
        {announcement.message}
        {announcement.link && (
          <>
            {" "}
            <Link href={announcement.link.href} className="text-brand-strong underline-offset-4 hover:underline">
              {announcement.link.label}
            </Link>
          </>
        )}
      </p>
    </aside>
  );
}
