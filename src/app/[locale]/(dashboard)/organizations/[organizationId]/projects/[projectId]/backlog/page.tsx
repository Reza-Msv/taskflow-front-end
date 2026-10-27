import React from "react";
import { ProjectScrumPage } from "@/components/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;
  return (
    <ProjectScrumPage
      organizationId={organizationId}
      projectId={projectId}
      initialTab="backlog"
    />
  );
}
