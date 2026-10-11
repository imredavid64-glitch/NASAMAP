"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210"
);

function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return (
    <ConvexProviderWithAuth client={convex} useAuth={() => auth}>
      {children}
    </ConvexProviderWithAuth>
  );
}

export function ConvexProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}