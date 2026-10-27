"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Building2,
  Users,
  Settings,
  FolderKanban,
  UserPlus,
  Mail,
  Trash2,
  RefreshCw,
  AlertCircle,
  Shield,
  ArrowLeft,
  Edit2,
  Layers,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  WorkspaceSettingsForm,
  WorkspaceMembersManagement,
  WorkspaceTeamsView,
} from "@/components/workspace";
import { organizationService } from "@/services/organization-service";
import { projectService } from "@/services/project-service";
import { useAuth } from "@/modules/auth/context/auth-context";
import { useOrganizationStore } from "@/stores/organization-store";
import type {
  OrganizationResponse,
  OrganizationMembershipResponse,
  InvitationResponse,
  ProjectResponse,
} from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";

export function OrganizationDetailsPage({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { user } = useAuth();
  const { setCurrentOrganization } = useOrganizationStore();

  const [org, setOrg] = useState<OrganizationResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMembershipResponse[]>([]);
  const [invitations, setInvitations] = useState<InvitationResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("members");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete Org confirmation
  const [isDeleteOrgOpen, setIsDeleteOrgOpen] = useState(false);
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  const isOwner = userRole === "owner" || user?.is_superuser;
  const isAdminOrOwner = isOwner || userRole === "admin";

  const loadData = useCallback(
    async (isInitial = false) => {
      if (isInitial) setIsLoading(true);
      setError(null);
      try {
        const [orgData, membersData] = await Promise.all([
          organizationService.getOrganization(organizationId),
          organizationService.getMembers(organizationId, {
            page: 1,
            page_size: 100,
          }),
        ]);
        setOrg(orgData);
        setCurrentOrganization(orgData);
        setMembers(membersData.items);

        // Determine current user's role
        const currentMember = membersData.items.find(
          (m) => m.user_id === user?.id
        );
        if (currentMember) {
          setUserRole(currentMember.role);
        } else if (user?.is_superuser) {
          setUserRole("owner");
        }

        // If user is admin/owner, load invitations
        if (
          currentMember?.role === "owner" ||
          currentMember?.role === "admin" ||
          user?.is_superuser
        ) {
          try {
            const invData =
              await organizationService.getInvitations(organizationId);
            setInvitations(invData.items);
          } catch {
            // Non-blocking if invitations endpoint has restrictions
          }
        }

        // Load projects for teams view (graceful fallback if not mocked or empty)
        try {
          const projData = await projectService.getProjects(organizationId, {
            page: 1,
            page_size: 50,
          });
          setProjects(projData.items);
        } catch {
          setProjects([]);
        }
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          setError(err.message || "Failed to load organization details");
        } else {
          setError("Network error while loading organization");
        }
      } finally {
        if (isInitial) setIsLoading(false);
      }
    },
    [organizationId, user?.id, user?.is_superuser, setCurrentOrganization]
  );

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const handleDeleteOrg = async () => {
    setIsDeletingOrg(true);
    try {
      await organizationService.deleteOrganization(organizationId);
      toast.success("Organization deleted successfully");
      router.push(`/${currentLocale}/organizations`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete organization");
      }
      setIsDeleteOrgOpen(false);
    } finally {
      setIsDeletingOrg(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !org) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="font-semibold">{error || "Organization not found"}</p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${currentLocale}/organizations`)}
            >
              Back to Organizations
            </Button>
            <Button size="sm" onClick={() => loadData(true)}>
              Try Again
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <Link
          href={`/${currentLocale}/organizations`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Organizations</span>
        </Link>
      </div>

      <PageHeader
        title={org.name}
        description={`Workspace Slug: ${org.slug} • Created on ${new Date(org.created_at).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `/${currentLocale}/organizations/${org.id}/projects`
                )
              }
              className="gap-1.5"
            >
              <FolderKanban className="h-4 w-4" />
              <span>View Projects</span>
            </Button>

            {isAdminOrOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("settings")}
                className="gap-1.5"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Settings</span>
              </Button>
            )}

            {isOwner && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteOrgOpen(true)}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Meta Overview Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Status
          </span>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={org.is_active ? "success" : "secondary"}>
              {org.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Your Role
          </span>
          <div className="mt-1 flex items-center gap-2 font-semibold capitalize text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>{userRole || "Member"}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Total Members
          </span>
          <div className="mt-1 flex items-center gap-2 font-semibold text-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>{members.length}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Projects
          </span>
          <div className="mt-1 flex items-center gap-2 font-semibold text-foreground">
            <FolderKanban className="h-4 w-4 text-primary" />
            <span>{projects.length}</span>
          </div>
        </div>
      </div>

      {/* Workspace Management Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-secondary/80">
          <TabsTrigger value="members" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>Members & Invites</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" />
            <span>Teams & Projects</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="focus-visible:outline-none">
          <WorkspaceMembersManagement
            organizationId={org.id}
            members={members}
            invitations={invitations}
            currentUserId={user?.id}
            currentUserRole={userRole}
            isSuperuser={Boolean(user?.is_superuser)}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="teams" className="focus-visible:outline-none">
          <WorkspaceTeamsView
            organization={org}
            members={members}
            projects={projects}
            currentUserRole={userRole}
          />
        </TabsContent>

        <TabsContent value="settings" className="focus-visible:outline-none">
          <WorkspaceSettingsForm
            organization={org}
            userRole={userRole}
            isSuperuser={Boolean(user?.is_superuser)}
            onUpdated={(updated) => setOrg(updated)}
            onDeleted={() => router.push(`/${currentLocale}/organizations`)}
          />
        </TabsContent>
      </Tabs>

      {/* Confirm Delete Organization Dialog */}
      <ConfirmDialog
        open={isDeleteOrgOpen}
        onOpenChange={(open) => setIsDeleteOrgOpen(open)}
        title="Delete Organization"
        description={`Are you sure you want to delete "${org.name}"? This action is permanent and will delete all associated projects and memberships.`}
        confirmLabel={isDeletingOrg ? "Deleting..." : "Delete Organization"}
        isDestructive={true}
        onConfirm={handleDeleteOrg}
      />
    </PageContainer>
  );
}
