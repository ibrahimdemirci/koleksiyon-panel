"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut({
        callbackUrl: "/login",
      });
    });
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
    </Button>
  );
}

