"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganizationStore } from "@/stores/organization-store";
import { ProjectBoardPage } from "@/components/pages";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/shared/page-container";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  const projectId = params?.projectId as string;

  useEffect(() => {
    if (currentOrganization && projectId) {
      router.replace(
        `/organizations/${currentOrganization.id}/projects/${projectId}/board`
      );
    }
  }, [currentOrganization, projectId, router]);

  if (currentOrganization && projectId) {
    return (
      <ProjectBoardPage
        organizationId={currentOrganization.id}
        projectId={projectId}
      />
    );
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </PageContainer>
  );
}
