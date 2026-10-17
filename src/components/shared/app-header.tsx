"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, Bell, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useUiStore } from "@/stores/ui-store";
import { useAuth } from "@/modules/auth/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { toast } from "sonner";

export function AppHeader({
  title,
  actions,
}: {
  title?: string;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUiStore();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(
        currentLocale === "fa"
          ? "با موفقیت از حساب کاربری خارج شدید"
          : "Logged out successfully"
      );
      router.push(`/${currentLocale}/login`);
    } catch {
      router.push(`/${currentLocale}/login`);
    }
  };

  const userInitial = (
    user?.name?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open mobile navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {title && (
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {title}
            </h1>
          )}
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2">
          {actions}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Search items"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </Button>
          <ThemeToggle />

          {/* User Profile / Logout or Sign In */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full p-0"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-foreground">
                      {user.name || "TaskFlow User"}
                    </p>
                    <p className="truncate text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${currentLocale}/settings`}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {currentLocale === "fa"
                        ? "تنظیمات حساب"
                        : "Account Settings"}
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex cursor-pointer items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>
                    {currentLocale === "fa" ? "خروج از حساب" : "Log Out"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold"
            >
              <Link href={`/${currentLocale}/login`}>
                {currentLocale === "fa" ? "ورود" : "Sign In"}
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="border-r border-border p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <AppSidebar isMobile onNavClick={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
