"use client";

import { useRouter } from "next/navigation";
import { TOKEN_COOKIE } from "@/lib/api";
import { Chevron } from "@/components/ui";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  function logout() {
    document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
    router.push("/");
    router.refresh();
  }
  return (
    <button onClick={logout} className={className}>
      <Chevron direction="left" className="me-1" /> Sign out
    </button>
  );
}
