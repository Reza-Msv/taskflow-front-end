"use client";

import React from "react";
import {
  Users,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { WorkloadReport } from "@/services/reports-service";
import { cn } from "@/lib/utils";

export interface TeamWorkloadTableProps {
  workload: WorkloadReport;
  className?: string;
}

export function TeamWorkloadTable({
  workload,
  className,
}: TeamWorkloadTableProps) {
  const { members, unassignedTasks } = workload;

  const totalAssignedAcrossTeam = members.reduce(
    (acc, m) => acc + m.assignedTasks,
    0
  );
  const totalTasks = totalAssignedAcrossTeam + unassignedTasks;

  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm",
        className
      )}
      data-testid="team-workload-table"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">
              Team Workload & Assignment Distribution
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Current task allocations and active assignments across project
            members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-normal">
            {members.length} {members.length === 1 ? "member" : "members"}
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal">
            {totalAssignedAcrossTeam} assigned
          </Badge>
        </div>
      </div>

      {/* Unassigned Tasks Banner */}
      {unassignedTasks > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <UserX className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <strong>{unassignedTasks}</strong>{" "}
              {unassignedTasks === 1 ? "task is" : "tasks are"} currently
              unassigned to any team member.
            </span>
          </div>
          <span className="text-[11px] opacity-80">Requires triage</span>
        </div>
      )}

      {/* Members Workload Table */}
      {members.length === 0 ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <Users className="mb-2 h-7 w-7 opacity-60" />
          <p className="text-sm font-medium text-foreground">
            No project members found
          </p>
          <p className="mt-1 text-xs">
            Add members to this project to track team workload.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-xs"
            aria-label="Team Workload Table"
          >
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">Team Member</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5 text-right">Assigned</th>
                <th className="px-3 py-2.5 text-right">In Progress</th>
                <th className="px-3 py-2.5 text-right">Overdue</th>
                <th className="px-3 py-2.5 text-right">Completed</th>
                <th className="w-40 px-3 py-2.5">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                const initials =
                  member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "TM";

                const assigned = member.assignedTasks;
                const completed = member.completedTasks;
                const inProgress = member.inProgressTasks;
                const overdue = member.overdueTasks;
                const open = Math.max(0, assigned - completed - inProgress);

                const compPct = assigned > 0 ? (completed / assigned) * 100 : 0;
                const inProgPct =
                  assigned > 0 ? (inProgress / assigned) * 100 : 0;
                const openPct = assigned > 0 ? (open / assigned) * 100 : 0;

                return (
                  <tr
                    key={member.userId}
                    className="transition-colors hover:bg-muted/20"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-border text-xs">
                          {member.avatarUrl && (
                            <AvatarImage
                              src={member.avatarUrl}
                              alt={member.name}
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">
                            {member.name}
                          </div>
                          {member.email && (
                            <div className="text-[10px] text-muted-foreground">
                              {member.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 capitalize">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal"
                      >
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-foreground">
                      {assigned}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-sky-500">
                      {inProgress}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {overdue > 0 ? (
                        <span className="flex items-center justify-end gap-1 font-bold text-rose-500">
                          <AlertTriangle className="h-3 w-3" />
                          {overdue}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-500">
                      {completed}
                    </td>
                    <td className="px-3 py-3">
                      {assigned === 0 ? (
                        <span className="text-[11px] text-muted-foreground">
                          No tasks
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                            {/* Completed */}
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: `${compPct}%` }}
                              title={`${completed} completed`}
                            />
                            {/* In Progress */}
                            <div
                              className="h-full bg-sky-500 transition-all"
                              style={{ width: `${inProgPct}%` }}
                              title={`${inProgress} in progress`}
                            />
                            {/* Open */}
                            <div
                              className="h-full bg-muted-foreground/40 transition-all"
                              style={{ width: `${openPct}%` }}
                              title={`${open} open`}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-muted-foreground">
                            <span>{Math.round(compPct)}% done</span>
                            <span>{assigned} total</span>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Neutral guidance disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/80" />
        <p>
          <strong>Notice:</strong> Task assignment counts reflect current
          workload distribution and open assignments, not individual performance
          or productivity conclusively.
        </p>
      </div>
    </div>
  );
}
