import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createXcanRouteMetadata } from "@/lib/xcan/route-metadata";

export const metadata: Metadata = createXcanRouteMetadata("schedule");

export default function ScheduleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
