"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { LoginForm } from "@/modules/auth/components/login-form";
import { GuestGuard } from "@/modules/auth/components/guest-guard";

export function LoginPage() {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  const title = currentLocale === "fa" ? "ورود به حساب کاربری" : "Welcome back";
  const subtitle =
    currentLocale === "fa"
      ? "برای دسترسی به فضاهای کاری و اسپرینت‌های فعال وارد شوید"
      : "Sign in to access your workspaces and active sprints";

  return (
    <GuestGuard>
      <AuthCard title={title} subtitle={subtitle}>
        <LoginForm />
      </AuthCard>
    </GuestGuard>
  );
}
