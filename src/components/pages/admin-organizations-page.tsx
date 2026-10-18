"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Building2,
  Users,
  Eye,
  RefreshCw,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Trash2,
  UserPlus,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { adminService } from "@/services/admin-service";
import type {
  OrganizationResponse,
  OrganizationMembershipResponse,
} from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";

const VALID_ROLES = ["owner", "admin", "member", "guest", "viewer"] as const;

export function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>(
    []
  );
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Org Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Org Details & Members Dialog
  const [selectedOrg, setSelectedOrg] = useState<OrganizationResponse | null>(
    null
  );
  const [members, setMembers] = useState<OrganizationMembershipResponse[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberActionError, setMemberActionError] = useState<string | null>(
    null
  );

  // Add Member form
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<
    "owner" | "admin" | "member" | "guest" | "viewer"
  >("member");
  const [isAddingMember, setIsAddingMember] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getOrganizations({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        is_active:
          activeFilter === "all" ? undefined : activeFilter === "active",
      });
      setOrganizations(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Unable to load organization list from backend.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, activeFilter]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Fetch members when an org is opened
  const openOrgDetails = async (org: OrganizationResponse) => {
    setSelectedOrg(org);
    setMemberActionError(null);
    setIsLoadingMembers(true);
    try {
      const data = await adminService.getOrganizationMembers(org.id);
      setMembers(data.items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setMemberActionError(err.message);
      } else {
        setMemberActionError("Failed to load organization members.");
      }
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createName.trim() || !createSlug.trim()) {
      setCreateError("Organization name and slug are required.");
      return;
    }

    setIsCreating(true);
    try {
      await adminService.createOrganization({
        name: createName.trim(),
        slug: createSlug.trim().toLowerCase(),
      });
      setIsCreateOpen(false);
      setCreateName("");
      setCreateSlug("");
      fetchOrganizations();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setCreateError(err.message);
      } else {
        setCreateError("Failed to create organization.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoleValue: string) => {
    if (!selectedOrg) return;
    setMemberActionError(null);
    try {
      const updated = await adminService.updateOrganizationMember(
        selectedOrg.id,
        userId,
        {
          role: newRoleValue as (typeof VALID_ROLES)[number],
        }
      );
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? updated : m))
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setMemberActionError(err.message);
      } else {
        setMemberActionError("Failed to update membership role.");
      }
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedOrg) return;
    setMemberActionError(null);
    try {
      await adminService.removeOrganizationMember(selectedOrg.id, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      if (err instanceof ApiClientError) {
        setMemberActionError(err.message);
      } else {
        setMemberActionError("Failed to remove member.");
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !newUserId.trim()) return;
    setMemberActionError(null);
    setIsAddingMember(true);
    try {
      const added = await adminService.addOrganizationMember(selectedOrg.id, {
        user_id: newUserId.trim(),
        role: newRole,
      });
      setMembers((prev) => [...prev, added]);
      setNewUserId("");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setMemberActionError(err.message);
      } else {
        setMemberActionError("Failed to add member to organization.");
      }
    } finally {
      setIsAddingMember(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <PageContainer>
      <PageHeader
        title="Organization Management"
        description="Manage workspace tenants, inspect memberships, and govern administrative access."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrganizations}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Organization</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveFilter("all");
              setPage(1);
            }}
          >
            All
          </Button>
          <Button
            variant={activeFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveFilter("active");
              setPage(1);
            }}
          >
            Active
          </Button>
          <Button
            variant={activeFilter === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveFilter("inactive");
              setPage(1);
            }}
          >
            Inactive
          </Button>
        </div>
      </div>

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
            onClick={fetchOrganizations}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Organizations Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <EmptyState
            title="No Organizations Found"
            description="There are no workspace organizations matching the search criteria."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {org.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {org.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.is_active ? "success" : "destructive"}>
                      {org.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(org.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openOrgDetails(org)}
                      className="h-8 gap-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Members</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {organizations.length} of {total} organizations
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="h-8 gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </Button>
          <span className="font-medium text-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="h-8 gap-1"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Create Organization Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Provision a new workspace organization tenant in TaskFlow.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrg} className="space-y-4 py-2">
            {createError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Organization Name
              </label>
              <Input
                placeholder="Acme Corp"
                value={createName}
                onChange={(e) => {
                  const val = e.target.value;
                  setCreateName(val);
                  setCreateSlug(
                    val
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")
                  );
                }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Organization Slug (kebab-case)
              </label>
              <Input
                placeholder="acme-corp"
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value.toLowerCase())}
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                title="Lowercase letters, numbers, and hyphens only (e.g. acme-corp)"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Organization Details & Membership Modal */}
      <Dialog
        open={Boolean(selectedOrg)}
        onOpenChange={(open) => !open && setSelectedOrg(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>{selectedOrg?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Slug:{" "}
              <span className="font-mono text-xs">{selectedOrg?.slug}</span> •
              ID:{" "}
              <span className="select-all font-mono text-xs">
                {selectedOrg?.id}
              </span>
            </DialogDescription>
          </DialogHeader>

          {memberActionError && (
            <div
              role="alert"
              className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{memberActionError}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMemberActionError(null)}
                className="h-6 px-2 text-xs"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Add Member form */}
          <form
            onSubmit={handleAddMember}
            className="flex flex-col items-center gap-2 rounded-lg border border-border/80 bg-muted/40 p-3 sm:flex-row"
          >
            <Input
              placeholder="User ID (UUID)..."
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="h-8 font-mono text-xs"
              required
            />
            <select
              value={newRole}
              onChange={(e) =>
                setNewRole(e.target.value as (typeof VALID_ROLES)[number])
              }
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {VALID_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              size="sm"
              disabled={isAddingMember}
              className="h-8 shrink-0 gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Member</span>
            </Button>
          </form>

          {/* Members List */}
          <div className="space-y-2 pt-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Organization Members ({members.length})</span>
            </h4>

            {isLoadingMembers ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : members.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No members found in this organization.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-end">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">
                              {m.user?.full_name ||
                                m.user?.email ||
                                "Unknown User"}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {m.user_id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            value={m.role}
                            onChange={(e) =>
                              handleRoleChange(m.user_id, e.target.value)
                            }
                            className="h-7 rounded border border-input bg-background px-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {VALID_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={m.is_active ? "success" : "destructive"}
                          >
                            {m.is_active ? "active" : "inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(m.user_id)}
                            title="Remove member (protected if last owner)"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedOrg(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
