import type { Metadata } from "next";
import { MyTasksPage } from "@/components/pages";

export const metadata: Metadata = {
  title: "My Tasks — TaskFlow",
  description:
    "View and manage all tasks assigned to you across projects and workspaces with smart filtering, sorting, and status tracking.",
};

export default function Page() {
  return <MyTasksPage />;
}
