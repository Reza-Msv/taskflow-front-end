"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, AlertCircle, Building2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { organizationService } from "@/services/organization-service";
import { useAuth } from "@/modules/auth/context/auth-context";
import type { OrganizationResponse } from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";

export function OrganizationSettingsPage({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { user } = useAuth();

  const [org, setOrg] = useState<OrganizationResponse | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [orgData, membersData] = await Promise.all([
        organizationService.getOrganization(organizationId),
        organizationService.getMembers(organizationId, {
          page: 1,
          page_size: 100,
        }),
      ]);
      setOrg(orgData);

      const currentMember = membersData.items.find(
        (m) => m.user_id === user?.id
      );
      if (currentMember) {
        setUserRole(currentMember.role);
      } else if (user?.is_superuser) {
        setUserRole("owner");
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to load workspace settings");
      } else {
        setError("Network error while loading workspace settings");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, user?.id, user?.is_superuser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !org) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="font-semibold">{error || "Workspace not found"}</p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${currentLocale}/organizations`)}
            >
              Back to Organizations
            </Button>
            <Button size="sm" onClick={loadData}>
              Try Again
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Breadcrumb Back */}
      <div className="mb-4">
        <Link
          href={`/${currentLocale}/organizations/${org.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {org.name}</span>
        </Link>
      </div>

      <PageHeader
        title={`Settings: ${org.name}`}
        description={`Manage primary settings, metadata, and administration for workspace ${org.slug}.`}
      />

      <div className="mt-6">
        <WorkspaceSettingsForm
          organization={org}
          userRole={userRole}
          isSuperuser={Boolean(user?.is_superuser)}
          onUpdated={(updated) => setOrg(updated)}
          onDeleted={() => router.push(`/${currentLocale}/organizations`)}
        />
      </div>
    </PageContainer>
  );
}
