---
name: react
description: React 18/19 patterns, state lifecycle, hooks rules, and performance guidelines.
---

# React Skill

## Rules

1. **Stable State Ownership**: Keep state close to the component that needs it. Don't lift state higher than necessary.
2. **Clean Effects**: Avoid using `useEffect` for data transformation or calculated values; derive them during render.
3. **Controlled Primitives**: Build accessible form inputs with React Hook Form and controlled state where necessary.
4. **Keys in Lists**: Always use stable unique IDs (`item.id`), never array indices, when rendering lists.
