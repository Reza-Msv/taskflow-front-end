"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginFormData } from "../schemas/auth-schemas";
import { useAuth } from "../context/auth-context";
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
      {/* Server Error Alert Banner */}
      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive dark:border-destructive/50"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold">Sign in failed: </span>
            {serverError}
          </div>
        </div>
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
          placeholder={
            currentLocale === "fa" ? "name@company.com" : "name@company.com"
          }
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
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-10 rtl:pl-10 rtl:pr-3"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "login-password-error" : undefined
            }
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rtl:left-3 rtl:right-auto"
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

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full font-semibold shadow-sm"
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

      {/* Switch to Register */}
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
