"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { RegisterForm } from "@/modules/auth/components/register-form";
import { GuestGuard } from "@/modules/auth/components/guest-guard";

export function RegisterPage() {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  const title =
    currentLocale === "fa" ? "ایجاد حساب کاربری" : "Create your account";
  const subtitle =
    currentLocale === "fa"
      ? "سازماندهی پروژه‌ها و جریان‌های کاری را با تسک‌فلو آغاز کنید"
      : "Start organizing projects and workflows with TaskFlow";

  return (
    <GuestGuard>
      <AuthCard title={title} subtitle={subtitle}>
        <RegisterForm />
      </AuthCard>
    </GuestGuard>
  );
}
