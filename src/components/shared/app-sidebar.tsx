"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  Kanban,
  Layers,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Workflow,
  Plus,
  ShieldCheck,
  LayoutDashboard,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { useAuth } from "@/modules/auth/context/auth-context";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Kanban Board",
    href: "/projects/default/board",
    icon: Kanban,
  },
  {
    title: "Backlog & Sprints",
    href: "/projects/default/backlog",
    icon: Layers,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const adminNavItems: NavItem[] = [
  {
    title: "Overview",
    href: "/admin/overview",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Organizations",
    href: "/admin/organizations",
    icon: Building2,
  },
];

export function AppSidebar({
  className,
  isMobile = false,
  onNavClick,
}: {
  className?: string;
  isMobile?: boolean;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();
  const { user } = useAuth();
  const collapsed = !isMobile && isSidebarCollapsed;
  const isSuperuser = Boolean(user?.is_superuser);

  return (
    <aside
      className={cn(
        "flex select-none flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        isMobile
          ? "h-full w-full border-r-0"
          : collapsed
            ? "w-[68px]"
            : "w-[240px]",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-3.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 overflow-hidden"
          onClick={onNavClick}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            TF
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold leading-tight text-foreground">
                TaskFlow
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                Enterprise Workspace
              </span>
            </div>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden h-7 w-7 text-muted-foreground hover:text-foreground lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        {collapsed ? (
          <Button
            size="icon"
            className="h-9 w-full rounded-lg"
            title="Create Task"
            aria-label="Create Task"
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="h-9 w-full justify-start gap-2 rounded-lg px-3 text-xs font-semibold">
            <Plus className="h-4 w-4 shrink-0" />
            <span>Create Task</span>
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-1">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname?.includes(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors duration-150",
                  isActive
                    ? "bg-sidebar-active font-semibold text-sidebar-active-foreground"
                    : "text-sidebar-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center px-0 py-2.5"
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </div>

        {/* Administration Section (visible for confirmed superusers) */}
        {isSuperuser && (
          <div className="space-y-1 border-t border-border/60 pt-3">
            {!collapsed && (
              <div className="flex items-center gap-1.5 px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-primary" />
                <span>Administration</span>
              </div>
            )}
            {adminNavItems.map((item) => {
              const isActive = pathname?.includes(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavClick}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors duration-150",
                    isActive
                      ? "bg-sidebar-active font-semibold text-sidebar-active-foreground"
                      : "text-sidebar-foreground hover:bg-secondary hover:text-foreground",
                    collapsed && "justify-center px-0 py-2.5"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer Info */}
      <div className="mt-auto border-t border-border p-3">
        <div
          className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            collapsed ? "justify-center" : "px-1"
          )}
        >
          <Workflow className="h-3.5 w-3.5 shrink-0 text-primary" />
          {!collapsed && (
            <span className="truncate text-[11px]">Sprint 24 • Active</span>
          )}
        </div>
      </div>
    </aside>
  );
}
