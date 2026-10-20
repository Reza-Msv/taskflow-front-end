"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Search,
  Lock,
  Globe,
  Archive,
  RefreshCw,
  AlertCircle,
  Building2,
  Users,
  ChevronRight,
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
import { projectService } from "@/services/project-service";
import { organizationService } from "@/services/organization-service";
import { useOrganizationStore } from "@/stores/organization-store";
import { projectCreateSchema } from "@/lib/schemas/org-project-schemas";
import type {
  ProjectResponse,
  OrganizationResponse,
} from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";

export function OrganizationProjectsPage({
  organizationId,
}: {
  organizationId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { currentOrganization, setCurrentOrganization } =
    useOrganizationStore();

  const [org, setOrg] = useState<OrganizationResponse | null>(null);
  const [allOrgs, setAllOrgs] = useState<OrganizationResponse[]>([]);
  const [effectiveOrgId, setEffectiveOrgId] = useState<string | null>(
    organizationId || null
  );

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Create Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectPrivate, setProjectPrivate] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    key?: string;
    description?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Initialize or fetch organization context
  useEffect(() => {
    let isMounted = true;
    async function initOrgs() {
      try {
        const orgsRes = await organizationService.getMyOrganizations({
          page: 1,
          page_size: 50,
        });
        if (!isMounted) return;
        setAllOrgs(orgsRes.items);

        let targetId = organizationId;
        if (!targetId && currentOrganization) {
          targetId = currentOrganization.id;
        }
        if (!targetId && orgsRes.items.length > 0) {
          targetId = orgsRes.items[0].id;
        }

        if (targetId) {
          setEffectiveOrgId(targetId);
          const found = orgsRes.items.find((o) => o.id === targetId);
          if (found) {
            setOrg(found);
            setCurrentOrganization(found);
          } else {
            const orgDetail =
              await organizationService.getOrganization(targetId);
            if (isMounted) {
              setOrg(orgDetail);
              setCurrentOrganization(orgDetail);
            }
          }
        }
      } catch {
        // Handled in projects fetch
      }
    }
    initOrgs();
    return () => {
      isMounted = false;
    };
  }, [organizationId, currentOrganization, setCurrentOrganization]);

  const fetchProjects = useCallback(async () => {
    if (!effectiveOrgId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await projectService.getProjects(effectiveOrgId, {
        page: 1,
        page_size: 50,
        search: search.trim() || undefined,
        is_archived: showArchived ? undefined : false,
      });
      setProjects(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to load projects");
      } else {
        setError("Network error while loading projects");
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectiveOrgId, search, showArchived]);

  useEffect(() => {
    if (effectiveOrgId) {
      fetchProjects();
    }
  }, [effectiveOrgId, fetchProjects]);

  const handleNameChange = (nameVal: string) => {
    setProjectName(nameVal);
    // Auto-generate candidate project key prefix (up to 4 chars)
    if (!projectKey || projectKey.length <= 4) {
      const words = nameVal.trim().split(/\s+/).filter(Boolean);
      let candidate = "";
      if (words.length >= 2) {
        candidate = words
          .map((w) => w[0])
          .join("")
          .slice(0, 4)
          .toUpperCase();
      } else if (words.length === 1 && words[0].length >= 2) {
        candidate = words[0].slice(0, 3).toUpperCase();
      }
      if (candidate.match(/^[A-Z0-9]+$/)) {
        setProjectKey(candidate);
      }
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveOrgId) return;

    setServerError(null);
    setValidationErrors({});

    const res = projectCreateSchema.safeParse({
      name: projectName.trim(),
      key: projectKey.trim().toUpperCase(),
      description: projectDesc.trim() || null,
      is_private: projectPrivate,
    });

    if (!res.success) {
      const fieldErrors: { name?: string; key?: string; description?: string } =
        {};
      res.error.issues.forEach((issue) => {
        if (issue.path[0] === "name") fieldErrors.name = issue.message;
        if (issue.path[0] === "key") fieldErrors.key = issue.message;
        if (issue.path[0] === "description")
          fieldErrors.description = issue.message;
      });
      setValidationErrors(fieldErrors);
      return;
    }

    setIsCreating(true);
    try {
      const created = await projectService.createProject(
        effectiveOrgId,
        res.data
      );
      toast.success(`Project "${created.name}" created successfully`);
      setIsCreateOpen(false);
      setProjectName("");
      setProjectKey("");
      setProjectDesc("");
      setProjectPrivate(false);
      fetchProjects();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
      } else {
        setServerError("Failed to create project");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOrgSwitch = (orgId: string) => {
    setEffectiveOrgId(orgId);
    const target = allOrgs.find((o) => o.id === orgId);
    if (target) {
      setOrg(target);
      setCurrentOrganization(target);
    }
    if (organizationId) {
      router.push(`/${currentLocale}/organizations/${orgId}/projects`);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={org ? `${org.name} Projects` : "Projects"}
        description="Collaborative engineering workspaces, work items, and sprint tracking."
        actions={
          <div className="flex items-center gap-2">
            {allOrgs.length > 1 && (
              <select
                value={effectiveOrgId || ""}
                onChange={(e) => handleOrgSwitch(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {allOrgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}

            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5"
              disabled={!effectiveOrgId}
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={showArchived ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>{showArchived ? "Archived Projects" : "Active Only"}</span>
          </Button>
        </div>
      </div>

      {/* Loading Skeletons */}
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

      {/* Error View */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="font-semibold">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjects}
            className="mt-4 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={
            search
              ? `No projects matched "${search}".`
              : "No projects exist in this organization yet. Create your first project to organize tasks and sprints."
          }
          actionLabel="Create Project"
          onAction={() => setIsCreateOpen(true)}
        />
      )}

      {/* Project Cards Grid */}
      {!isLoading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-bold text-foreground">
                      {project.key}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold transition-colors group-hover:text-primary">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {project.description || "No description provided."}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {project.is_private ? (
                      <Badge
                        variant="outline"
                        className="gap-1 py-0 text-[10px]"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Private</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 py-0 text-[10px]"
                      >
                        <Globe className="h-3 w-3" />
                        <span>Public</span>
                      </Badge>
                    )}
                    {project.is_archived && (
                      <Badge variant="secondary" className="py-0 text-[10px]">
                        Archived
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/50 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    router.push(
                      `/${currentLocale}/organizations/${project.organization_id}/projects/${project.id}`
                    )
                  }
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Details & Members</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    router.push(`/${currentLocale}/projects/${project.id}/board`)
                  }
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                  <span>Board</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a project within{" "}
              <strong>{org?.name || "your organization"}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {serverError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="create-proj-name">Project Name</Label>
              <Input
                id="create-proj-name"
                placeholder="Core Engine"
                value={projectName}
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
              <Label htmlFor="create-proj-key">Issue Key Prefix</Label>
              <Input
                id="create-proj-key"
                placeholder="CORE"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                disabled={isCreating}
              />
              <p className="text-[11px] text-muted-foreground">
                2-20 uppercase alphanumeric characters (e.g. TF, CORE)
              </p>
              {validationErrors.key && (
                <p className="text-xs text-destructive">
                  {validationErrors.key}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-proj-desc">Description (Optional)</Label>
              <textarea
                id="create-proj-desc"
                rows={3}
                placeholder="Brief summary of project scope..."
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                disabled={isCreating}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="create-proj-private"
                checked={projectPrivate}
                onChange={(e) => setProjectPrivate(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label
                htmlFor="create-proj-private"
                className="cursor-pointer text-xs"
              >
                Private project (restricted to assigned project members)
              </Label>
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
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
