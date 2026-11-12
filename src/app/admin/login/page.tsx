import type { Metadata } from "next";
import { Suspense } from "react";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-[#f1f1f1] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-canvas p-8 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <p className="text-sm font-semibold tracking-tight">
          ZOOM X <span className="font-normal text-ink-muted">Admin</span>
        </p>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">For the ZOOM X team. Use your shop manager login.</p>
        <Suspense>
          <LoginError searchParams={searchParams} />
        </Suspense>
        <form action={loginAction} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email or username
            <input
              name="email"
              autoComplete="username"
              required
              className="rounded-lg px-3 py-2.5 font-normal shadow-[inset_0_0_0_1px_var(--color-line)] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-brand-strong)]"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg px-3 py-2.5 font-normal shadow-[inset_0_0_0_1px_var(--color-line)] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-brand-strong)]"
            />
          </label>
          <button type="submit" className="mt-2 min-h-11 rounded-lg bg-[#1a1a1a] text-sm font-semibold text-white hover:bg-black">
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}

async function LoginError({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const error = (await searchParams).error;
  if (typeof error !== "string") return null;
  return (
    <p role="alert" className="mt-4 rounded-lg bg-[#fdecec] px-3 py-2.5 text-sm text-danger">
      {error.slice(0, 200)}
    </p>
  );
}
