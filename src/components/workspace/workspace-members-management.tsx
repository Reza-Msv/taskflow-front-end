"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Copy,
  Check,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { organizationService } from "@/services/organization-service";
import {
  inviteMemberSchema,
  addMemberSchema,
} from "@/lib/schemas/org-project-schemas";
import type {
  OrganizationMembershipResponse,
  InvitationResponse,
  OrganizationRole,
} from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";

export interface WorkspaceMembersManagementProps {
  organizationId: string;
  members: OrganizationMembershipResponse[];
  invitations: InvitationResponse[];
  currentUserId?: string;
  currentUserRole: string | null;
  isSuperuser?: boolean;
  onRefresh: () => void;
}

export function WorkspaceMembersManagement({
  organizationId,
  members,
  invitations,
  currentUserId,
  currentUserRole,
  isSuperuser = false,
  onRefresh,
}: WorkspaceMembersManagementProps) {
  const isOwner = currentUserRole === "owner" || isSuperuser;
  const isAdminOrOwner = isOwner || currentUserRole === "admin";

  const [searchQuery, setSearchQuery] = useState("");

  // Role Update State
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  // Invite by Email Modal State
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

  // Direct Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState<
    "admin" | "member" | "guest" | "viewer"
  >("member");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Remove / Leave Confirmation State
  const [memberToRemove, setMemberToRemove] =
    useState<OrganizationMembershipResponse | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Filter members by name or email
  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = m.user?.full_name?.toLowerCase() || "";
    const email = m.user?.email?.toLowerCase() || "";
    const id = m.user_id.toLowerCase();
    return name.includes(q) || email.includes(q) || id.includes(q);
  });

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    setUpdatingMemberId(targetUserId);
    try {
      await organizationService.updateMemberRole(organizationId, targetUserId, {
        role: newRole as OrganizationRole,
      });
      toast.success("Member role updated successfully");
      onRefresh();
    } catch (err: unknown) {
      console.log("INV ERROR CAUGHT:", err); if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to update member role");
      } else {
        toast.error("Failed to update member role");
      }
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    const isSelf = memberToRemove.user_id === currentUserId;

    try {
      await organizationService.removeMember(
        organizationId,
        memberToRemove.user_id
      );
      toast.success(
        isSelf
          ? "You have left the workspace"
          : "Member removed from workspace"
      );
      setMemberToRemove(null);
      onRefresh();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to remove member");
      } else {
        toast.error("Failed to remove member");
      }
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = inviteMemberSchema.safeParse({
      email: inviteEmail.trim(),
      role: inviteRole,
    });
    if (!parsed.success) {
      setInviteError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }

    setIsInviting(true);
    setInviteError(null);
    try {
      const inv = await organizationService.createInvitation(
        organizationId,
        parsed.data
      );
      toast.success(`Invitation generated for ${inv.email}`);
      setGeneratedInviteToken(inv.token);
      onRefresh();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setInviteError(err.message || "Failed to create invitation");
      } else {
        setInviteError("Failed to create invitation");
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = addMemberSchema.safeParse({
      user_id: addUserId.trim(),
      role: addRole,
    });
    if (!parsed.success) {
      setAddError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }

    setIsAdding(true);
    setAddError(null);
    try {
      await organizationService.addMember(organizationId, parsed.data);
      toast.success("Member added to workspace");
      setIsAddOpen(false);
      setAddUserId("");
      onRefresh();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setAddError(err.message || "Failed to add member");
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
    toast.success("Invitation token copied to clipboard");
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>

        {isAdminOrOwner && (
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGeneratedInviteToken(null);
                setInviteEmail("");
                setIsInviteOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Invite by Email</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setAddUserId("");
                setAddError(null);
                setIsAddOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Member</span>
            </Button>
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Active Members ({filteredMembers.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Manage organization membership roles and access levels.
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    No members match your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((m) => {
                  const isTargetOwner = m.role === "owner";
                  const isSelf = m.user_id === currentUserId;
                  const displayName =
                    m.user?.full_name || m.user?.email || "Workspace User";
                  const initials = displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  // Permission evaluation:
                  // Owner can change anyone's role (except if last owner demoting self)
                  // Admin can only change non-owner roles
                  const canEditThisRole =
                    isAdminOrOwner &&
                    (!isTargetOwner || (isOwner && !isSelf));

                  // Can remove: self (leave) or admin/owner removing permitted target
                  const canRemoveThisMember =
                    isSelf ||
                    (isAdminOrOwner && (!isTargetOwner || isOwner));

                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-full border border-border">
                            <AvatarFallback className="bg-secondary text-[11px] font-semibold text-foreground">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-foreground">
                                {displayName}
                              </span>
                              {isSelf && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {m.user?.email || m.user_id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {canEditThisRole && !isTargetOwner ? (
                          <select
                            value={m.role}
                            disabled={updatingMemberId === m.user_id}
                            onChange={(e) =>
                              handleRoleChange(m.user_id, e.target.value)
                            }
                            aria-label={`Change role for ${displayName}`}
                            className="h-7 rounded border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="guest">Guest</option>
                            <option value="viewer">Viewer</option>
                            {isOwner && <option value="owner">Owner</option>}
                          </select>
                        ) : (
                          <Badge
                            variant={isTargetOwner ? "default" : "outline"}
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

                      <TableCell className="text-end">
                        {canRemoveThisMember && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMemberToRemove(m)}
                            className={
                              isSelf
                                ? "h-7 gap-1 px-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                                : "h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            }
                            title={
                              isSelf ? "Leave workspace" : "Remove member"
                            }
                          >
                            {isSelf ? (
                              <>
                                <LogOut className="h-3.5 w-3.5" />
                                <span>Leave</span>
                              </>
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pending Invitations Section (Admins & Owners) */}
      {isAdminOrOwner && invitations.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Pending Invitations ({invitations.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Single-use invitation tokens awaiting acceptance by the invitee.
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Single-Use Token</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-xs font-medium text-foreground">
                      {inv.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {inv.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="max-w-[140px] truncate text-muted-foreground">
                          {inv.token}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(inv.token)}
                          title="Copy token to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {new Date(inv.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member to Workspace</DialogTitle>
            <DialogDescription>
              Generate a single-use invitation token for the user to join this
              workspace.
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
                  <strong className="text-foreground">{inviteEmail}</strong>:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={generatedInviteToken}
                    readOnly
                    className="bg-card font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedInviteToken)}
                    className="shrink-0 gap-1.5"
                  >
                    {copiedToken ? (
                      <Check className="h-4 w-4 text-emerald-500" />
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
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
                >
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
                <Label htmlFor="invite-role">Assigned Role</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target.value as "admin" | "member" | "guest" | "viewer"
                    )
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
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
              Directly attach an existing registered user to this organization
              using their User UUID.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            {addError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
              >
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
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-role">Assigned Role</Label>
              <select
                id="add-role"
                value={addRole}
                onChange={(e) =>
                  setAddRole(
                    e.target.value as "admin" | "member" | "guest" | "viewer"
                  )
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
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

      {/* Remove Member / Leave Workspace Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title={
          memberToRemove?.user_id === currentUserId
            ? "Leave Workspace"
            : "Remove Member"
        }
        description={
          memberToRemove?.user_id === currentUserId
            ? "Are you sure you want to leave this workspace? You will lose access to its projects, boards, and tasks."
            : `Are you sure you want to remove ${
                memberToRemove?.user?.full_name ||
                memberToRemove?.user?.email ||
                "this member"
              } from the workspace?`
        }
        confirmLabel={
          isRemovingMember
            ? "Processing..."
            : memberToRemove?.user_id === currentUserId
              ? "Leave Workspace"
              : "Remove Member"
        }
        isDestructive={true}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
