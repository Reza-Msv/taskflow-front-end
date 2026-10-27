import type { Metadata } from "next";
import { ReportsPage } from "@/components/pages";

export const metadata: Metadata = {
  title: "Reports & Analytics — TaskFlow",
  description:
    "Comprehensive project metrics, time-series velocity trends, sprint burndown, and team workload distribution.",
};

export default function Page() {
  return <ReportsPage />;
}
