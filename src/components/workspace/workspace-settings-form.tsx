"use client";

import React, { useState } from "react";
import {
  Building2,
  Save,
  Trash2,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Lock,
} from "lucide-react";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { organizationService } from "@/services/organization-service";
import { organizationUpdateSchema } from "@/lib/schemas/org-project-schemas";
import type { OrganizationResponse } from "@/services/generated/api-types";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";

export interface WorkspaceSettingsFormProps {
  organization: OrganizationResponse;
  userRole: string | null;
  isSuperuser?: boolean;
  onUpdated?: (updated: OrganizationResponse) => void;
  onDeleted?: () => void;
}

export function WorkspaceSettingsForm({
  organization,
  userRole,
  isSuperuser = false,
  onUpdated,
  onDeleted,
}: WorkspaceSettingsFormProps) {
  const isOwner = userRole === "owner" || isSuperuser;
  const canEdit = isOwner || userRole === "admin";

  const [name, setName] = useState(organization.name);
  const [isActive, setIsActive] = useState(organization.is_active);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Danger Zone: Delete Workspace
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setServerError(null);
    setFieldErrors({});

    const result = organizationUpdateSchema.safeParse({
      name: name.trim(),
      is_active: isActive,
    });

    if (!result.success) {
      const errors: { name?: string } = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === "name") errors.name = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await organizationService.updateOrganization(
        organization.id,
        {
          name: name.trim(),
          is_active: isActive,
        }
      );
      toast.success("Workspace settings updated successfully");
      onUpdated?.(updated);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setServerError(err.message || "Failed to update workspace settings");
        toast.error(err.message || "Failed to update workspace settings");
      } else {
        const fallback = "Network error while saving settings";
        setServerError(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isOwner) return;
    setIsDeleting(true);
    try {
      await organizationService.deleteOrganization(organization.id);
      toast.success(`Workspace "${organization.name}" was permanently deleted`);
      onDeleted?.();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to delete workspace");
      } else {
        toast.error("Failed to delete workspace");
      }
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Workspace Metadata
              </CardTitle>
              <CardDescription>
                Configure primary identification and status for this workspace.
              </CardDescription>
            </div>
            {!canEdit && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Lock className="h-3 w-3" />
                <span>Read-Only</span>
              </Badge>
            )}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
              >
                {serverError}
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Workspace Display Name</Label>
              <Input
                id="ws-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit || isSaving}
                placeholder="Acme Corporation"
                className={fieldErrors.name ? "border-destructive" : ""}
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              )}
            </div>

            {/* Unique Slug (Read-only per API contract) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ws-slug">Workspace Identifier (Slug)</Label>
                <span className="text-[11px] text-muted-foreground">
                  Immutable URI identifier
                </span>
              </div>
              <Input
                id="ws-slug"
                name="slug"
                value={organization.slug}
                disabled
                readOnly
                className="bg-muted/50 font-mono text-xs text-muted-foreground"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5">
              <input
                type="checkbox"
                id="ws-active"
                name="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={!canEdit || isSaving}
                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <div className="space-y-0.5">
                <Label
                  htmlFor="ws-active"
                  className="cursor-pointer text-xs font-medium text-foreground"
                >
                  Active Workspace Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  When active, members can access tasks, sprints, boards, and
                  reports. Deactivating places the workspace in maintenance mode.
                </p>
              </div>
            </div>

            {/* Metadata Summary */}
            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  Created on{" "}
                  <strong className="text-foreground">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>
                  Last modified{" "}
                  <strong className="text-foreground">
                    {new Date(organization.updated_at).toLocaleDateString()}
                  </strong>
                </span>
              </div>
            </div>
          </CardContent>

          {canEdit && (
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || !name.trim()}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Saving Changes..." : "Save Settings"}</span>
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      {/* Danger Zone Card (Owner only) */}
      {isOwner && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">
                Danger Zone
              </CardTitle>
            </div>
            <CardDescription className="text-destructive/80">
              Irreversible actions that affect all projects, tasks, and members in
              this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Permanently Delete Workspace
                </p>
                <p className="text-xs text-muted-foreground">
                  Deleting this workspace will immediately remove all associated
                  projects, sprints, tasks, and member relationships.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="shrink-0 gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Workspace</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog for Workspace Deletion */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Workspace"
        description={`Are you absolutely sure you want to delete "${organization.name}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Permanently Delete"}
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
