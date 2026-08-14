# Agent.md — Claude Code Agent Catalog

This file documents all Claude Code subagents defined in this repository. Agents are specialized AI assistants that handle specific types of tasks with focused system prompts and scoped tool access.

For Claude Code instructions, see [CLAUDE.md](./CLAUDE.md).
For skills and slash commands, see [Skills.md](./Skills.md).

---

## What Are Agents?

Claude Code agents are defined in `.claude/agents/` as Markdown files. Each file specifies:
- A role description (what this agent does)
- When to invoke it
- Required inputs
- Expected outputs
- Step-by-step instructions
- Edge-case handling

When Claude encounters a task matching an agent's description, it delegates to that agent, which works in its own isolated context window and returns a summary.

**Benefits:**
- Keeps exploratory work (site crawling, log analysis) out of the main conversation context
- Enforces constraints (e.g., an agent that only reads, never writes)
- Enables reuse across projects
- Reduces context pollution from large intermediate outputs

---

## Available Agents

### `site-analyzer`

**File:** `.claude/agents/site-analyzer.md`

**Purpose:** Crawl a live website and produce a fully-populated `site.config.json`. This is the first step when onboarding a new company or verifying that an existing config still reflects the live site.

**When to invoke:**
- First-time setup: the repo is new and `site.config.json` has empty or default values
- After a major site redesign
- When the `/analyze-site` slash command is run

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `url` | Yes | The site URL to analyze |
| `companyName` | No | Override for the company name (else inferred from `<title>`) |

**Outputs:**
A completed `site.config.json` object with all fields populated, an "Issues found" checklist, and a confidence rating (High / Medium / Low).

**Key behaviors:**
- Resolves redirect chains and uses the canonical final URL
- Dismisses cookie consent banners before inspecting structure
- Identifies contact forms by checking `/contact`, `/contact-us`, `/get-in-touch`
- Detects auth-gated content and sets `auth.required: true`
- Waits for SPA hydration (`networkidle` + 2s extra)

**Example invocation in Claude Code:**
```
/analyze-site
```
or
```
Ask Claude: "Analyze the site at http://www.flagshipfleet.com and update site.config.json"
```

---

### `test-generator`

**File:** `.claude/agents/test-generator.md`

**Purpose:** Read a populated `site.config.json` and generate site-specific Playwright TypeScript test files that go beyond the shared generic suite.

**When to invoke:**
- A site has unique functionality not covered by the generic smoke/navigation/forms suites
- The site has interactive elements (pricing calculators, video embeds, accordions, live chat)
- You need regression tests for a specific discovered bug
- The generic selectors fail and site-specific locators are needed

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `siteConfig` | Yes | The populated `site.config.json` |
| `testScenarios` | No | Description of specific scenarios to cover |
| `pagesToTest` | No | List of specific page paths (e.g., `/pricing`, `/fleet-tracking`) |

**Outputs:**
TypeScript test files written to `tests/custom/<scenario-name>.spec.ts`. Each file starts with a JSDoc block explaining what is being tested and why it is site-specific.

**Generated file conventions:**
- File naming: `tests/custom/<kebab-case-description>.spec.ts`
- Imports from `@fixtures/site.fixture`
- Tags all tests `@custom` plus any relevant shared tag
- Uses `async/await` throughout
- No fixed timeouts greater than 500ms
- Never submits forms

**Example invocation:**
```
Ask Claude: "Generate tests for the pricing page and the fleet tracking features"
```

---

## Agent Conventions

When creating a new agent for this repository, follow these conventions:

### File location
```
.claude/agents/<agent-name>.md
```

### Required frontmatter sections
Every agent file must include:
1. **`# Agent: <name>`** heading
2. **`## Role`** — one paragraph describing what the agent does
3. **`## When to invoke`** — bullet list of trigger conditions
4. **`## Inputs`** — table of required and optional inputs
5. **`## Output`** — description of what the agent produces
6. **`## Step-by-step instructions`** — numbered steps the agent follows

### Optional sections
- `## Handling edge cases` — how to handle SPAs, auth-gated pages, redirects
- `## Output format` — exact format of the output
- `## Example output`

### Tool access
Agents inherit all tools from the parent session by default. If an agent should be read-only (no file writes, no shell commands), state that explicitly in the Role section.

### Context discipline
Agents are meant to reduce context pollution. Keep agent outputs focused and summarized. If an agent would produce large intermediate results (crawl logs, HTML dumps), it should summarize them rather than returning raw data to the parent session.

---

## Creating a New Agent

1. Create `.claude/agents/<name>.md` following the conventions above.
2. Write a clear `## Role` section — Claude uses this to decide when to delegate tasks automatically.
3. Define concrete inputs and outputs so the agent can be invoked programmatically.
4. Test the agent by running `/analyze-site` or the relevant slash command.
5. Document the new agent in this file under [Available Agents](#available-agents).

---

## Agent Design Principles

| Principle | Guidance |
|-----------|---------|
| **Single responsibility** | Each agent handles one well-defined task. If an agent is doing two unrelated things, split it. |
| **Explicit inputs** | Always declare required vs. optional inputs. Agents should not guess their inputs from context. |
| **Deterministic output** | The same inputs should produce the same type of output structure every time. |
| **Fail gracefully** | On network errors, auth gates, or missing content — produce a partial result with an explanation, not a crash. |
| **No side effects** | Agents that only *read* should not write files or run shell commands. Declare this in the Role. |
| **Context hygiene** | Summarize large inputs/outputs. Do not dump raw HTML or logs into the parent context. |
