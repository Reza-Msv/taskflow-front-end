import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { defaultLocale, locales } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  const currentLocale = locale || defaultLocale;
  if (!locales.includes(currentLocale as any)) notFound();

  return {
    locale: currentLocale,
    messages: (await import(`../messages/${currentLocale}.json`)).default,
  };
});
