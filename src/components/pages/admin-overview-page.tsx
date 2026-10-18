"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  Building2,
  FolderKanban,
  UserCheck,
  Building,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService } from "@/services/admin-service";
import type { AdminOverviewResponse } from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";

export function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getOverview();
      setMetrics(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to load administrative system metrics.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <PageContainer>
      <PageHeader
        title="Admin Overview"
        description="High-level health and system-wide usage metrics across the TaskFlow platform."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        }
      />

      {/* Error State */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMetrics}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-40" />
            </Card>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      {!isLoading && metrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {metrics.total_users}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Accounts registered on the system
              </p>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-success-bg text-status-success-foreground">
                <UserCheck className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {metrics.active_users}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Active users eligible to log in
              </p>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Organizations
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                <Building2 className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {metrics.total_organizations}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Created workspace tenants
              </p>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Organizations
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-info-bg text-status-info-foreground">
                <Building className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {metrics.active_organizations}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Tenants currently enabled
              </p>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderKanban className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {metrics.total_projects}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Projects across all organizations
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
