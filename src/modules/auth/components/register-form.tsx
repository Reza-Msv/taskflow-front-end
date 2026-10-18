"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterFormData } from "../schemas/auth-schemas";
import { useAuth } from "../context/auth-context";
import { AuthErrorBanner } from "./auth-error-banner";
import { AuthLegalFooter } from "./auth-legal-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError } from "@/services/api-client";

export function RegisterForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = pathname?.split("/")[1] || "en";
  const redirectParam = searchParams.get("redirect");

  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const payload = {
        ...data,
        full_name: data.full_name?.trim() || data.email.split("@")[0],
      };
      await registerUser(payload);
      toast.success(
        currentLocale === "fa"
          ? "حساب کاربری شما با موفقیت ایجاد شد. لطفاً وارد شوید."
          : "Account created successfully! Please sign in with your credentials."
      );
      const loginUrl = `/${currentLocale}/login${
        redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""
      }`;
      router.push(loginUrl);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError(
          "Failed to create account. Please verify your connection."
        );
      }
    }
  };

  const loginHref = `/${currentLocale}/login${
    redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""
  }`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(onSubmit)(e);
      }}
      className="space-y-4"
      noValidate
    >
      {/* Server Error Alert Banner */}
      {serverError && (
        <AuthErrorBanner title="Registration failed" message={serverError} />
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <Label htmlFor="register-email" className="text-xs font-medium">
          {currentLocale === "fa" ? "آدرس ایمیل" : "Email Address"}
        </Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="name@company.com"
          className="h-10 bg-input-background/60"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p
            id="register-email-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <Label htmlFor="register-password" className="text-xs font-medium">
          {currentLocale === "fa" ? "رمز عبور" : "Password"}
        </Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-10 bg-input-background/60 pr-10 rtl:pl-10 rtl:pr-3"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "register-password-error" : undefined
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
            id="register-password-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <Label
          htmlFor="register-confirm-password"
          className="text-xs font-medium"
        >
          {currentLocale === "fa" ? "تکرار رمز عبور" : "Confirm Password"}
        </Label>
        <div className="relative">
          <Input
            id="register-confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-10 bg-input-background/60 pr-10 rtl:pl-10 rtl:pr-3"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword
                ? "register-confirm-password-error"
                : undefined
            }
            {...register("confirmPassword")}
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
        {errors.confirmPassword && (
          <p
            id="register-confirm-password-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.confirmPassword.message}
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
              {currentLocale === "fa"
                ? "در حال ایجاد حساب..."
                : "Creating account..."}
            </span>
          </>
        ) : (
          <span>{currentLocale === "fa" ? "ثبت نام" : "Create Account"}</span>
        )}
      </Button>

      {/* Footer Switch to Login */}
      <div className="pt-2 text-center text-xs text-muted-foreground">
        <span>
          {currentLocale === "fa"
            ? "قبلاً ثبت نام کرده‌اید؟ "
            : "Already have an account? "}
        </span>
        <Link
          href={loginHref}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {currentLocale === "fa" ? "وارد شوید" : "Sign in"}
        </Link>
      </div>

      {/* Secondary Legal Links */}
      <AuthLegalFooter currentLocale={currentLocale} />
    </form>
  );
}
