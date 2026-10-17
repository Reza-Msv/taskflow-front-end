"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterFormData } from "../schemas/auth-schemas";
import { useAuth } from "../context/auth-context";
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
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser(data);
      toast.success(
        currentLocale === "fa"
          ? "حساب کاربری شما با موفقیت ایجاد شد. لطفاً وارد شوید."
          : "Account created successfully! Please sign in with your credentials."
      );
      const loginUrl = `/${currentLocale}/login?registered=true${
        redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ""
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
            <span className="font-semibold">Registration failed: </span>
            {serverError}
          </div>
        </div>
      )}

      {/* Full Name Field */}
      <div className="space-y-1.5">
        <Label htmlFor="register-full-name" className="text-xs font-medium">
          {currentLocale === "fa" ? "نام و نام خانوادگی" : "Full Name"}
        </Label>
        <Input
          id="register-full-name"
          type="text"
          autoComplete="name"
          placeholder={currentLocale === "fa" ? "علی محمدی" : "John Doe"}
          aria-invalid={Boolean(errors.full_name)}
          aria-describedby={
            errors.full_name ? "register-full-name-error" : undefined
          }
          {...register("full_name")}
        />
        {errors.full_name && (
          <p
            id="register-full-name-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.full_name.message}
          </p>
        )}
      </div>

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
            className="pr-10 rtl:pl-10 rtl:pr-3"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "register-password-error" : undefined
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
        <Input
          id="register-confirm-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword
              ? "register-confirm-password-error"
              : undefined
          }
          {...register("confirmPassword")}
        />
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
              {currentLocale === "fa"
                ? "در حال ایجاد حساب..."
                : "Creating account..."}
            </span>
          </>
        ) : (
          <span>{currentLocale === "fa" ? "ثبت نام" : "Create Account"}</span>
        )}
      </Button>

      {/* Switch to Login */}
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
    </form>
  );
}
