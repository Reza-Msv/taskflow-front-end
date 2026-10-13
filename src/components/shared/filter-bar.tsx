"use client";

import React, { useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  label: string;
  value: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions = [
    { label: "All", value: "all" },
    { label: "Todo", value: "todo" },
    { label: "In Progress", value: "inprogress" },
    { label: "Done", value: "done" },
  ],
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  statusOptions?: FilterOption[];
}) {
  return (
    <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter tasks..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 ps-9 text-xs"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Status Filter Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <span className="me-1 flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" />
          Status:
        </span>
        {statusOptions.map((opt) => {
          const isSelected = statusFilter === opt.value;
          return (
            <Badge
              key={opt.value}
              variant={isSelected ? "default" : "secondary"}
              className="shrink-0 cursor-pointer px-2.5 py-1 text-xs transition-colors"
              onClick={() => onStatusFilterChange(opt.value)}
            >
              {opt.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
