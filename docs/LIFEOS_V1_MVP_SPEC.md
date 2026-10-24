# LifeOS v1 MVP — Frozen Architecture & Implementation Specification

**Status:** Architecture baseline for MVP implementation  
**Target:** Vite + React + TypeScript, local-first PWA, GitHub Pages-compatible  
**Change control:** Any change to the frozen structure, canonical data ownership, or store list requires an explicit architecture decision in this document. This specification does not authorize merging or deploying.

## 1. Product contract

LifeOS v1 is a mobile-first Mission Control for capturing and acting on personal life data. It must work offline after the app shell and assets have been cached. No API, account service, cloud sync, or backend is required for this milestone.

**Source-of-truth rules**
- Events are the canonical record of things that happened, are planned, or require attention.
- Entities represent people and assets; relationships connect entities and carry context.
- Mission cards, signals, scores, risks, opportunities, and the feed are derived views—not independent truth.
- Each derived calculation has one owning engine/resolver. UI components display results and dispatch user intent; they do not calculate business priority.
- Status and attention are separate concepts. Completing an item must not silently erase its history.
- Seed fixtures are demo data, not verified facts about the user. They must be editable and resettable.

## 2. Frozen repository layout

The following is the approved logical layout. Files can be introduced incrementally, but new top-level architecture areas or IndexedDB stores require an ADR first.

```text
lifeos/
├── public/
│   ├── icons/icon-192.png
│   ├── icons/icon-512.png
│   ├── manifest.webmanifest
│   └── favicon.ico
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── app/
    │   ├── App.tsx
    │   ├── Router.tsx
    │   └── Shell.tsx
    ├── pages/
    │   ├── MissionPage.tsx
    │   ├── InboxPage.tsx
    │   ├── EntitiesPage.tsx
    │   ├── SearchPage.tsx
    │   └── MorePage.tsx
    ├── components/
    │   ├── layout/{Header,Screen,Section}.tsx
    │   ├── navigation/BottomNavigation.tsx
    │   ├── mission/
    │   │   ├── NextBestActionCard.tsx
    │   │   ├── ExecuteNowCard.tsx
    │   │   ├── DecisionsRequiredCard.tsx
    │   │   ├── AtRiskCard.tsx
    │   │   ├── WaitingCard.tsx
    │   │   ├── OpportunityCard.tsx
    │   │   ├── RelationshipCard.tsx
    │   │   └── ReviewQueueCard.tsx
    │   └── shared/{Badge,Button,ImpactRing,ConfidenceRing,Card,GlowSurface}.tsx
    ├── theme/{globals.css,tailwind.css,tokens.ts}
    ├── types/{Entity,Recommendation,Relationship,MissionFeed,Settings}.ts
    ├── storage/
    │   ├── db.ts
    │   ├── schema.ts
    │   ├── seed.ts
    │   └── repositories/
    │       ├── EntityRepository.ts
    │       ├── RecommendationRepository.ts
    │       ├── RelationshipRepository.ts
    │       ├── SettingsRepository.ts
    │       └── EventRepository.ts
    ├── recommendation/
    │   ├── Scoring.ts
    │   ├── SignalGenerator.ts
    │   ├── RiskEngine.ts
    │   ├── OpportunityEngine.ts
    │   ├── RelationshipEngine.ts
    │   ├── RecommendationEngine.ts
    │   └── MissionFeedGenerator.ts
    ├── stores/{missionStore,entityStore,settingsStore}.ts
    ├── hooks/{useMission,useRecommendations,useEntities}.ts
    └── lib/{dates,scores,formatters,constants}.ts
```

The folders are boundaries, not a requirement to create empty files up front. Implement only files needed for the current milestone.

## 3. Runtime and navigation

- Stack: Vite, React, TypeScript, React Router, Zustand, IndexedDB through the `idb` package, and `vite-plugin-pwa`.
- Five primary destinations: Mission (`/`), Inbox (`/inbox`), Entities (`/entities`), Search (`/search`), More (`/more`).
- Use a single shared `Shell`, shared header, and fixed mobile bottom navigation with safe-area padding.
- The app must remain usable at 320 CSS px width, support keyboard focus, use semantic buttons/labels, and respect reduced-motion preferences.
- GitHub Pages base paths must work for client-side routes and static assets. No production deployment is part of this specification.

## 4. Canonical IndexedDB schema — exactly five stores

