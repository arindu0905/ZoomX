import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/utils/cn";
import logo from "../../../public/logo/zoomx-logo.webp";

/**
 * Official ZoomX "by Wills" logo (raster, 1087×642, from zoomx.lk).
 * Replace with the master SVG once supplied by the client.
 */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label={`${site.name} home`} className={cn("inline-flex shrink-0", className)}>
      <Image src={logo} alt="" priority={priority} sizes="(min-width: 0px) 160px" className="h-full w-auto" />
    </Link>
  );
}
