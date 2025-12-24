import { ROLE_TASK_TEMPLATES } from "./roleTemplates";

export function getRoleTaskTemplates(role: string) {
  return ROLE_TASK_TEMPLATES[role.toLowerCase()] || ROLE_TASK_TEMPLATES.developer;
}

export function calculateProgress(completedSteps: number[], totalSteps: number): number {
  return Math.round((completedSteps.length / totalSteps) * 100);
}

export function determineStatus(progress: number): "in_progress" | "completed" {
  return progress === 100 ? "completed" : "in_progress";
}
