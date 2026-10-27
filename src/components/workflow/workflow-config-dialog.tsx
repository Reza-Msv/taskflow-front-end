"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  workflowService,
  WORKFLOW_POLICIES,
  type WorkflowTransitionRule,
} from "@/services/workflow-service";
import type { WorkflowStatusResponse } from "@/services/generated/api-types";
import {
  GitMerge,
  Columns,
  ShieldCheck,
  Check,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";

export interface WorkflowConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  projectId: string;
  projectName?: string;
  initialStatuses?: WorkflowStatusResponse[];
}

export function WorkflowConfigDialog({
  isOpen,
  onClose,
  organizationId,
  projectId,
  projectName = "Project",
  initialStatuses,
}: WorkflowConfigDialogProps) {
  const [statuses, setStatuses] = useState<WorkflowStatusResponse[]>(
    initialStatuses || []
  );
  const [isLoading, setIsLoading] = useState(!initialStatuses?.length);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialStatuses && initialStatuses.length > 0) {
      setStatuses(initialStatuses);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    workflowService
      .getProjectWorkflowStatuses(organizationId, projectId)
      .then((data) => {
        if (isMounted) {
          setStatuses(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || "Failed to load workflow configuration");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, organizationId, projectId, initialStatuses]);

  const categoryGroups = workflowService.groupStatusesByCategory(statuses);
  const transitionMatrix = workflowService.computeTransitionMatrix(statuses);

  const getCategoryBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case "done":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[11px]"
          >
            Done
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary text-[11px]"
          >
            In Progress
          </Badge>
        );
      case "review":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-[11px]"
          >
            Review
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[11px]">
            To Do
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <GitMerge className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Workflow & Lifecycle Configuration
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Inspect workflow stages, state transition rules, and governance policies for {projectName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-xs text-destructive">
            {error}
          </div>
        ) : (
          <Tabs defaultValue="statuses" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="statuses" className="gap-1.5 text-xs">
                <Columns className="h-3.5 w-3.5" />
                <span>Workflow Stages ({statuses.length})</span>
              </TabsTrigger>
              <TabsTrigger value="transitions" className="gap-1.5 text-xs">
                <GitMerge className="h-3.5 w-3.5" />
                <span>Transition Matrix</span>
              </TabsTrigger>
              <TabsTrigger value="governance" className="gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Automations & Rules</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: WORKFLOW STAGES */}
            <TabsContent value="statuses" className="space-y-4 pt-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>
                  Work items progress through configured stages from left to right.
                  Default stages are automatically mapped to your Kanban board columns and Agile metrics.
                </p>
              </div>

              <div className="space-y-2.5">
                {statuses.map((st, index) => (
                  <div
                    key={st.id || index}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-mono font-bold text-muted-foreground">
                        {st.position || index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">
                            {st.name}
                          </span>
                          {st.is_default && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5 font-normal"
                            >
                              Initial Default
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Lifecycle Category: {st.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getCategoryBadge(st.category)}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 2: TRANSITION RULES MATRIX */}
            <TabsContent value="transitions" className="space-y-4 pt-4">
              <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  Lifecycle Transition Validation
                </p>
                <p>
                  Status movements are validated in real-time. Any disallowed transition is rejected by
                  server-enforced workflow validation rules with descriptive feedback.
                </p>
              </div>

              <div className="space-y-2">
                {transitionMatrix.slice(0, 8).map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-md border border-border/70 bg-background/50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {rule.fromStatusName}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        {rule.toStatusName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        {rule.policyNotes}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[10px] gap-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>Allowed</span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 3: AUTOMATIONS & GOVERNANCE */}
            <TabsContent value="governance" className="space-y-3 pt-4">
              <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  Enforced Project Governance & Automations
                </p>
                <p>
                  TaskFlow executes data integrity rules and automations transparently across the API and client interfaces.
                </p>
              </div>

              <div className="space-y-2.5">
                {WORKFLOW_POLICIES.map((policy) => (
                  <div
                    key={policy.key}
                    className="rounded-lg border border-border bg-card p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          {policy.title}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {policy.enforcement === "strict_db"
                          ? "Strict Concurrency"
                          : policy.enforcement === "server"
                          ? "Server Enforced"
                          : "Client Guard"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-5.5">
                      {policy.description}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end pt-3 border-t border-border mt-4">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
