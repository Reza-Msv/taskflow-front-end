import React from "react";
import { motion } from "motion/react";
import type { SampleTask } from "./demo-data";

interface DemoListViewProps {
  tasks: SampleTask[];
}

export function DemoListView({ tasks }: DemoListViewProps) {
  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="overflow-x-auto"
    >
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border font-semibold text-muted-foreground">
            <th className="px-3 py-3">Key</th>
            <th className="px-3 py-3">Summary</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Priority</th>
            <th className="px-3 py-3">Assignee</th>
            <th className="px-3 py-3">Sprint</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {tasks.map((task) => (
            <tr
              key={task.id}
              className="transition-colors hover:bg-secondary/40"
            >
              <td className="px-3 py-3 font-mono font-semibold text-foreground">
                {task.id}
              </td>
              <td className="px-3 py-3 font-medium text-foreground">
                {task.title}
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${task.statusColor}`}
                >
                  {task.status}
                </span>
              </td>
              <td className="px-3 py-3 text-muted-foreground">
                {task.priority}
              </td>
              <td className="px-3 py-3 font-medium text-foreground">
                {task.assignee}
              </td>
              <td className="px-3 py-3 font-mono text-muted-foreground">
                {task.sprint}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
