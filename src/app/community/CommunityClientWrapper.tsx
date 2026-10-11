"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConvexAnonProvider } from "@/components/convex-anon-provider";
import { CommunityClient } from "./CommunityClient";

export function CommunityClientWrapper() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force dynamic rendering by using searchParams
  void searchParams;

  if (!mounted) {
    return null;
  }

  return (
    <ConvexAnonProvider>
      <CommunityClient />
    </ConvexAnonProvider>
  );
}