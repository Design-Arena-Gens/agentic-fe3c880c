# Autonomous Coding Agent

An opinionated Next.js experience for drafting implementation plans, scaffolds, and QA guardrails from a single product brief. Drop in a requirement and the agent responds with a multi-stage execution timeline, generated assets, and follow-up checks tailored to modern TypeScript projects.

## Features
- **Agentic timeline** – watch the strategist through QA loop progress across simulated stages
- **Tech stack inference** – automatic language, framework, and tooling recommendations with rationale
- **Generated scaffolds** – ready-to-paste code samples and playbooks that accelerate implementation
- **Risk & QA radar** – instant guardrails, risk flags, and operational next steps to keep delivery on track

## Tech Stack
- Next.js 16 (App Router, React 19)
- Tailwind CSS 4 (PostCSS pipeline)
- TypeScript with strict module boundaries

## Local Development
Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

The app runs at <http://localhost:3000>. Edit `src/app/page.tsx` or supporting modules inside `src/lib` to iterate.

## Available Scripts
- `npm run dev` – launch the development server with hot reloading
- `npm run build` – create an optimized production bundle
- `npm start` – serve the production build locally
- `npm run lint` – run ESLint across the project

## Deployment

Build locally, then deploy to Vercel using the preconfigured project slug:

```bash
npm run build
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-fe3c880c
```

After deployment, verify DNS propagation:

```bash
curl https://agentic-fe3c880c.vercel.app
```

## Project Structure

```
src/
  app/
    layout.tsx      # Root layout and metadata
    page.tsx        # Main coding agent interface
    globals.css     # Tailwind + global styles
  lib/
    agent.ts        # Core heuristics powering the agent output
    agent-playbook.ts# Generated via the agent for reference
```

## Notes
- All content is generated deterministically without external API calls
- Extend `src/lib/agent.ts` to plug in real LLM calls or domain-specific heuristics
- Replace the generated scaffolds with production-grade implementations as needed

