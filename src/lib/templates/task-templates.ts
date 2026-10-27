export interface TaskTemplate {
  id: string;
  name: string;
  descriptionSnippet: string;
  type: "task" | "bug" | "story" | "epic" | "subtask" | "milestone";
  priority: "lowest" | "low" | "medium" | "high" | "urgent";
  titlePrefix: string;
  descriptionTemplate: string;
  isCustom?: boolean;
}

export const STANDARD_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "standard-bug",
    name: "Bug Report",
    descriptionSnippet: "Reproduction steps, expected vs actual behavior, and environment.",
    type: "bug",
    priority: "high",
    titlePrefix: "[Bug]: ",
    descriptionTemplate: `### Steps to Reproduce
1. Navigate to 
2. Click on 
3. Observe unexpected behavior

### Expected Behavior


### Actual Behavior


### Environment
- Browser / Client: 
- OS / Platform: 
- Additional Logs: `,
  },
  {
    id: "standard-story",
    name: "User Story",
    descriptionSnippet: "Standard agile story with persona, goal, and acceptance criteria.",
    type: "story",
    priority: "medium",
    titlePrefix: "[Story]: ",
    descriptionTemplate: `### User Story
As a **[role / user persona]**,
I want to **[perform an action / feature]**,
So that **[expected benefit / outcome]**.

### Acceptance Criteria
- [ ] Scenario 1: Given [context], when [action], then [outcome]
- [ ] Scenario 2: Error handling verifies edge cases
- [ ] Scenario 3: Performance & security requirements met`,
  },
  {
    id: "standard-tech-task",
    name: "Technical Task",
    descriptionSnippet: "Engineering task with architecture context, checklist, and verification.",
    type: "task",
    priority: "medium",
    titlePrefix: "[Task]: ",
    descriptionTemplate: `### Objective


### Technical Implementation
1. 
2. 

### Verification & Testing
- [ ] Unit tests added / updated
- [ ] Regression checks passed
- [ ] Documentation updated`,
  },
  {
    id: "standard-milestone",
    name: "Milestone Deliverable",
    descriptionSnippet: "Key project milestone target with high-level deliverable criteria.",
    type: "milestone",
    priority: "urgent",
    titlePrefix: "[Milestone]: ",
    descriptionTemplate: `### Milestone Overview


### Deliverable Checklist
- [ ] Architecture review approved
- [ ] Feature implementation completed
- [ ] Staging QA sign-off
- [ ] Production release ready`,
  },
];

const STORAGE_PREFIX = "taskflow_custom_templates_";

export function getCustomTemplates(projectId: string): TaskTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomTemplate(
  projectId: string,
  template: Omit<TaskTemplate, "id" | "isCustom">
): TaskTemplate {
  const existing = getCustomTemplates(projectId);
  const newTemplate: TaskTemplate = {
    ...template,
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    isCustom: true,
  };
  const updated = [newTemplate, ...existing];
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${projectId}`,
      JSON.stringify(updated)
    );
  } catch (e) {
    console.error("Failed to persist custom template to localStorage", e);
  }
  return newTemplate;
}

export function deleteCustomTemplate(
  projectId: string,
  templateId: string
): void {
  const existing = getCustomTemplates(projectId);
  const filtered = existing.filter((t) => t.id !== templateId);
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${projectId}`,
      JSON.stringify(filtered)
    );
  } catch (e) {
    console.error("Failed to delete custom template from localStorage", e);
  }
}

export function getAllTemplates(projectId: string): TaskTemplate[] {
  const custom = getCustomTemplates(projectId);
  return [...STANDARD_TASK_TEMPLATES, ...custom];
}
