export type ConfidenceLevel = "high" | "medium" | "low";

export interface TechSummary {
  language: string;
  framework?: string | null;
  tools: string[];
  confidence: ConfidenceLevel;
  rationale: string;
}

export interface AgentStage {
  id: string;
  title: string;
  headline: string;
  bullets: string[];
  durationMs: number;
}

export interface GeneratedFile {
  path: string;
  description: string;
  language: string;
  content: string;
}

export interface AgentInsights {
  summary: string;
  risks: string[];
  nextSteps: string[];
  qaChecklist: string[];
}

export interface AgentResult {
  prompt: string;
  tech: TechSummary;
  stages: AgentStage[];
  files: GeneratedFile[];
  insights: AgentInsights;
  heuristics: string[];
}

interface TechCandidate {
  name: string;
  keywords: string[];
  framework?: string;
  tools?: string[];
}

const LANGUAGE_PRIORITIES: TechCandidate[] = [
  {
    name: "TypeScript",
    framework: "Next.js",
    keywords: [
      "next",
      "react",
      "frontend",
      "component",
      "typescript",
      "ts",
      "vercel",
    ],
    tools: ["Next.js App Router", "React Server Components", "Tailwind CSS"],
  },
  {
    name: "Python",
    framework: "FastAPI",
    keywords: ["python", "fastapi", "pydantic", "backend", "api"],
    tools: ["FastAPI", "uvicorn", "Pydantic"],
  },
  {
    name: "Go",
    framework: "Gin",
    keywords: ["golang", "go", "gin", "http"],
    tools: ["Gin", "Go Modules"],
  },
  {
    name: "Rust",
    framework: "Axum",
    keywords: ["rust", "axum", "cargo"],
    tools: ["Axum", "Tokio", "Serde"],
  },
  {
    name: "Java",
    framework: "Spring Boot",
    keywords: ["spring", "java", "spring boot"],
    tools: ["Spring Boot", "Maven"],
  },
];

const RISK_KEYWORDS: Record<string, string> = {
  auth: "Add role-based access control and secure credential storage.",
  realtime: "Validate concurrency strategy and ensure websocket back-pressure.",
  payment: "Run PCI compliance checks before introducing payment flows.",
  seo: "Provide metadata for SEO, open graph, and social previews.",
  analytics: "Respect user privacy by toggling analytics based on consent.",
  streaming: "Confirm the streaming transport supports backpressure.",
  ai: "Budget for API usage and implement graceful degradation when the model is unavailable.",
};

const QA_CHECKS = [
  "Unit tests added for core logic paths.",
  "Edge cases captured for invalid user inputs.",
  "Performance profiled for target browsers/devices.",
  "Accessibility reviewed with keyboard navigation and landmarks.",
];

const HEURISTICS = [
  "Decompose large features into independently testable slices.",
  "Treat external integrations as unreliable dependencies until proven otherwise.",
  "Prioritize short feedback loops and fast lint/test pipelines.",
  "Document assumptions directly alongside the generated artifacts.",
];

const fallbackTools = ["TypeScript", "Next.js App Router", "Tailwind CSS"];

