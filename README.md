# Job-Agent

Job-Agent is a TypeScript automation project that helps search job offers, generate tailored cover letters with Groq, send applications via Gmail, and track applications in Excel.

## Tech stack

- **Runtime:** Node.js + TypeScript (`tsx`)
- **AI:** `groq-sdk` (LLM calls for matching and cover-letter generation)
- **Automation/Scraping:** `playwright`
- **Email:** `googleapis` (Gmail API + OAuth2)
- **Document processing:** `pdfjs-dist` (read CV from PDF)
- **Tracking:** `exceljs` (store applications in `.xlsx`)
- **MCP integration:** `@modelcontextprotocol/sdk`

## Repository structure

```text
src/
  agent.ts            # Interactive CLI agent (tool-calling loop with Groq)
  pipeline.ts         # Daily pipeline (search → match → apply → track → summary email)
  server.ts           # MCP server exposing tools over stdio
  tools/
    scraper.ts        # Multi-source scraping (LinkedIn, TanitJobs, Indeed)
    linkedin.ts       # LinkedIn-only job search helper
    matcher.ts        # CV/job matching with AI score + reasons
    cv.ts             # CV PDF extraction + cover letter generation
    gmail.ts          # Gmail OAuth + application email sending
    tracker.ts        # Excel persistence for candidatures
scripts/
  schedule.bat        # Windows Task Scheduler example for daily pipeline
```

## How code is organized

### 1) `src/agent.ts` (interactive assistant)
- Starts a CLI chat session.
- Registers callable tools (`search_jobs`, `generate_cover_letter`, `send_application`, `save_candidature`).
- Uses a strict system prompt to enforce application order.
- Executes each tool call and feeds tool outputs back to the model.

### 2) `src/pipeline.ts` (batch automation)
- Reads CV text.
- Scrapes jobs for configured keywords/location.
- Scores each job against CV (`matcher.ts`).
- For strong matches, generates letter + sends Gmail + logs in Excel.
- Produces final stats and sends a summary email.

### 3) `src/server.ts` (MCP mode)
- Exposes core tools through MCP (`stdio` transport).
- Intended for MCP-compatible clients using local process execution.

### 4) `src/tools/*` (single-responsibility modules)
- Each file handles one domain (scraping, AI generation, Gmail, tracking).
- High-level flows (`agent.ts`/`pipeline.ts`) compose these tool functions.

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Environment/config files

Create and provide:

- `.env` with at least:
  - `GROQ_API_KEY=<your_key>`
- `credentials.json` for Gmail OAuth client credentials.
- (Generated on first OAuth flow) `token.json`.
- Optional: `cv.pdf` at repo root (used as CV attachment and for CV text extraction).

## Run modes

### Interactive agent

```bash
npm start
```

### Dev watch mode

```bash
npm run dev
```

### Daily pipeline (direct)

```bash
npx tsx src/pipeline.ts
```

### MCP server

```bash
npx tsx src/server.ts
```

## Notes

- Current `npm test` is a placeholder and intentionally exits with error (`"Error: no test specified"`).
- Main implementation language and many prompts/messages are in French.
