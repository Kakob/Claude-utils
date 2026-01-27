# CLAUDE.md

> Instructions for Claude Code when working on this project

## Project Overview

**Claude Utils** — A browser-based power toolkit for Claude users. Search, analytics, export, and prompt management. Privacy-first, runs entirely client-side, no server.

**Business model**: Freemium with $29 one-time Pro tier.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| State | Zustand |
| Storage | Dexie.js (IndexedDB) |
| Search | Fuse.js |
| Charts | Recharts |
| PDF | jsPDF + html2canvas |
| ZIP | JSZip |
| Styling | Tailwind CSS |
| Icons | Lucide React |

## Key Commands

```bash
# Development
npm run dev          # Start dev server at localhost:5173

# Build & Preview
npm run build        # Production build to dist/
npm run preview      # Preview production build

# Quality
npm run lint         # ESLint check
npm run lint:fix     # ESLint fix
npm run typecheck    # TypeScript check

# Testing
npm run test         # Run tests (if configured)
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared UI components
│   ├── layout/          # App shell, sidebar, header
│   ├── search/          # Search bar, results, filters
│   ├── analytics/       # Charts, stats cards
│   ├── conversations/   # List, detail view, messages
│   ├── export/          # Export modal, format options
│   ├── prompts/         # Prompt library UI
│   ├── import/          # Upload zone, progress
│   └── settings/        # Settings, license, data mgmt
├── hooks/               # Custom React hooks
├── lib/
│   ├── db.ts            # Dexie schema
│   ├── search.ts        # Fuse.js setup
│   ├── analytics.ts     # Stats computation
│   ├── license.ts       # License validation
│   ├── parsers/         # claude-ai.ts, claude-code.ts
│   ├── exporters/       # markdown.ts, pdf.ts, etc.
│   └── utils/           # Helpers
├── pages/               # Route components
├── stores/              # Zustand stores
├── types/               # TypeScript interfaces
├── App.tsx
└── main.tsx
```

## Data Sources

### Claude.ai Export
- ZIP file from Settings → Privacy → Export Data
- Contains `conversations.json`
- Structure: `{ conversations: [{ uuid, name, chat_messages }] }`

### Claude Code Logs
- JSONL files in `~/.claude/projects/<project>/`
- One JSON object per line
- Types: `user`, `assistant`, `system`, `tool_use`, `tool_result`

## Core Features

1. **Search** — Full-text across all conversations (Fuse.js)
2. **Analytics** — Usage stats, charts, trends (Recharts)
3. **Export** — Markdown, PDF, JSON, HTML (jsPDF)
4. **Prompts** — Save, organize, reuse prompts
5. **Browser** — View conversations with syntax highlighting
6. **Import** — Parse both data formats, store in IndexedDB

## Free vs Pro Limits

| Feature | Free | Pro ($29) |
|---------|------|-----------|
| Search | 100 convos | Unlimited |
| Analytics | Basic stats | Full dashboard |
| Export | Markdown only | All formats |
| Prompts | 10 | Unlimited |

## Architecture Decisions

1. **Client-side only** — No server, all processing in browser
2. **IndexedDB** — Persistent storage, handles large datasets
3. **Unified data model** — Both sources normalized with `source` field
4. **Web Workers** — For search/import on large datasets (if needed)
5. **License keys** — Simple HMAC validation, no server auth

## Common Tasks

### Adding a new parser
1. Create `src/lib/parsers/<source>.ts`
2. Export `parse(content: string): Conversation[]`
3. Add format detection in `src/lib/parsers/index.ts`
4. Update types in `src/types/`

### Adding a new exporter
1. Create `src/lib/exporters/<format>.ts`
2. Export `export(conversation: Conversation): Blob | string`
3. Add to format selector in `src/components/export/`

### Updating database schema
1. Increment version in `src/lib/db.ts`
2. Add migration in `.upgrade()`
3. Update interfaces in `src/types/unified.ts`

### Adding a new analytics metric
1. Add computation in `src/lib/analytics.ts`
2. Add to stats recomputation on import
3. Create display component in `src/components/analytics/`

## Performance Guidelines

- Use `react-window` for lists > 100 items
- Debounce search input (300ms)
- Lazy load conversation messages
- Code split routes with `React.lazy`
- Consider Web Worker for heavy computation

## Styling Guidelines

- Use Tailwind utilities, avoid custom CSS
- Dark mode: use `dark:` variants
- Colors: purple primary (`violet-500`/`violet-600`)
- Spacing: consistent with Tailwind scale
- Components: keep under 150 lines

## Code Style

- Functional components with hooks
- Named exports (not default)
- Types in separate files
- Explicit return types on functions
- Descriptive variable names
- Comments for non-obvious logic

## Testing Approach

- Manual testing with real exports
- Test data in `test-data/` (gitignored)
- Test scenarios:
  - Small export (10 conversations)
  - Large export (1000+ conversations)
  - Malformed/incomplete data
  - Both sources combined

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | Database schema, all data access |
| `src/lib/parsers/index.ts` | Format detection, routing |
| `src/lib/search.ts` | Fuse.js configuration |
| `src/stores/appStore.ts` | Global state |
| `src/types/unified.ts` | Core data interfaces |

## Environment Variables

```bash
# .env.local (not committed)
VITE_LICENSE_SECRET=your-hmac-secret  # For license validation
```

## Deployment

Deployed to Vercel. Push to `main` triggers deploy.

```bash
npx vercel --prod  # Manual deploy
```

## Useful Links

- [PRD](./docs/prd.md) — Full product requirements
- [Dexie.js docs](https://dexie.org/)
- [Fuse.js docs](https://fusejs.io/)
- [Recharts docs](https://recharts.org/)
- [Tailwind docs](https://tailwindcss.com/)
- [LemonSqueezy](https://lemonsqueezy.com/) — Payment processing

## Current Phase

Check GitHub Issues and PRD for current development phase. Tag issues with:
- `bug` — Something broken
- `feature` — New functionality
- `parser` — Data format related
- `search` — Search functionality
- `analytics` — Stats and charts
- `export` — Export functionality
- `ui` — Visual/UX
- `perf` — Performance

## Quick Reference: Data Flow

```
User uploads file
    ↓
Format detection (parsers/index.ts)
    ↓
Parse to unified format (parsers/claude-ai.ts or claude-code.ts)
    ↓
Store in IndexedDB (lib/db.ts)
    ↓
Build search index (lib/search.ts)
    ↓
Compute analytics (lib/analytics.ts)
    ↓
Ready for use
```
