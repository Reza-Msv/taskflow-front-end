import React from "react";
import Link from "next/link";

interface AuthLegalFooterProps {
  currentLocale: string;
}

export function AuthLegalFooter({ currentLocale }: AuthLegalFooterProps) {
  return (
    <div className="pt-1 text-center text-[11px] text-muted-foreground">
      {currentLocale === "fa" ? (
        <p>
          با ایجاد حساب کاربری، با{" "}
          <Link
            href="#terms"
            className="underline underline-offset-4 hover:text-foreground"
          >
            شرایط خدمات
          </Link>{" "}
          و{" "}
          <Link
            href="#privacy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            حریم خصوصی
          </Link>{" "}
          موافقت می‌کنید.
        </p>
      ) : (
        <p>
          By creating an account, you agree to our{" "}
          <Link
            href="#terms"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="#privacy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </div>
  );
}
