import React, { Suspense } from "react";
import { AcceptInvitationPage } from "@/components/pages";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/shared/page-container";

export default function Page() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <div className="mx-auto max-w-lg space-y-4 pt-12">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </PageContainer>
      }
    >
      <AcceptInvitationPage />
    </Suspense>
  );
}
