"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginFormData } from "../schemas/auth-schemas";
import { useAuth } from "../context/auth-context";
import { AuthErrorBanner } from "./auth-error-banner";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError } from "@/services/api-client";

export function LoginForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = pathname?.split("/")[1] || "en";
  const redirectParam = searchParams.get("redirect");
  const isRegistered = searchParams.get("registered") === "true";

  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
      const safePath = getSafeRedirectPath(redirectParam, currentLocale);
      router.push(safePath);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Failed to sign in. Please verify your connection.");
      }
    }
  };

  const registerHref = `/${currentLocale}/register${
    redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""
  }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Registration Success Alert Banner */}
      {isRegistered && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:border-emerald-500/50 dark:text-emerald-400"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold">
              {currentLocale === "fa"
                ? "حساب کاربری ایجاد شد: "
                : "Account created: "}
            </span>
            {currentLocale === "fa"
              ? "حساب کاربری شما با موفقیت ایجاد شد. لطفاً برای ادامه وارد شوید."
              : "Your account was created successfully. Please sign in to continue."}
          </div>
        </div>
      )}

      {/* Server Error Alert Banner */}
      {serverError && (
        <AuthErrorBanner title="Sign in failed" message={serverError} />
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <Label htmlFor="login-email" className="text-xs font-medium">
          {currentLocale === "fa" ? "آدرس ایمیل" : "Email Address"}
        </Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="name@company.com"
          className="h-10 bg-input-background/60"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p
            id="login-email-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-xs font-medium">
            {currentLocale === "fa" ? "رمز عبور" : "Password"}
          </Label>
          <Link
            href={`/${currentLocale}/forgot-password`}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary hover:underline"
          >
            {currentLocale === "fa"
              ? "رمز عبور را فراموش کرده‌اید؟"
              : "Forgot Password?"}
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10 bg-input-background/60 pr-10 rtl:pl-10 rtl:pr-3"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "login-password-error" : undefined
            }
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rtl:left-3 rtl:right-auto"
            aria-label={
              showPassword
                ? currentLocale === "fa"
                  ? "پنهان کردن رمز عبور"
                  : "Hide password"
                : currentLocale === "fa"
                  ? "نمایش رمز عبور"
                  : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id="login-password-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Primary Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 w-full font-semibold shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
            <span>
              {currentLocale === "fa" ? "در حال ورود..." : "Signing in..."}
            </span>
          </>
        ) : (
          <span>{currentLocale === "fa" ? "ورود به حساب" : "Sign In"}</span>
        )}
      </Button>

      {/* Footer Switch to Register */}
      <div className="pt-2 text-center text-xs text-muted-foreground">
        <span>
          {currentLocale === "fa"
            ? "حساب کاربری ندارید؟ "
            : "Don't have an account? "}
        </span>
        <Link
          href={registerHref}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {currentLocale === "fa" ? "ثبت نام کنید" : "Sign up"}
        </Link>
      </div>
    </form>
  );
}
