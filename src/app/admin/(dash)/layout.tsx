import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/services/admin/session";

/** Every admin screen except sign-in. Staff status is re-checked with WordPress on each request. */
export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f1f1f1]" />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return <AdminShell staffName={staff.name}>{children}</AdminShell>;
}
