"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Users,
  FolderKanban,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Mail,
  Shield,
  ArrowRight,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { organizationService } from "@/services/organization-service";
import { useOrganizationStore } from "@/stores/organization-store";
import { organizationCreateSchema } from "@/lib/schemas/org-project-schemas";
import type { OrganizationResponse } from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";

export function OrganizationsPage() {
  const router = useRouter();
  const { setCurrentOrganization } = useOrganizationStore();

  const [organizations, setOrganizations] = useState<OrganizationResponse[]>(
    []
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Org Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    slug?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Accept Invitation Modal
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await organizationService.getMyOrganizations({
        page: 1,
        page_size: 50,
      });
      setOrganizations(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to load organizations");
      } else {
        setError("Network error while loading organizations");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleNameChange = (nameVal: string) => {
    setCreateName(nameVal);
    // Auto-suggest slug if user hasn't explicitly customized it much
    const generated = nameVal
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setCreateSlug(generated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setValidationErrors({});

    const result = organizationCreateSchema.safeParse({
      name: createName.trim(),
      slug: createSlug.trim(),
    });

    if (!result.success) {
      const fieldErrors: { name?: string; slug?: string } = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === "name") fieldErrors.name = issue.message;
        if (issue.path[0] === "slug") fieldErrors.slug = issue.message;
      });
      setValidationErrors(fieldErrors);
      return;
    }

    setIsCreating(true);
    try {
      const created = await organizationService.createOrganization(result.data);
      toast.success(`Organization "${created.name}" created successfully`);
      setIsCreateOpen(false);
      setCreateName("");
      setCreateSlug("");
      setCurrentOrganization(created);
      fetchOrganizations();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
      } else {
        setServerError("Failed to create organization");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;
    setIsAccepting(true);
    setAcceptError(null);
    try {
      await organizationService.acceptInvitation(inviteToken.trim());
      toast.success("Invitation accepted successfully!");
      setIsAcceptOpen(false);
      setInviteToken("");
      fetchOrganizations();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setAcceptError(err.message);
      } else {
        setAcceptError("Failed to accept invitation");
      }
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Organizations"
        description="Select or manage your engineering workspaces, teams, and member access."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAcceptOpen(true)}
              className="gap-1.5"
            >
              <Mail className="h-4 w-4" />
              <span>Accept Invite</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>New Organization</span>
            </Button>
          </div>
        }
      />

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl border border-border bg-card p-5"
            >
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="font-semibold">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrganizations}
            className="mt-4 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && organizations.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No organizations found"
          description="You are not currently a member of any organizations. Create your first workspace to start collaborating on projects."
          actionLabel="Create Organization"
          onAction={() => setIsCreateOpen(true)}
        />
      )}

      {/* Organization Cards Grid */}
      {!isLoading && !error && organizations.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="group flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                      {org.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold leading-none transition-colors group-hover:text-primary">
                        {org.name}
                      </CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs text-muted-foreground">
                        {org.slug}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={org.is_active ? "success" : "secondary"}>
                    {org.is_active ? "active" : "inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Workspace</span>
                  </span>
                  <span>
                    Created {new Date(org.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/50 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setCurrentOrganization(org);
                    router.push(`/organizations/${org.id}`);
                  }}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Manage</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setCurrentOrganization(org);
                    router.push(`/organizations/${org.id}/projects`);
                  }}
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                  <span>Projects</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Organization Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Organizations are top-level workspaces containing projects,
              members, and custom workflows.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {serverError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="create-org-name">Organization Name</Label>
              <Input
                id="create-org-name"
                placeholder="Acme Engineering"
                value={createName}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={isCreating}
              />
              {validationErrors.name && (
                <p className="text-xs text-destructive">
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-org-slug">Unique Slug</Label>
              <Input
                id="create-org-slug"
                placeholder="acme-engineering"
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value.toLowerCase())}
                disabled={isCreating}
              />
              <p className="text-[11px] text-muted-foreground">
                Lowercase alphanumeric and single hyphens (e.g. acme-corp)
              </p>
              {validationErrors.slug && (
                <p className="text-xs text-destructive">
                  {validationErrors.slug}
                </p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Accept Invitation Dialog */}
      <Dialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Organization Invitation</DialogTitle>
            <DialogDescription>
              Paste the single-use invitation token sent by your organization
              administrator.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAcceptInvite} className="space-y-4 pt-2">
            {acceptError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {acceptError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="invite-token">Invitation Token</Label>
              <Input
                id="invite-token"
                placeholder="Paste token here..."
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                disabled={isAccepting}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAcceptOpen(false)}
                disabled={isAccepting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAccepting || !inviteToken.trim()}
              >
                {isAccepting ? "Accepting..." : "Join Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
