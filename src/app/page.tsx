"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  type AgentResult,
  runCodingAgent,
  type AgentStage,
} from "@/lib/agent";
import { AGENT_ROLES } from "@/lib/agent-playbook";

const EXAMPLE_PROMPTS = [
  "Build a Next.js dashboard for monitoring CI pipelines with real-time status and deploy buttons.",
  "Create a full-stack TypeScript API for managing feature flags with audit logging and metrics.",
  "Prototype a collaborative markdown editor with optimistic updates and presence indicators.",
];

function TimelineStage({
  stage,
  isActive,
  isComplete,
}: {
  stage: AgentStage;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <li className="group relative flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-5 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
              isComplete
                ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200"
                : isActive
                  ? "border-sky-300/60 bg-sky-400/10 text-sky-200"
                  : "border-white/20 text-white/60"
            }`}
            aria-hidden="true"
          >
            {isComplete ? "OK" : isActive ? "..." : stage.title[0]}
          </span>
          <div>
            <h3 className="text-base font-semibold text-white">
              {stage.title}
            </h3>
            <p className="text-xs text-white/60">{stage.headline}</p>
          </div>
        </div>
        <span className="text-[11px] uppercase tracking-wide text-white/40">
          {(stage.durationMs / 1000).toFixed(1)}s
        </span>
      </div>
      <ul className="mt-2 space-y-1.5 text-left text-[13px] leading-5 text-white/70">
        {stage.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-0.5 text-white/40">-</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      {isActive && (
        <div className="absolute inset-0 -z-10 rounded-2xl bg-sky-500/10 blur-xl" />
      )}
      {isComplete && (
        <div className="absolute inset-0 -z-10 rounded-2xl bg-emerald-500/10 blur-xl" />
      )}
    </li>
  );
}

function GeneratedFileCard({
  path,
  description,
  language,
  content,
}: AgentResult["files"][number]) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/40 p-5 text-sm text-white/70">
      <header className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-white/50">
        <span className="text-emerald-200/90">{language}</span>
        <span className="text-white/80">{path}</span>
      </header>
      <p className="text-[13px] text-white/70">{description}</p>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/70 p-4 font-mono text-[12px] leading-5 text-white/80">
        <code>{content}</code>
      </pre>
    </article>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0]);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const totalDuration = useMemo(() => {
    if (!agentResult) return 0;
    return agentResult.stages.reduce((acc, stage) => acc + stage.durationMs, 0);
  }, [agentResult]);

  useEffect(() => {
    if (!agentResult) return;

    const stageIds = agentResult.stages.map((stage) => stage.id);
    let offset = 0;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    agentResult.stages.forEach((stage, index) => {
      const timer = setTimeout(() => {
        setActiveStageId(stage.id);
        if (index > 0) {
          setCompletedStages((prev) =>
            Array.from(new Set([...prev, stageIds[index - 1]])),
          );
        }
      }, offset);

      timers.push(timer);
      offset += stage.durationMs;
    });

    const finalTimer = setTimeout(() => {
      setCompletedStages(stageIds);
      setActiveStageId(null);
      setIsRunning(false);
    }, Math.max(offset + 250, 600));

    timers.push(finalTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [agentResult]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRunning(true);
    const result = runCodingAgent(prompt);
    setCompletedStages([]);
    setActiveStageId(result.stages[0]?.id ?? null);
    setCopyFeedback(null);
    setAgentResult(result);
  };

  const handleCopyAll = async () => {
    if (!agentResult) return;
    const combined = agentResult.files
      .map((file) => `// ${file.path}\n${file.content}`)
      .join("\n\n");

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyFeedback("Clipboard access is unavailable in this environment.");
      return;
    }

    try {
      await navigator.clipboard.writeText(combined);
      setCopyFeedback("Copied all generated assets to the clipboard.");
    } catch {
      setCopyFeedback("Clipboard write failed. Copy manually from the cards.");
    }

    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-950 via-black to-zinc-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22)_0,_rgba(12,12,16,0.05)_45%,rgba(0,0,0,0.9)_100%)]" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-16 md:px-12">
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/60">
            Agent Control Loop
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            Online
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-white drop-shadow md:text-5xl">
              Launch a pragmatic coding agent that plans, scaffolds, and guides
              implementation in seconds.
            </h1>
            <p className="text-lg text-white/70">
              Feed the agent a product objective and receive a battle-tested
              execution plan, scaffolding, and QA guidance optimized for the
              modern TypeScript stack.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white/50">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Next.js 16 + React 19
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Tailwind CSS 4
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Synthetic Agentic Reasoning
            </span>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
          <aside className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-black/50 p-6 shadow-2xl shadow-sky-500/10">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Project Brief
              </label>
              <textarea
                required
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the product, constraints, and success criteria..."
                className="min-h-[180px] rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/90 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
              <button
                type="submit"
                disabled={isRunning}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-emerald-400/40 disabled:from-white/20 disabled:to-white/20 disabled:text-white/50"
              >
                {isRunning ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
                    Generating
                  </>
                ) : (
                    <>Run Coding Agent</>
                )}
              </button>
            </form>

            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">
                Suggested briefs
              </h2>
              <div className="flex flex-col gap-3">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/70 transition hover:border-sky-400/60 hover:bg-sky-500/10 hover:text-white"
                    onClick={() => setPrompt(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex flex-col gap-6">
            {!agentResult ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/5 text-center text-sm text-white/60">
                <p>Feed the agent a brief to watch the plan materialize.</p>
                <p className="max-w-sm text-xs text-white/40">
                  The agent fuses systems design heuristics with TypeScript
                  defaults to produce a ready-to-execute blueprint.
                </p>
              </div>
            ) : (
              <>
                <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-black/60 p-6 shadow-xl shadow-sky-500/10">
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">
                        Agent Summary
                      </p>
                      <h2 className="text-xl font-semibold text-white">
                        {agentResult.insights.summary}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-white/60">
                        {agentResult.tech.language}
                      </span>
                      {agentResult.tech.framework ? (
                        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-white/60">
                          {agentResult.tech.framework}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-white/60">
                        Confidence {agentResult.tech.confidence.toUpperCase()}
                      </span>
                    </div>
                  </header>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                      <h3 className="text-sm font-semibold text-white/80">
                        Toolchain
                      </h3>
                      <ul className="space-y-2 text-xs text-white/60">
                        {agentResult.tech.tools.map((tool) => (
                          <li key={tool} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                            {tool}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-white/50">
                        {agentResult.tech.rationale}
                      </p>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                      <h3 className="text-sm font-semibold text-white/80">
                        Guardrails
                      </h3>
                      <ul className="space-y-2 text-xs text-white/60">
                        {agentResult.heuristics.map((heuristic) => (
                          <li key={heuristic} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            <span>{heuristic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                      <h3 className="text-sm font-semibold text-white/80">
                        Agent Roles
                      </h3>
                      <ul className="space-y-2 text-xs text-white/60">
                        {AGENT_ROLES.map((role) => (
                          <li key={role.id} className="flex flex-col gap-1">
                            <span className="font-semibold text-white/80">
                              {role.title}
                            </span>
                            <span>{role.focus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-lg shadow-emerald-500/10">
                  <header className="flex items-baseline justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Execution Timeline
                      </h3>
                      <p className="text-xs uppercase tracking-wide text-white/40">
                        {totalDuration
                          ? `${(totalDuration / 1000).toFixed(1)}s simulated runtime`
                          : "Instant analysis"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <span className="inline-flex h-2 w-2 rounded-full bg-sky-400 opacity-80" />
                      {activeStageId ? "Processing" : "Complete"}
                    </div>
                  </header>
                  <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {agentResult.stages.map((stage) => (
                      <TimelineStage
                        key={stage.id}
                        stage={stage}
                        isActive={stage.id === activeStageId}
                        isComplete={completedStages.includes(stage.id)}
                      />
                    ))}
                  </ul>
                </section>

                <section className="space-y-4 rounded-3xl border border-white/10 bg-black/50 p-6 shadow-xl shadow-sky-500/10">
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Generated Assets
                      </h3>
                      <p className="text-xs text-white/50">
                        Drop-in scaffolds and playbooks to accelerate delivery.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAll}
                      className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80"
                    >
                      Copy all
                    </button>
                  </header>
                  {copyFeedback ? (
                    <p className="text-xs text-emerald-200/80">{copyFeedback}</p>
                  ) : null}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {agentResult.files.map((file) => (
                      <GeneratedFileCard key={file.path} {...file} />
                    ))}
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-white">
                      Risk Radar
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-white/65">
                      {agentResult.insights.risks.map((risk) => (
                        <li
                          key={risk}
                          className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-white/70"
                        >
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-white">
                      QA Checklist
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-white/65">
                      {agentResult.insights.qaChecklist.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-white/70"
                        >
                          <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] text-white/50">
                            []
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-white">
                    Operational Next Steps
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-white/65">
                    {agentResult.insights.nextSteps.map((step) => (
                      <li
                        key={step}
                        className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-white/75"
                      >
                          <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-400/40 text-[10px] text-emerald-200/90">
                          &gt;
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
