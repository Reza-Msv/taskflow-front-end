import React from "react";
import { OrganizationSettingsPage } from "@/components/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return <OrganizationSettingsPage organizationId={organizationId} />;
}
