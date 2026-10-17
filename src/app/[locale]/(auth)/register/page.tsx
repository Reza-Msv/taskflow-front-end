import type { Metadata } from "next";
import { RegisterPage } from "@/components/pages/register-page";

export const metadata: Metadata = {
  title: "Create Account — TaskFlow",
  description:
    "Create your TaskFlow account to manage projects, agile sprints, and team boards.",
};

export default function RouteRegisterPage() {
  return <RegisterPage />;
}
