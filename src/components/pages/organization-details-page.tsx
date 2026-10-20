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
  Copy,
  Check,
  Shield,
  ArrowLeft,
  Edit2,
  CheckCircle2,
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
import { EmptyState } from "@/components/shared/empty-state";
import { organizationService } from "@/services/organization-service";
import { useAuth } from "@/modules/auth/context/auth-context";
import {
  inviteMemberSchema,
  addMemberSchema,
} from "@/lib/schemas/org-project-schemas";
import type {
  OrganizationResponse,
  OrganizationMembershipResponse,
  InvitationResponse,
  OrganizationRole,
} from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";

const VALID_ROLES: OrganizationRole[] = [
  "owner",
  "admin",
  "member",
  "guest",
  "viewer",
];

export function OrganizationDetailsPage({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { user } = useAuth();

  const [org, setOrg] = useState<OrganizationResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMembershipResponse[]>([]);
  const [invitations, setInvitations] = useState<InvitationResponse[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Org modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Invite modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<
    "admin" | "member" | "guest" | "viewer"
  >("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generatedInviteToken, setGeneratedInviteToken] = useState<
    string | null
  >(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Add Member modal (Direct UUID)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState<
    "admin" | "member" | "guest" | "viewer"
  >("member");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete Org confirmation
  const [isDeleteOrgOpen, setIsDeleteOrgOpen] = useState(false);
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  // Remove Member confirmation
  const [memberToRemove, setMemberToRemove] =
    useState<OrganizationMembershipResponse | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const isOwner = userRole === "owner";
  const isAdminOrOwner =
    userRole === "owner" || userRole === "admin" || user?.is_superuser;

  const loadData = useCallback(async () => {
    setIsLoading(true);
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
      setEditName(orgData.name);
      setEditIsActive(orgData.is_active);
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
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to load organization details");
      } else {
        setError("Network error while loading organization");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, user?.id, user?.is_superuser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsUpdatingOrg(true);
    setEditError(null);
    try {
      const updated = await organizationService.updateOrganization(
        organizationId,
        {
          name: editName.trim(),
          is_active: editIsActive,
        }
      );
      setOrg(updated);
      toast.success("Organization updated successfully");
      setIsEditOpen(false);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setEditError(err.message);
      } else {
        setEditError("Failed to update organization");
      }
    } finally {
      setIsUpdatingOrg(false);
    }
  };

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

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await organizationService.updateMemberRole(organizationId, targetUserId, {
        role: newRole as OrganizationRole,
      });
      toast.success("Member role updated");
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update member role");
      }
    }
  };

  const handleRemoveMemberConfirm = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    try {
      await organizationService.removeMember(
        organizationId,
        memberToRemove.user_id
      );
      toast.success("Member removed successfully");
      setMemberToRemove(null);
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to remove member");
      }
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = inviteMemberSchema.safeParse({
      email: inviteEmail.trim(),
      role: inviteRole,
    });
    if (!res.success) {
      setInviteError(res.error.issues[0]?.message || "Invalid input");
      return;
    }
    setIsInviting(true);
    setInviteError(null);
    try {
      const inv = await organizationService.createInvitation(
        organizationId,
        res.data
      );
      toast.success(`Invitation created for ${inv.email}`);
      setGeneratedInviteToken(inv.token);
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setInviteError(err.message);
      } else {
        setInviteError("Failed to create invitation");
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = addMemberSchema.safeParse({
      user_id: addUserId.trim(),
      role: addRole,
    });
    if (!res.success) {
      setAddError(res.error.issues[0]?.message || "Invalid input");
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      await organizationService.addMember(organizationId, res.data);
      toast.success("Member added directly to organization");
      setIsAddOpen(false);
      setAddUserId("");
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

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    toast.success("Token copied to clipboard!");
    setTimeout(() => setCopiedToken(false), 2000);
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
                router.push(`/${currentLocale}/organizations/${org.id}/projects`)
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
                onClick={() => setIsEditOpen(true)}
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
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      </div>

      {/* Members Section */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Organization Members
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage member roles, permissions, and direct invitations.
            </p>
          </div>

          {isAdminOrOwner && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGeneratedInviteToken(null);
                  setIsInviteOpen(true);
                }}
                className="gap-1.5 text-xs"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Invite by Email</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddOpen(true)}
                className="gap-1.5 text-xs"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                {isAdminOrOwner && (
                  <TableHead className="text-end">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const isTargetOwner = m.role === "owner";
                const isSelf = m.user_id === user?.id;
                const canModifyThisMember =
                  isAdminOrOwner && (!isTargetOwner || (isOwner && !isSelf));

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
                      {isAdminOrOwner &&
                      canModifyThisMember &&
                      !isTargetOwner ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(m.user_id, e.target.value)
                          }
                          className="h-7 rounded border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                          <option value="guest">guest</option>
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
                    <TableCell>
                      <Badge variant={m.is_active ? "success" : "secondary"}>
                        {m.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
                    </TableCell>
                    {isAdminOrOwner && (
                      <TableCell className="text-end">
                        {(canModifyThisMember || isSelf) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMemberToRemove(m)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            title={
                              isSelf ? "Leave organization" : "Remove member"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Invitations Table if Admin/Owner */}
      {isAdminOrOwner && invitations.length > 0 && (
        <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            Pending Invitations
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Single-Use Token</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-xs font-medium">
                      {inv.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{inv.role}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="max-w-[140px] truncate">
                          {inv.token}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(inv.token)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization display name or active status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateOrg} className="space-y-4 pt-2">
            {editError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {editError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isUpdatingOrg}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="edit-active"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="edit-active" className="cursor-pointer text-xs">
                Active Organization
              </Label>
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
                disabled={isUpdatingOrg || !editName.trim()}
              >
                {isUpdatingOrg ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Member Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Generate a single-use invitation token for the user to join this
              organization.
            </DialogDescription>
          </DialogHeader>

          {generatedInviteToken ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Invitation Created!</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this invitation token with{" "}
                  <strong>{inviteEmail}</strong>:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={generatedInviteToken}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedInviteToken)}
                    className="shrink-0 gap-1.5"
                  >
                    {copiedToken ? (
                      <Check className="text-success h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span>{copiedToken ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button size="sm" onClick={() => setIsInviteOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form
              id="invite-member-form"
              onSubmit={handleInviteSubmit}
              className="space-y-4 pt-2"
            >
              {inviteError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {inviteError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">User Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="collaborator@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isInviting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="guest">Guest</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  data-testid="submit-invite-btn"
                  disabled={isInviting || !inviteEmail.trim()}
                >
                  {isInviting ? "Creating Token..." : "Generate Invitation"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Direct Member Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member Directly</DialogTitle>
            <DialogDescription>
              Directly assign an existing registered user to this organization
              via their User ID.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMemberSubmit} className="space-y-4 pt-2">
            {addError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {addError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="add-user-id">User UUID</Label>
              <Input
                id="add-user-id"
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                disabled={isAdding}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-role">Role</Label>
              <select
                id="add-role"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as any)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="guest">Guest</option>
                <option value="viewer">Viewer</option>
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
                disabled={isAdding || !addUserId.trim()}
              >
                {isAdding ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Member Dialog */}
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove Member"
        description={`Are you sure you want to remove ${
          memberToRemove?.user?.full_name ||
          memberToRemove?.user?.email ||
          "this member"
        } from the organization?`}
        confirmLabel={isRemovingMember ? "Removing..." : "Remove"}
        isDestructive={true}
        onConfirm={handleRemoveMemberConfirm}
      />

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
