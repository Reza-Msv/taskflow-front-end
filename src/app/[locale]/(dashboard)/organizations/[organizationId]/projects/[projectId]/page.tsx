import React from "react";
import { ProjectDetailsPage } from "@/components/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;
  return (
    <ProjectDetailsPage organizationId={organizationId} projectId={projectId} />
  );
}
