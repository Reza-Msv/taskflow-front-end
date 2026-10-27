import React from "react";
import { ProjectBoardPage } from "@/components/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;
  return (
    <ProjectBoardPage
      organizationId={organizationId}
      projectId={projectId}
      initialViewMode="calendar"
    />
  );
}