function sanitizePrompt(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function detectTech(prompt: string): TechSummary {
  if (!prompt) {
    return {
      language: "TypeScript",
      framework: "Next.js",
      tools: fallbackTools,
      confidence: "low",
      rationale: "No prompt provided; defaulting to the house stack.",
    };
  }

  const lowered = prompt.toLowerCase();
  let bestCandidate: TechCandidate | null = null;
  let bestScore = 0;

  for (const candidate of LANGUAGE_PRIORITIES) {
    let score = 0;
    for (const keyword of candidate.keywords) {
      if (lowered.includes(keyword)) {
        score += keyword.split(" ").length > 1 ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  if (!bestCandidate) {
    return {
      language: "TypeScript",
      framework: "Next.js",
      tools: fallbackTools,
      confidence: "low",
      rationale: "Falling back to the opinionated TypeScript web stack.",
    };
  }

  const confidence: ConfidenceLevel =
    bestScore >= 4 ? "high" : bestScore >= 2 ? "medium" : "low";

  return {
    language: bestCandidate.name,
    framework: bestCandidate.framework,
    tools: bestCandidate.tools ?? [],
    confidence,
    rationale: `Detected domain-specific keywords for ${bestCandidate.name}${bestCandidate.framework ? ` with ${bestCandidate.framework}` : ""}.`,
  };
}

function extractHighlights(prompt: string): string[] {
  const segments = prompt
    .split(/[\.\n\r\u2022\-]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment.length <= 160);

  if (segments.length === 0) {
    return ["Clarify product requirements with the stakeholder."];
  }

  return segments.slice(0, 6);
}

function generateStages(highlights: string[], tech: TechSummary): AgentStage[] {
  const baseline: AgentStage[] = [
    {
      id: "explore",
      title: "Decode & Scope",
      headline: "Frame the request and lock the objective.",
      bullets: [
        "Capture explicit goals, constraints, and success signals.",
        "List out unknowns; surface clarifying questions quickly.",
        `Map initial requirements to ${tech.language} capabilities.`,
      ],
      durationMs: 400,
    },
    {
      id: "architect",
      title: "Architecture Sketch",
      headline: "Select boundaries, contracts, and core abstractions.",
      bullets: [
        `Design the high-level module layout around ${tech.framework ?? tech.language}.`,
        "Define data flow, state ownership, and integration seams.",
        "Choose patterns that keep iteration speed high.",
      ],
      durationMs: 520,
    },
    {
      id: "build",
      title: "Implement Feature Slices",
      headline: "Translate the plan into shippable increments.",
      bullets: [
        ...highlights.slice(0, 3).map((item) => `Deliver: ${item}`),
        "Instrument logging and metrics around risky branches.",
      ],
      durationMs: 760,
    },
    {
      id: "validate",
      title: "Hardening & QA",
      headline: "Verify correctness, resilience, and DX.",
      bullets: [
        "Author regression tests for the critical paths.",
        "Run accessibility sweep and perf smoke tests.",
        "Prepare release notes and deployment checklist.",
      ],
      durationMs: 380,
    },
  ];

  return baseline;
}

function generateFiles(tech: TechSummary, highlights: string[]): GeneratedFile[] {
  const sharedPreamble = `/**
 * Generated scaffold by the Coding Agent.
 * Tailor this file to match project conventions before shipping.
 */`;

  if (tech.framework === "Next.js") {
    const componentName = "GeneratedSolution";
    const summary = highlights.length > 0 ? highlights[0] : "core feature";

    return [
      {
        path: "src/components/GeneratedSolution.tsx",
        description: "Reference implementation for the requested feature.",
        language: "tsx",
        content: `${sharedPreamble}
import { useState } from "react";

interface Props {
  onComplete?: () => void;
}

const initialState = {
  status: "idle",
  log: [] as string[],
};

export function ${componentName}({ onComplete }: Props) {
  const [state, setState] = useState(initialState);

  const run = () => {
    setState((prev) => ({
      status: "running",
      log: [...prev.log, "Executing: ${summary}"],
    }));

    queueMicrotask(() => {
      setState((prev) => ({
        status: "done",
        log: [...prev.log, "Completed primary flow successfully."],
      }));
      onComplete?.();
    });
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">
          Agent Reference Implementation
        </h3>
        <span className="text-sm text-zinc-500">State: {state.status}</span>
      </header>
      <button
        onClick={run}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        Execute
      </button>
      <ul className="mt-4 space-y-2 text-sm text-zinc-600">
        {state.log.map((line, index) => (
          <li key={index} className="rounded bg-zinc-100 px-3 py-2">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
`,
      },
      {
        path: "src/lib/agent-playbook.ts",
        description: "Codifies the runbook for orchestrating the agent.",
        language: "ts",
        content: `${sharedPreamble}
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
`,
      },
    ];
  }

  if (tech.language === "Python") {
    return [
      {
        path: "agent/main.py",
        description: "FastAPI blueprint produced by the agent.",
        language: "python",
        content: `${sharedPreamble}
from fastapi import FastAPI

app = FastAPI(title="Agent Blueprint")


@app.get("/healthz")
def health() -> dict[str, str]:
  return {"status": "ok"}
`,
      },
    ];
  }

  return [
    {
      path: "AGENT_NOTES.md",
      description: "Guidance for implementing the remaining components.",
      language: "md",
      content: `${sharedPreamble}
## Open Items

- Translate the generated plan into executable code.
- Review integration touchpoints for missing contracts.
- Align architecture decisions with hosting environment.
`,
    },
  ];
}

function deriveRisks(prompt: string): string[] {
  const lowered = prompt.toLowerCase();
  const risks: string[] = [];

  for (const [keyword, action] of Object.entries(RISK_KEYWORDS)) {
    if (lowered.includes(keyword)) {
      risks.push(action);
    }
  }

  if (risks.length === 0) {
    risks.push("Verify observability and alerting for critical workflows.");
  }

  return risks;
}

function generateHeuristics(prompt: string): string[] {
  const lowered = prompt.toLowerCase();
  const heuristics = [...HEURISTICS];

  if (lowered.includes("migration")) {
    heuristics.unshift("Design forward-only migrations with rolling deploys.");
  }

  if (lowered.includes("legacy")) {
    heuristics.unshift("Isolate legacy adapters behind clean anti-corruption layers.");
  }

  return heuristics.slice(0, 5);
}

export function runCodingAgent(rawPrompt: string): AgentResult {
  const prompt = sanitizePrompt(rawPrompt);
  const tech = detectTech(prompt);
  const highlights = extractHighlights(prompt);
  const stages = generateStages(highlights, tech);
  const files = generateFiles(tech, highlights);
  const risks = deriveRisks(prompt);

  return {
    prompt,
    tech,
    stages,
    files,
    heuristics: generateHeuristics(prompt),
    insights: {
      summary:
        highlights.length > 0
          ? `Primary objective: ${highlights[0]}`
          : "Prepare discovery questions to clarify the task.",
      risks,
      nextSteps: [
        "Pair the agent output with human review before merge.",
        "Translate generated tasks into issue tracker tickets.",
        "Schedule a demo sync once implementation reaches beta quality.",
      ],
      qaChecklist: QA_CHECKS,
    },
  };
}
