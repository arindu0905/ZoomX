"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm, type FieldValues, type Resolver } from "react-hook-form";
import type { z } from "zod";
import { TextField } from "@/components/checkout/fields";
import { Button } from "@/components/ui/button";
import {
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
  trackSchema,
  type LoginInput,
  type RegisterInput,
  type TrackInput,
} from "@/lib/account-schema";
import { sendJson } from "@/lib/client-api";

/** Shared submit wiring: validation, pending state, one accessible error message. */
function useApiForm<S extends z.ZodType<FieldValues, FieldValues>>(schema: S) {
  const form = useForm<z.input<S>, unknown, z.output<S>>({
    resolver: zodResolver(schema as never) as Resolver<z.input<S>, unknown, z.output<S>>,
    mode: "onTouched",
  });
  const [error, setError] = useState<string | null>(null);
  return { form, error, setError };
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-[#fdecec] px-4 py-3 text-body text-danger">
      {message}
    </p>
  );
}

function Shell({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {children}
    </form>
  );
}

export function LoginForm({ next = "/account" }: { next?: string }) {
  const router = useRouter();
  const { form, error, setError } = useApiForm(loginSchema);
  const { register, handleSubmit, formState } = form;
  const e = formState.errors as Partial<Record<keyof LoginInput, { message?: string }>>;

  return (
    <Shell
      onSubmit={handleSubmit(async (data) => {
        setError(null);
        const r = await sendJson("/api/auth/login", "POST", data);
        if (!r.ok) return setError(r.message);
        router.replace(next);
        router.refresh(); // signed-in state is server-rendered
      })}
    >
      <TextField label="Email" type="email" autoComplete="username" error={e.email?.message} {...register("email")} />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={e.password?.message}
        {...register("password")}
      />
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <Link href="/account/forgot" className="text-center text-body text-brand-strong hover:underline">
        Forgot your password?
      </Link>
    </Shell>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { form, error, setError } = useApiForm(registerSchema);
  const { register, handleSubmit, formState } = form;
  const e = formState.errors as Partial<Record<keyof RegisterInput, { message?: string }>>;

  return (
    <Shell
      onSubmit={handleSubmit(async (data) => {
        setError(null);
        const r = await sendJson("/api/auth/register", "POST", data);
        if (!r.ok) return setError(r.message);
        router.replace("/account");
        router.refresh();
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          autoComplete="given-name"
          error={e.firstName?.message}
          {...register("firstName")}
        />
        <TextField label="Last name" autoComplete="family-name" error={e.lastName?.message} {...register("lastName")} />
      </div>
      <TextField label="Email" type="email" autoComplete="email" error={e.email?.message} {...register("email")} />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={e.password?.message}
        {...register("password")}
      />
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </Shell>
  );
}

export function ForgotForm() {
  const { form, error, setError } = useApiForm(forgotSchema);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = form;

  if (sent) {
    return (
      <p role="status" className="rounded-2xl bg-brand-tint px-5 py-4 text-body text-brand-strong">
        If an account exists for that email, we’ve sent a link to reset your password. Check your inbox.
      </p>
    );
  }
  return (
    <Shell
      onSubmit={handleSubmit(async (data) => {
        setError(null);
        const r = await sendJson("/api/auth/forgot", "POST", data);
        if (!r.ok) return setError(r.message);
        setSent(true);
      })}
    >
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={formState.errors.email?.message as string | undefined}
        {...register("email")}
      />
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={formState.isSubmitting}>
        Send reset link
      </Button>
    </Shell>
  );
}

export function ResetForm({ login, resetKey }: { login: string; resetKey: string }) {
  const { form, error, setError } = useApiForm(resetSchema);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState } = form;

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-2xl bg-brand-tint px-5 py-4 text-body text-brand-strong">
          Your password has been changed.
        </p>
        <Link href="/account" className="text-center text-body text-brand-strong hover:underline">
          Sign in
        </Link>
      </div>
    );
  }
  return (
    <Shell
      onSubmit={handleSubmit(async (data) => {
        setError(null);
        const r = await sendJson("/api/auth/reset", "POST", data);
        if (!r.ok) return setError(r.message);
        setDone(true);
      })}
    >
      <input type="hidden" value={login} {...register("login")} />
      <input type="hidden" value={resetKey} {...register("key")} />
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={formState.errors.password?.message as string | undefined}
        {...register("password")}
      />
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={formState.isSubmitting}>
        Set new password
      </Button>
    </Shell>
  );
}

export function TrackForm() {
  const router = useRouter();
  const { form, error, setError } = useApiForm(trackSchema);
  const { register, handleSubmit, formState } = form;
  const e = formState.errors as Partial<Record<keyof TrackInput, { message?: string }>>;

  return (
    <Shell
      onSubmit={handleSubmit(async (data) => {
        setError(null);
        const r = await sendJson<{ next: string }>("/api/orders/track", "POST", data);
        if (!r.ok) return setError(r.message);
        router.push(r.data.next);
      })}
    >
      <TextField
        label="Order number"
        inputMode="numeric"
        placeholder="e.g. 1024"
        hint="It’s in your order confirmation email."
        error={e.orderNumber?.message}
        {...register("orderNumber")}
      />
      <TextField
        label="Email used for the order"
        type="email"
        autoComplete="email"
        error={e.email?.message}
        {...register("email")}
      />
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Finding your order…" : "Track order"}
      </Button>
    </Shell>
  );
}
