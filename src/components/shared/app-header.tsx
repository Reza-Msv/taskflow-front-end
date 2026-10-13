"use client";

import React from "react";
import { Menu, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useUiStore } from "@/stores/ui-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppSidebar } from "@/components/shared/app-sidebar";

export function AppHeader({
  title,
  actions,
}: {
  title?: string;
  actions?: React.ReactNode;
}) {
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

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
