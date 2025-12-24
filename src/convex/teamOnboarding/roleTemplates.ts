// Role-based task templates configuration
export const ROLE_TASK_TEMPLATES: Record<string, Array<{ title: string; description: string; priority: "low" | "medium" | "high"; dueInDays: number }>> = {
  developer: [
    { title: "Set up development environment", description: "Install required tools and access repositories", priority: "high", dueInDays: 1 },
    { title: "Complete security training", description: "Review security policies and best practices", priority: "high", dueInDays: 2 },
    { title: "Review codebase architecture", description: "Understand system design and patterns", priority: "medium", dueInDays: 3 },
    { title: "Complete first code review", description: "Participate in team code review process", priority: "medium", dueInDays: 5 },
  ],
  designer: [
    { title: "Access design tools", description: "Set up Figma, Adobe Creative Suite, etc.", priority: "high", dueInDays: 1 },
    { title: "Review brand guidelines", description: "Study company brand identity and standards", priority: "high", dueInDays: 2 },
    { title: "Meet with design team", description: "Introduction to design processes and workflows", priority: "medium", dueInDays: 3 },
    { title: "Complete first design task", description: "Work on assigned design project", priority: "medium", dueInDays: 7 },
  ],
  marketing: [
    { title: "Access marketing platforms", description: "Set up accounts for social media, analytics, etc.", priority: "high", dueInDays: 1 },
    { title: "Review marketing strategy", description: "Understand current campaigns and goals", priority: "high", dueInDays: 2 },
    { title: "Meet key stakeholders", description: "Connect with sales, product, and content teams", priority: "medium", dueInDays: 3 },
    { title: "Create first campaign", description: "Launch your first marketing initiative", priority: "medium", dueInDays: 7 },
  ],
  sales: [
    { title: "CRM system training", description: "Learn to use Salesforce/HubSpot", priority: "high", dueInDays: 1 },
    { title: "Product knowledge training", description: "Deep dive into product features and benefits", priority: "high", dueInDays: 2 },
    { title: "Shadow senior sales rep", description: "Observe sales calls and demos", priority: "medium", dueInDays: 3 },
    { title: "Complete first demo", description: "Deliver product demo to prospect", priority: "medium", dueInDays: 10 },
  ],
  manager: [
    { title: "HR systems access", description: "Set up access to HRIS, payroll, performance tools", priority: "high", dueInDays: 1 },
    { title: "Leadership training", description: "Complete management fundamentals course", priority: "high", dueInDays: 3 },
    { title: "Team introductions", description: "Meet with all direct reports individually", priority: "high", dueInDays: 5 },
    { title: "Set team goals", description: "Establish quarterly objectives with team", priority: "medium", dueInDays: 14 },
  ],
};
