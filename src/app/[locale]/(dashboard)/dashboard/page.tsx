import type { Metadata } from "next";
import { DashboardPage } from "@/components/pages";

export const metadata: Metadata = {
  title: "Dashboard — TaskFlow",
  description:
    "User dashboard overview, assigned tasks, deadlines, and activity stream.",
};

export default function Page() {
  return <DashboardPage />;
}
