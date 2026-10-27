"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrganizationStore } from "@/stores/organization-store";
import { organizationService } from "@/services/organization-service";
import { ProjectScrumPage } from "@/components/pages";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/shared/page-container";

export default function Page() {
  const params = useParams();
  const { currentOrganization, setCurrentOrganization } = useOrganizationStore();
  const projectId = params?.projectId as string;
  const [loadingOrg, setLoadingOrg] = useState(!currentOrganization);

  useEffect(() => {
    if (!currentOrganization) {
      organizationService
        .getMyOrganizations({ page_size: 1 })
        .then((res) => {
          if (res.items && res.items.length > 0) {
            setCurrentOrganization(res.items[0]);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingOrg(false);
        });
    }
  }, [currentOrganization, setCurrentOrganization]);

  if (currentOrganization && projectId) {
    return (
      <ProjectScrumPage
        organizationId={currentOrganization.id}
        projectId={projectId}
        initialTab="backlog"
      />
    );
  }

  if (loadingOrg) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No organization found. Please create or select an organization to view this backlog.
        </p>
      </div>
    </PageContainer>
  );
}
