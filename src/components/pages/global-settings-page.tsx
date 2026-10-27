"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  Building2,
  User,
  Shield,
  ArrowRight,
  ExternalLink,
  Plus,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/modules/auth/context/auth-context";
import { useOrganizationStore } from "@/stores/organization-store";
import { organizationService } from "@/services/organization-service";
import type { OrganizationResponse } from "@/services/generated/api-types";

export function GlobalSettingsPage() {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { user } = useAuth();
  const { currentOrganization, setCurrentOrganization } =
    useOrganizationStore();

  const [organizations, setOrganizations] = useState<OrganizationResponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOrgs() {
      try {
        const res = await organizationService.getMyOrganizations({
          page: 1,
          page_size: 50,
        });
        if (isMounted) {
          setOrganizations(res.items);
          if (!currentOrganization && res.items.length > 0) {
            setCurrentOrganization(res.items[0]);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadOrgs();
    return () => {
      isMounted = false;
    };
  }, [currentOrganization, setCurrentOrganization]);

  return (
    <PageContainer>
      <PageHeader
        title="Settings & Workspace Preferences"
        description="Configure your account profile, manage workspace preferences, and navigate administration settings."
      />

      <div className="mt-6 space-y-6">
        {/* Account Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">
                User Profile
              </CardTitle>
            </div>
            <CardDescription>
              Authenticated account information and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Full Name
                </span>
                <p className="mt-0.5 text-xs font-semibold text-foreground">
                  {user?.name || "Not specified"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Email Address
                </span>
                <p className="mt-0.5 text-xs font-semibold text-foreground">
                  {user?.email || "Unknown"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Account Type
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge
                    variant={user?.is_superuser ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {user?.is_superuser ? "Platform Superuser" : "Standard User"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspaces Management Card */}
        <Card>
          <CardHeader className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Workspaces & Organizations
                </CardTitle>
              </div>
              <CardDescription>
                Select a workspace to configure metadata, manage member roles,
                and access administrative settings.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${currentLocale}/organizations`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>All Workspaces</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                <p>You do not belong to any workspaces yet.</p>
                <div className="mt-3 flex justify-center gap-2">
                  <Link href={`/${currentLocale}/organizations`}>
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Workspace</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {organizations.map((org) => {
                  const isCurrent = currentOrganization?.id === org.id;

                  return (
                    <div
                      key={org.id}
                      className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {org.name}
                            </span>
                            {isCurrent && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                Active Workspace
                              </Badge>
                            )}
                            <Badge
                              variant={org.is_active ? "success" : "secondary"}
                              className="text-[10px]"
                            >
                              {org.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {org.slug}
                          </span>
                        </div>
                      </div>

                      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                        <Link
                          href={`/${currentLocale}/organizations/${org.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                          >
                            <span>Overview</span>
                          </Button>
                        </Link>
                        <Link
                          href={`/${currentLocale}/organizations/${org.id}/settings`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            <span>Settings</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