Database name: `lifeos`. Keep the store list exactly as follows for v1:

| Store | Key | Purpose |
|---|---|---|
| `entities` | `id` | People, assets, and extensible entity metadata |
| `relationships` | `id` | Typed links between entity IDs, with context and status |
| `events` | `id` | Canonical planned/observed/attention-worthy events and open-loop records |
| `recommendations` | `id` | Rebuildable recommendation records/cache and user disposition metadata; never the sole source of a fact |
| `settings` | fixed key `current` | User preferences, onboarding/seed version, and local display settings |

No `briefing`, `activity`, `signals`, `cache`, or other stores in v1. Activity/history belongs in canonical events when it matters. Recommendation output may be cleared and regenerated from entities, relationships, events, and settings. If user actions such as dismiss/defer need to survive regeneration, store that disposition on the relevant recommendation record or as an event; document which is used and avoid duplicate authority.

### Minimum record contracts

- **Entity:** `id`, `kind` (`person` | `asset`), `name`, optional `description` and `attributes`, `createdAt`, `updatedAt`, `archivedAt?`.
- **Relationship:** `id`, `fromEntityId`, `toEntityId`, `kind`, `status`, optional `context`, `createdAt`, `updatedAt`.
- **Event:** `id`, `kind`, `title`, optional `details`, `status`, `attentionState`, optional `dueAt`, optional entity/relationship references, `createdAt`, `updatedAt`, optional `completedAt`. Event types must accommodate tasks/open loops, questions, follow-ups, notes, and planned/observed events without creating additional stores.
- **Recommendation:** `id`, `sourceType`, `sourceId`, `category`, `title`, `impact`, `confidence`, `priorityScore`, `generatedAt`, plus optional user disposition metadata. Every derived record must be traceable to its source and safe to regenerate.
- **Settings:** fixed key `current`, `schemaVersion`, `seedVersion`, user preferences, and optional onboarding completion.

Repository modules own all IndexedDB access. UI components and recommendation engines must not open IndexedDB directly. Add explicit, tested schema migrations; never delete or reset existing user data during a migration.

## 5. Startup and refresh pipeline

On initial startup and whenever canonical inputs change:

1. Open/migrate IndexedDB.
2. Seed only if the relevant stores are empty and the current seed version has not been applied.
3. Load entities, relationships, events, and settings through repositories.
4. Generate signals from those inputs.
5. Evaluate risk, opportunity, and relationship signals.
6. Generate or refresh recommendation records.
7. Score and sort recommendations in the single scoring owner.
8. Build a typed Mission Feed projection.
9. Publish the feed to `missionStore` and render Mission.

This pipeline must be deterministic for the same inputs and clock reference. Pass a single `now` value into time-sensitive engines rather than reading the clock throughout the code. No component independently re-sorts or re-scores recommendations. Empty or corrupt data should produce a safe empty state and a recoverable error, not a blank crash screen.

## 6. Recommendation contract and priority

- `Scoring.ts` is the only owner of priority-score calculation.
- `SignalGenerator.ts` emits typed evidence from canonical input records; it does not write user data.
- Risk, opportunity, and relationship engines classify signals in their own domain and must not persist derived truth.
- `RecommendationEngine.ts` maps signals to actionable recommendation candidates and source references.
- `MissionFeedGenerator.ts` assembles category lists and the hero from the already-scored candidates; it does not invent new scores.
- Impact and confidence are separate 0–100 values. Priority must be documented, bounded, and covered by unit tests before UI uses it. Stable tie-breaking must be deterministic.
- A recommendation must be explainable: title, category, impact, confidence, source reference, and short reason/evidence.
- User disposition (complete, defer, dismiss) must have explicit semantics and preserve meaningful history. A deferred item goes to Review Queue; it is not treated as completed.

## 7. Canonical Mission layout and visual rules

The supplied Mission Control image is the visual authority. Build the Mission page in this order:

1. Header
2. Next Best Action hero
3. Two-column Execute Now / Decisions Required
4. At Risk
5. Two-column Waiting / Opportunity
6. Relationship
7. Review Queue
8. Bottom Navigation

At narrow widths, two-column cards may collapse to one column if needed to prevent overflow. Cards must use shared spacing, type, color, and radius tokens. Do not substitute generic dashboard widgets or add extra Mission sections without an architecture decision.

### Design tokens

