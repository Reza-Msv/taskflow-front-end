import React from "react";
import { FolderKanban, MoreVertical, Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ProjectCardProps {
  id: string;
  name: string;
  key: string;
  description?: string;
  activeTasksCount: number;
  membersCount: number;
  status?: "active" | "archived" | "paused";
  onSelect?: (id: string) => void;
}

export function ProjectCard({
  id,
  name,
  key: projectKey,
  description,
  activeTasksCount,
  membersCount,
  status = "active",
  onSelect,
}: ProjectCardProps) {
  return (
    <Card className="group cursor-pointer hover:border-border-strong hover:bg-card-hover">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase text-primary">
              {projectKey}
            </span>
            <Badge
              variant={status === "active" ? "success" : "neutral"}
              className="capitalize"
            >
              {status}
            </Badge>
          </div>
          <CardTitle
            className="cursor-pointer text-base font-semibold transition-colors group-hover:text-primary"
            onClick={() => onSelect?.(id)}
          >
            {name}
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Project actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      {description && (
        <CardContent className="pb-3">
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        </CardContent>
      )}
      <CardFooter className="flex items-center justify-between border-t border-border-subtle pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{activeTasksCount} active tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{membersCount} members</span>
        </div>
      </CardFooter>
    </Card>
  );
}
