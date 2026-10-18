"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  UserX,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Eye,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
import type { UserResponse } from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";
import { useAuth } from "@/modules/auth/context/auth-context";

export function AdminUsersPage() {
  const { user: currentAuthUser } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User details dialog state
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        is_active:
          activeFilter === "all" ? undefined : activeFilter === "active",
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Unable to load user list from backend.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, activeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (userToUpdate: UserResponse) => {
    setActionError(null);
    if (currentAuthUser?.id === userToUpdate.id) {
      setActionError(
        "You cannot deactivate your own administrative account (CANNOT_DEACTIVATE_SELF)."
      );
      return;
    }

    setIsActionLoading(true);
    try {
      const updated = await adminService.updateUser(userToUpdate.id, {
        is_active: !userToUpdate.is_active,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      if (selectedUser?.id === updated.id) {
        setSelectedUser(updated);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to update user status.");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <PageContainer>
      <PageHeader
        title="User Management"
        description="Search, view profile details, and toggle account activation status."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
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
            onClick={fetchUsers}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionError(null)}
            className="h-6 px-2 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="There are no user accounts matching the specified filters."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Privileges</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((item) => {
                const isSelf = currentAuthUser?.id === item.id;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {item.full_name || "Anonymous User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.is_active ? "success" : "destructive"}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.is_superuser ? (
                        <Badge variant="default" className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Superuser</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(item)}
                          className="h-8 gap-1.5"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Details</span>
                        </Button>
                        <Button
                          variant={item.is_active ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleStatus(item)}
                          disabled={isActionLoading || isSelf}
                          title={
                            isSelf
                              ? "Cannot deactivate self"
                              : item.is_active
                                ? "Deactivate account"
                                : "Activate account"
                          }
                          className="h-8 gap-1.5"
                        >
                          {item.is_active ? (
                            <>
                              <UserX className="h-3.5 w-3.5 text-destructive" />
                              <span className="hidden sm:inline">
                                Deactivate
                              </span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Activate</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {users.length} of {total} users
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

      {/* User Details Dialog */}
      <Dialog
        open={Boolean(selectedUser)}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
            <DialogDescription>
              Backend administrative record for user identification and audit.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">User ID:</span>
                <span className="col-span-2 select-all font-mono text-xs text-foreground">
                  {selectedUser.id}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="col-span-2 font-medium text-foreground">
                  {selectedUser.full_name || "—"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Email:</span>
                <span className="col-span-2 text-foreground">
                  {selectedUser.email}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Status:</span>
                <span className="col-span-2">
                  <Badge
                    variant={selectedUser.is_active ? "success" : "destructive"}
                  >
                    {selectedUser.is_active ? "Active" : "Inactive"}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Superuser:</span>
                <span className="col-span-2 text-foreground">
                  {selectedUser.is_superuser ? "Yes (Superuser)" : "No"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Created:</span>
                <span className="col-span-2 text-xs text-muted-foreground">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Updated:</span>
                <span className="col-span-2 text-xs text-muted-foreground">
                  {new Date(selectedUser.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex w-full items-center sm:justify-between">
            {selectedUser && (
              <Button
                variant={selectedUser.is_active ? "outline" : "default"}
                size="sm"
                onClick={() => handleToggleStatus(selectedUser)}
                disabled={
                  isActionLoading || currentAuthUser?.id === selectedUser.id
                }
              >
                {selectedUser.is_active
                  ? "Deactivate Account"
                  : "Activate Account"}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedUser(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