```ts
export const tokens = {
  colors: {
    background: "#0A0B0D",
    surface1: "#111318",
    surface2: "#151820",
    surface3: "#1A1F29",
    primary: "#3B82F6",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    text: "#F8FAFC",
    muted: "#A1AAB8",
  },
  radius: { sm: 14, md: 20, lg: 24, xl: 28 },
};
```

Hero base: 28px radius; blue border; gradient from `#123569` through `#0E2346` to `#08111D`; blue ambient shadow `0 0 60px rgba(59,130,246,0.35)`; 20px internal padding. Content and actions must be data-driven from the selected recommendation, not hard-coded to Georgia Power. The Georgia Power text below is seed fixture content only.

## 8. First-run seed fixtures

Seed the following five editable demo recommendations with the listed initial impact/confidence values:

| Demo title | Impact | Confidence | Required handling |
|---|---:|---:|---|
| Contact Georgia Power | 92 | 88 | Demo fixture; not a verified utility account or actual obligation |
| Renew Vehicle Registration | 84 | 97 | Demo fixture; user must confirm jurisdiction and due date |
| Choose Insurance Plan | 91 | 82 | Demo fixture; no inferred coverage or enrollment state |
| Mortgage Escrow Shortfall | 96 | 94 | Demo fixture; must not be treated as verified financial data |
| Refinance Auto Loan | 88 | 77 | Demo fixture; no inferred loan terms or recommendation of a financial product |

Fixtures must be clearly identifiable as seeded examples, editable, and resettable without deleting user-created data. The first-run seed routine must be idempotent and versioned. Do not silently reseed after the user deletes a fixture. No external finance data is read or modified.

## 9. PWA and offline acceptance

Configure `vite-plugin-pwa` with a web manifest, 192px and 512px icons, installable standalone display, and a conservative service-worker strategy. Cache only the app shell/static assets by default; do not cache private API responses (none exist in this MVP) or invent a remote sync path. Confirm installability and offline reload after one successful online load. iOS Home Screen behavior varies by Safari/iOS version; do not promise a custom native launch screen beyond what the platform supports. Capacitor packaging is a later milestone.

## 10. Milestones

### M1 — Foundation
- Vite/React/TypeScript scaffold and route shell
- Tokens and global styles
- Five-store IndexedDB schema, migrations, and repository tests
- Seed routine and fixture labeling

### M2 — Mission data pipeline
- Entity/relationship/event types and repositories
- Signal generation, domain engines, scoring, recommendation generation
- Typed Mission Feed generator and Zustand mission store
- Unit tests for score bounds, ordering, traceability, determinism, and empty data

### M3 — Mission UI
- Canonical card order and responsive layout
- Hero and shared card primitives
- Loading, empty, error, and review-queue states
- Keyboard/accessibility and 320px layout tests

### M4 — Navigation and core workflows
- Inbox, Entities, Search, More
- Universal capture/edit for event, person, asset, question, follow-up, and note
- Complete/defer/dismiss semantics and source history
- Search over local canonical records

### M5 — PWA verification
- Manifest/icons/service worker
- Production build and GitHub Pages base-path checks
- Browser tests for navigation, capture/edit, persistence after reload, seed idempotence, migration safety, and offline app-shell reload

## 11. MVP acceptance gates

The MVP is not complete until all are true:

- Exactly five IndexedDB stores exist.
- All user-created canonical data is written through repositories.
- Mission feed is regenerated from local records on startup and input changes.
- The hero and each card trace to real local source records; demo fixtures are clearly marked.
- Scoring and category rules have deterministic unit tests.
- Capture, edit, complete, defer, dismiss, search, and reload persistence work without a network connection.
- PWA shell loads offline after initial caching.
- No cloud sync, remote API, financial-account integration, production data import, or automatic deployment is added by this milestone.
- CI type-check, production build, unit tests, and browser tests pass.

## 12. Explicitly deferred

Cross-device sync; API/backend; canonical graph integration with the existing LifeOS production repository; external finance feeds; automated reminders; push notifications; native Capacitor wrapper; advanced graph visualization; machine-learning ranking; any additional IndexedDB stores.

## 13. Architecture change rule

Before changing a frozen decision, add a short ADR under `docs/adr/` stating the problem, options, decision, data migration impact, and tests. Do not introduce new stores or let derived recommendation values become the only copy of a fact. Keep the MVP local-first and keep production unchanged until the owner explicitly approves any merge/deploy.
