import React from "react";
import { ReportsPage } from "@/components/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;
  return <ReportsPage organizationId={organizationId} projectId={projectId} />;
}
