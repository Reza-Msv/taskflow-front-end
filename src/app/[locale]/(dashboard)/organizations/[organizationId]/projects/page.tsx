import React from "react";
import { OrganizationProjectsPage } from "@/components/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return <OrganizationProjectsPage organizationId={organizationId} />;
}
