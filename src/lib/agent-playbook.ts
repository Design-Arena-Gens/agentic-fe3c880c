/**
 * Baseline agent configuration shared with the UI. Extend this to add
 * domain-specific roles or guardrails when integrating into real workflows.
 */
export const AGENT_ROLES = [
  {
    id: "strategist",
    title: "Product Strategist",
    focus:
      "Identifies the user-facing value, edge cases, and business constraints.",
  },
  {
    id: "architect",
    title: "Systems Architect",
    focus:
      "Tames complexity with composable boundaries and robust integrations.",
  },
  {
    id: "engineer",
    title: "Implementation Engineer",
    focus:
      "Transforms the plan into production-grade code with safety nets.",
  },
  {
    id: "qa",
    title: "Quality Steward",
    focus:
      "Provides verification strategy, instrumentation, and release gating.",
  },
] as const;

export type AgentRoleId = (typeof AGENT_ROLES)[number]["id"];

export const DEFAULT_GUARDRAILS = [
  "Enforce type safety across internal contracts.",
  "Fail closed on third-party API outages.",
  "Prefer deterministic pure functions for critical paths.",
  "Maintain exhaustive test coverage for state machines.",
];

