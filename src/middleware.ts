import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/i18n/routing";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  matcher: ["/", "/(fa|en)/:path*"],
};
