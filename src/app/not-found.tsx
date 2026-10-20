import "@/styles/globals.css";
import { NotFoundPage } from "@/components/pages";
import { ThemeProvider } from "@/components/shared/theme-provider";

export default function RootNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NotFoundPage />
        </ThemeProvider>
      </body>
    </html>
  );
}
