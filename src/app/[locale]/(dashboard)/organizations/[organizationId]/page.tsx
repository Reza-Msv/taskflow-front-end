import React from "react";
import { OrganizationDetailsPage } from "@/components/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return <OrganizationDetailsPage organizationId={organizationId} />;
}
