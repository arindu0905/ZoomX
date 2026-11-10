"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

/**
 * Posts the server-signed form to PayHere. Submits automatically; the visible
 * button is the fallback (and the only path without JavaScript).
 */
export function PayHereRedirect({ action, fields }: { action: string; fields: Record<string, string> }) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.submit(), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <form ref={ref} method="post" action={action} className="flex flex-col items-center gap-4">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" size="lg">
        Continue to PayHere
      </Button>
    </form>
  );
}
