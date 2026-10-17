"use client";

import React, { useState } from "react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { KanbanBoard } from "@/components/shared/kanban-board";
import { FilterBar } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskCardProps } from "@/components/shared/task-card";

const initialTasks: TaskCardProps[] = [
  {
    id: "task-1",
    issueKey: "TF-101",
    title: "Implement semantic CSS variables in globals.css",
    status: "done",
    priority: "high",
    assigneeName: "Reza",
    commentsCount: 3,
  },
  {
    id: "task-2",
    issueKey: "TF-102",
    title: "Build responsive AppSidebar and mobile Sheet drawer",
    status: "inprogress",
    priority: "urgent",
    assigneeName: "Ali",
    commentsCount: 1,
    attachmentsCount: 2,
  },
  {
    id: "task-3",
    issueKey: "TF-103",
    title: "Configure next-themes provider with suppressHydrationWarning",
    status: "inreview",
    priority: "medium",
    assigneeName: "Sara",
  },
  {
    id: "task-4",
    issueKey: "TF-104",
    title: "Draft sprint planning burndown calculations in backend",
    status: "todo",
    priority: "low",
    assigneeName: "Nadia",
  },
];

export function ProjectBoardPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filteredTasks = initialTasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = status === "all" || task.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Sprint 24 Board"
        description="Active work items in current development cycle."
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        statusFilter={status}
        onStatusFilterChange={setStatus}
      />

      <KanbanBoard tasks={filteredTasks} />
    </PageContainer>
  );
}
