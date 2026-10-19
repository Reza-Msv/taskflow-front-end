"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Users,
  Settings,
  Lock,
  Globe,
  Archive,
  Trash2,
  RefreshCw,
  AlertCircle,
  UserPlus,
  Shield,
  ArrowLeft,
  Edit2,
  Calendar,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { projectService } from "@/services/project-service";
import { organizationService } from "@/services/organization-service";
import { useAuth } from "@/modules/auth/context/auth-context";
import { addProjectMemberSchema } from "@/lib/schemas/org-project-schemas";
import type {
  ProjectResponse,
  ProjectMembershipResponse,
  OrganizationMembershipResponse,
  ProjectRole,
} from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";

export function ProjectDetailsPage({
  organizationId,
  projectId,
}: {
  organizationId: string;
  projectId: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [members, setMembers] = useState<ProjectMembershipResponse[]>([]);
  const [orgMembers, setOrgMembers] = useState<
    OrganizationMembershipResponse[]
  >([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Project Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);
  const [editArchived, setEditArchived] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add Member Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("member");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete Project Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Remove Member Confirmation
  const [memberToRemove, setMemberToRemove] =
    useState<ProjectMembershipResponse | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const canManageProject =
    currentUserRole === "admin" ||
    project?.owner_id === user?.id ||
    user?.is_superuser;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projData, membersData, orgMembersData] = await Promise.all([
        projectService.getProject(organizationId, projectId),
        projectService.getMembers(organizationId, projectId, {
          page: 1,
          page_size: 100,
        }),
        organizationService.getMembers(organizationId, {
          page: 1,
          page_size: 100,
        }),
      ]);
      setProject(projData);
      setEditName(projData.name);
      setEditDesc(projData.description || "");
      setEditPrivate(projData.is_private);
      setEditArchived(projData.is_archived);
      setMembers(membersData.items);
      setOrgMembers(orgMembersData.items);

      const currentProjMember = membersData.items.find(
        (m) => m.user_id === user?.id
      );
      if (currentProjMember) {
        setCurrentUserRole(currentProjMember.role);
      } else if (user?.is_superuser) {
        setCurrentUserRole("admin");
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to load project");
      } else {
        setError("Network error while loading project");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, projectId, user?.id, user?.is_superuser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsUpdating(true);
    setEditError(null);
    try {
      const updated = await projectService.updateProject(
        organizationId,
        projectId,
        {
          name: editName.trim(),
          description: editDesc.trim() || null,
          is_private: editPrivate,
          is_archived: editArchived,
        }
      );
      setProject(updated);
      toast.success("Project updated successfully");
      setIsEditOpen(false);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setEditError(err.message);
      } else {
        setEditError("Failed to update project");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setIsDeleting(true);
    try {
      await projectService.deleteProject(organizationId, projectId);
      toast.success("Project deleted successfully");
      router.push(`/organizations/${organizationId}/projects`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete project");
      }
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await projectService.updateMemberRole(
        organizationId,
        projectId,
        targetUserId,
        {
          role: newRole as ProjectRole,
        }
      );
      toast.success("Project member role updated");
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update role");
      }
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await projectService.removeMember(
        organizationId,
        projectId,
        memberToRemove.user_id
      );
      toast.success("Member removed from project");
      setMemberToRemove(null);
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to remove member");
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = addProjectMemberSchema.safeParse({
      user_id: selectedUserId,
      role: selectedRole,
    });
    if (!res.success) {
      setAddError(res.error.issues[0]?.message || "Invalid input");
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      await projectService.addMember(organizationId, projectId, res.data);
      toast.success("Member added to project");
      setIsAddOpen(false);
      setSelectedUserId("");
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setAddError(err.message);
      } else {
        setAddError("Failed to add member");
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Eligible org members who are NOT already in the project
  const eligibleOrgMembers = orgMembers.filter(
    (om) => !members.some((pm) => pm.user_id === om.user_id)
  );

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

  if (error || !project) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="font-semibold">
            {error || "Project not found or private"}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/organizations/${organizationId}/projects`)
              }
            >
              Back to Projects
            </Button>
            <Button size="sm" onClick={loadData}>
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
          href={`/organizations/${organizationId}/projects`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>

      <PageHeader
        title={project.name}
        description={`Prefix Key: [${project.key}] • ${project.description || "No description provided."}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push(`/projects/${project.id}/board`)}
              className="gap-1.5"
            >
              <FolderKanban className="h-4 w-4" />
              <span>Open Board</span>
            </Button>

            {canManageProject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="gap-1.5"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Settings</span>
              </Button>
            )}

            {canManageProject && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Project Metadata Status Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Visibility
          </span>
          <div className="mt-1 flex items-center gap-2">
            {project.is_private ? (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                <span>Private</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                <span>Public to Org</span>
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">
            State
          </span>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={project.is_archived ? "secondary" : "success"}>
              {project.is_archived ? "Archived" : "Active"}
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Your Role
          </span>
          <div className="mt-1 flex items-center gap-2 font-semibold capitalize text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>{currentUserRole || "Viewer"}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Project Members
          </span>
          <div className="mt-1 flex items-center gap-2 font-semibold text-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>{members.length}</span>
          </div>
        </div>
      </div>

      {/* Project Members Table */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Project Members
            </h2>
            <p className="text-xs text-muted-foreground">
              Project-level roles (admin, member, viewer). Users must already
              belong to the organization.
            </p>
          </div>

          {canManageProject && (
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="gap-1.5 text-xs"
              disabled={eligibleOrgMembers.length === 0}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Member</span>
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Project Role</TableHead>
                <TableHead>Assigned Date</TableHead>
                {canManageProject && (
                  <TableHead className="text-end">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const isSelf = m.user_id === user?.id;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">
                          {m.user?.full_name || m.user?.email || "Unknown User"}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {m.user?.email || m.user_id}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {canManageProject && !isSelf ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(m.user_id, e.target.value)
                          }
                          className="h-7 rounded border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                          <option value="viewer">viewer</option>
                        </select>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs font-medium capitalize"
                        >
                          {m.role}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
                    </TableCell>

                    {canManageProject && (
                      <TableCell className="text-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMemberToRemove(m)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          title="Remove from project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Project Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and settings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-2">
            {editError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {editError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="proj-edit-name">Project Name</Label>
              <Input
                id="proj-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-edit-desc">Description</Label>
              <textarea
                id="proj-edit-desc"
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                disabled={isUpdating}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="proj-edit-private"
                  checked={editPrivate}
                  onChange={(e) => setEditPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <Label
                  htmlFor="proj-edit-private"
                  className="cursor-pointer text-xs"
                >
                  Private project (restricted visibility)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="proj-edit-archive"
                  checked={editArchived}
                  onChange={(e) => setEditArchived(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <Label
                  htmlFor="proj-edit-archive"
                  className="cursor-pointer text-xs"
                >
                  Archive this project
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdating || !editName.trim()}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Project Member Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member to Project</DialogTitle>
            <DialogDescription>
              Select an existing organization member to add to{" "}
              <strong>{project.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMemberSubmit} className="space-y-4 pt-2">
            {addError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {addError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="select-org-member">Organization Member</Label>
              <select
                id="select-org-member"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">-- Select Member --</option>
                {eligibleOrgMembers.map((om) => (
                  <option key={om.user_id} value={om.user_id}>
                    {om.user?.full_name || om.user?.email || om.user_id} (
                    {om.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="select-proj-role">Project Role</Label>
              <select
                id="select-proj-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="admin">admin</option>
                <option value="member">member</option>
                <option value="viewer">viewer</option>
              </select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAdding || !selectedUserId}
              >
                {isAdding ? "Adding..." : "Add to Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Member */}
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove Member from Project"
        description={`Are you sure you want to remove ${
          memberToRemove?.user?.full_name ||
          memberToRemove?.user?.email ||
          "this member"
        } from the project? They will retain organization membership.`}
        confirmLabel={isRemoving ? "Removing..." : "Remove"}
        isDestructive={true}
        onConfirm={handleRemoveMember}
      />

      {/* Confirm Delete Project */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => setIsDeleteOpen(open)}
        title="Delete Project"
        description={`Are you sure you want to permanently delete project "${project.name}" (${project.key})? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Project"}
        isDestructive={true}
        onConfirm={handleDeleteSubmit}
      />
    </PageContainer>
  );
}
