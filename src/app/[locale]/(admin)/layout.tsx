import React from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppHeader } from "@/components/shared/app-header";
import { AdminGuard } from "@/modules/admin/components/admin-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Persistent Desktop Sidebar */}
        <AppSidebar className="sticky top-0 hidden h-screen shrink-0 lg:flex" />

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
