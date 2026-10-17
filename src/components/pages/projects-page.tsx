"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { ProjectCard } from "@/components/shared/project-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";

export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Manage workspaces, active sprints, and collaborative engineering projects."
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        statusFilter={status}
        onStatusFilterChange={setStatus}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ProjectCard
          id="tf-core"
          key="TF"
          name="TaskFlow Core Engine"
          description="Central platform services, FastAPI API router, and PostgreSQL database migrations."
          activeTasksCount={18}
          membersCount={6}
          status="active"
        />
        <ProjectCard
          id="tf-web"
          key="WEB"
          name="Web Application UI"
          description="Next.js App Router client, design token system, and responsive work board."
          activeTasksCount={12}
          membersCount={4}
          status="active"
        />
      </div>
    </PageContainer>
  );
}
