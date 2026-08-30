import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createXcanRouteMetadata } from "@/lib/xcan/route-metadata";

export const metadata: Metadata = createXcanRouteMetadata("livingLife");

export default function LivingLifeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
