import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createXcanRouteMetadata } from "@/lib/xcan/route-metadata";

export const metadata: Metadata = createXcanRouteMetadata("ccm");

export default function CcmLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
