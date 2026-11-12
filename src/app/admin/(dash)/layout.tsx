import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/services/admin/session";
import Loading from "./loading";

/** Per-request staff check; navigations here may block (see ../layout.tsx). */
export const instant = false;

/**
 * Every admin screen except sign-in. The shell renders instantly; only the
 * staff name and the page wait on the per-request WordPress staff check, so
 * nothing admin-only is shown before it passes.
 */
export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminShell
      staffName={
        <Suspense fallback={null}>
          <StaffName />
        </Suspense>
      }
    >
      <Suspense fallback={<Loading />}>
        <Gate>{children}</Gate>
      </Suspense>
    </AdminShell>
  );
}

async function StaffName() {
  return (await requireStaff()).name;
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return children;
}
