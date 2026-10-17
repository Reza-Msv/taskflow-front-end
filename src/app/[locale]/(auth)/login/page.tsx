import type { Metadata } from "next";
import { LoginPage } from "@/components/pages/login-page";

export const metadata: Metadata = {
  title: "Sign In — TaskFlow",
  description: "Sign in to access your TaskFlow projects, teams, and sprints.",
};

export default function RouteLoginPage() {
  return <LoginPage />;
}
