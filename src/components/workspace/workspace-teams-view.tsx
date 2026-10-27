"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FolderKanban,
  Shield,
  Layers,
  ArrowRight,
  Info,
  ExternalLink,
  Kanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type {
  OrganizationResponse,
  OrganizationMembershipResponse,
  ProjectResponse,
} from "@/services/generated/api-types";

export interface WorkspaceTeamsViewProps {
  organization: OrganizationResponse;
  members: OrganizationMembershipResponse[];
  projects: ProjectResponse[];
  currentUserRole: string | null;
}

export function WorkspaceTeamsView({
  organization,
  members,
  projects,
  currentUserRole,
}: WorkspaceTeamsViewProps) {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";

  // Role distribution
  const ownersCount = members.filter((m) => m.role === "owner").length;
  const adminsCount = members.filter((m) => m.role === "admin").length;
  const standardMembersCount = members.filter(
    (m) => m.role === "member"
  ).length;
  const guestsViewersCount = members.filter(
    (m) => m.role === "guest" || m.role === "viewer"
  ).length;

  return (
    <div className="space-y-6">
      {/* Informative Architectural Context Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Workspace & Cross-Functional Team Architecture
          </p>
          <p className="text-muted-foreground">
            In TaskFlow, functional teams operate cross-functionally within
            projects under the centralized governance of this workspace.
            Organization members can be assigned dedicated project team roles
            (Admin, Member, Viewer) with autonomous sprint boards and backlogs.
          </p>
        </div>
      </div>

      {/* Workspace Team Metrics Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Team Members
            </span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {members.length}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{ownersCount} Owners</span>
            <span>•</span>
            <span>{adminsCount} Admins</span>
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Active Project Teams
            </span>
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {projects.filter((p) => !p.is_archived).length}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {projects.length} Total Projects Configured
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Core Contributors
            </span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {standardMembersCount}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Active full-access collaborators
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Guests & Viewers
            </span>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {guestsViewersCount}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Restricted access members
          </div>
        </Card>
      </div>

      {/* Project Teams Breakdown Table */}
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Project Team Rosters
            </CardTitle>
            <CardDescription>
              Teams assigned to individual projects across this workspace.
            </CardDescription>
          </div>
          <Link
            href={`/${currentLocale}/organizations/${organization.id}/projects`}
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Manage Projects</span>
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Key</TableHead>
                  <TableHead>Project Team</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-xs text-muted-foreground"
                    >
                      No projects currently exist in this workspace. Create a
                      project to assemble project teams.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs font-bold"
                        >
                          {p.key}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">
                            {p.name}
                          </span>
                          {p.description && (
                            <span className="line-clamp-1 max-w-[280px] text-[11px] text-muted-foreground">
                              {p.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {p.is_private ? "Private Team" : "Public"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.is_archived ? "secondary" : "success"}
                        >
                          {p.is_archived ? "Archived" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/${currentLocale}/organizations/${organization.id}/projects/${p.id}/board`}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 px-2 text-xs"
                              title="Go to Kanban Board"
                            >
                              <Kanban className="h-3 w-3" />
                              <span className="hidden sm:inline">Board</span>
                            </Button>
                          </Link>
                          <Link
                            href={`/${currentLocale}/organizations/${organization.id}/projects/${p.id}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 px-2 text-xs"
                              title="Manage Team & Project Details"
                            >
                              <Users className="h-3 w-3" />
                              <span className="hidden sm:inline">Team</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
