# Canonical LifeOS Integration Contract (Proposal)

**Status:** Design-only proposal. Not an implementation authorization.  
**Scope:** The Mission Control prototype in this repository.  
**Safety:** Do not merge, deploy, import, or write to the production LifeOS graph without explicit owner approval.

## Current boundary

Mission Control currently saves captured entries to this prototype's browser-local IndexedDB. Those records are not synced to the canonical LifeOS graph or another device. The canonical LifeOS repository uses a different application stack; a same-named file or store must not be assumed to exist until its current repository structure is inspected.

This prototype must remain useful offline and must clearly label local-only records. Do not make local records look synced when they are not.

## Canonical data ownership

- Events are the source of truth for things planned, observed, or requiring attention, including open loops, questions, follow-ups, notes, and event records.
- People and assets belong to the canonical entity model, not to an event-only substitute.
- Relationships and references must use canonical IDs and supported relationship types. Do not infer links from display names.
- Mission cards, attention queues, counts, and other summaries are derived views. Do not persist them as competing canonical truth.
- Status and attention are separate. Completing an item must preserve meaningful history and must not silently erase its source record.
- Every resolver or calculation has one owner. The UI must submit user intent, not independently calculate canonical priority or forecast values.

## Required adapter boundary

When integration is separately approved, add a small adapter between the capture UI and the canonical repository/API. The UI must not write directly to an assumed remote endpoint or duplicate canonical business rules.

The adapter must expose explicit operations for:
1. Create or update a canonical event/open-loop record.
2. Create or update a canonical person or asset entity.
3. Resolve canonical IDs and validate supported relationships.
4. Return the authoritative saved record and its sync state.
5. Surface validation, permission, offline, and conflict errors without reporting false success.

Implement only operations supported by the inspected canonical repository. If no safe supported interface exists, stop at the adapter boundary and document the missing prerequisite rather than inventing an endpoint.

## Identity, retries, and conflicts

- Give each local entry a stable client-generated ID and retain it as an idempotency/correlation key where the canonical interface permits.
- Retrying a request must not create duplicate canonical records.
- Keep local edits and canonical identity distinct until the server or canonical repository confirms the mapping.
- Show clear states such as **Local only**, **Sync pending**, **Synced**, and **Needs attention**. Never label an unconfirmed write as synced.
- On conflict, preserve both the local draft and canonical record until the user or an explicit deterministic rule resolves the conflict. Do not silently use last-write-wins.
- Treat deletes, archive, completion, and dismiss/defer as distinct actions with explicit semantics. Do not infer deletion from absence in a response.

## Offline-first behavior

- Capture and local editing must continue to work offline.
- Queueing a local change is not the same as syncing it.
- Retry only idempotent operations; backoff and report persistent failures.
- Never overwrite the canonical graph merely because a local cache is empty, stale, or unavailable.
- Do not add credentials, API secrets, or privileged tokens to browser storage or static frontend code.

## Read-only discovery and rollout gates

Before implementation:
1. Inspect the current canonical LifeOS repository tree, schema, repositories/resolvers, authentication boundary, and test conventions at the exact target commit.
2. Identify a supported write interface for events and entities, or record that none exists.
3. Produce a mapping table from each prototype entry type to canonical type, required fields, status/attention semantics, and references.
4. Define migration, idempotency, retry, and conflict tests.
5. Review the plan with the owner before changing runtime behavior.

After implementation is approved, validate with isolated test data and automated tests first. Production import, merge, deployment, or any write to production requires separate explicit approval.

## Non-goals

This proposal does not authorize cloud sync, new production endpoints, authentication changes, schema/store changes, production data migration, import, merge, or deployment. It does not claim that a canonical write interface currently exists.


## Canonical repository findings (read-only inspection)

Inspected the canonical `5cxxpb2yrr-ui/lifeos` repository on its current default branch. The following are verified repository contracts, not assumptions about a network API:

- `domain/contracts/database.ts` exports `LifeOSDatabase`, with separate collections for `events`, `openLoops`, `people`, `assets`, `relationships`, and other domain records.
- `Event` records use `entityType: "event"`, an `eventType`, title, status, optional dates, and typed ID references such as `personIds`, `assetIds`, and `openLoopIds`.
- `OpenLoop` is its own canonical collection and contract (`entityType: "open_loop"`) with a type, status, optional priority/due date, and typed relationship references. It must not be silently flattened into an event.
- `Person` and `Asset` are distinct canonical record types. Prototype person/asset entries require explicit mapping and validation; a display title alone is not a complete person record.
- `Relationship` records use canonical `fromId`/`toId`, type fields, and a constrained `relationshipType` union.
- `storage/indexeddb/database.ts` exports `loadLocalDatabase` and `saveLocalDatabase`; saves run canonical integrity validation. `docs/ARCHITECTURE.md` says the browser is the canonical personal-data store for the local-first MVP.
- `domain/resolvers/attention.ts` owns attention-state resolution, and `domain/resolvers/search.ts` provides canonical search across supported database collections. Mission Control should consume these resolver-owned results rather than reimplementing them.

### Entry-type mapping proposal

| Prototype capture type | Canonical target candidate | Mapping rule |
|---|---|---|
| Task | `openLoops` | Create an `OpenLoop` with `type: "task"`; do not create a duplicate event unless the user explicitly records an event too. |
| Question | `openLoops` | Use `type: "question"`; preserve question text and status. |
| Follow-up | `openLoops` | Use `type: "follow_up"`; any person link must resolve to a canonical person ID. |
| Event | `events` | Require a supported `EventType` and `EventStatus`; do not infer dates or links. |
| Person | `people` | Require canonical person fields and preserve canonical ID/relationships. A single title is insufficient for a complete record. |
| Asset | `assets` | Require a supported `assetType` and canonical fields; a single title is insufficient for a complete record. |
| Note | No automatic target selected | Ask for explicit destination/type or define a reviewed canonical note representation before writes. |

The prototype's local entry type list also includes `open loop` as a capture choice; before implementation, map it to a specific supported `OpenLoop.type` rather than inventing a new canonical type.

### Remaining integration blocker

The canonical repository currently documents a browser-local IndexedDB persistence boundary, not a cross-repository remote write API. The prototype has its own separate browser-local store. Therefore, do not connect the prototype by guessing an endpoint or by directly manipulating another application's IndexedDB database. A shared persistence/service boundary and identity/authentication design must be explicitly chosen and reviewed first. This inspection did not modify the canonical repository or any production data.


## Prototype persistence inspection (read-only)

Inspected `src/storage/db.ts`, `src/App.tsx`, `package.json`, and the frozen MVP spec in this prototype branch.

- The prototype's `lifeos` IndexedDB database currently declares `briefing`, `activity`, and `entries` stores (database version 2). The `entries` store was introduced by the capture UI migration while preserving the existing `briefing` and `activity` stores.
- `LifeEntry` currently has only a prototype ID, one of seven UI entry types, title, details, optional due date, open/completed status, and creation time. It does not carry canonical entity fields, canonical relationship IDs, a sync state, or a canonical ID mapping.
- New prototype entries are inserted with `add`; edits and completion use `put`. This is local persistence only, not a canonical repository operation.
- The prototype's `docs/LIFEOS_V1_MVP_SPEC.md` separately freezes the canonical v1 database to exactly five stores: `entities`, `relationships`, `events`, `recommendations`, and `settings`; it explicitly says adding stores requires an architecture decision record (ADR).

### Decision required before runtime integration

There is a real architecture mismatch between this prototype's three-store IndexedDB schema and the canonical v1 specification's five-store schema. Do not point both apps at the same database name, add more stores, or attempt a silent schema migration as a shortcut. First choose one of these reviewed paths:

1. **Preferred for in-place simplification:** implement capture in the canonical LifeOS application using its existing repository and schema, and treat this prototype as a visual/interaction reference only; or
2. **Separate app remains intentional:** write an ADR approving a deliberate schema and persistence boundary, including how the frozen five-store contract is preserved or superseded.

No runtime integration was made in this step. This is a design gate, not approval to modify the canonical repository.


## Correction to the persistence comparison

**This section supersedes the earlier paragraph titled “Decision required before runtime integration” where it compares the prototype's three stores directly against the v1 five-store specification.** That comparison mixed architecture versions and overstated the mismatch.

Read-only verification of the current canonical V2 code shows:

- `storage/indexeddb/database.ts` opens database `LIFEOS_V2_DB`, version 2, with one IndexedDB object store named `database`. That store holds a validated `LifeOSDatabase` snapshot.
- `domain/contracts/database.ts` defines the canonical collections within that snapshot, including events, open loops, people, assets, relationships, and other domain data.
- `docs/ARCHITECTURE.md` identifies the V2 architecture as the active model: storage → repositories → domain services → resolvers → view models → components, with IndexedDB as the browser's canonical local data store.
- The separate `docs/LIFEOS_V1_MVP_SPEC.md` is a V1 specification and must not be used to describe the current V2 physical IndexedDB schema.

Therefore, the verified issue is **not** simply “three stores versus five stores.” The real boundary is that the prototype has a separate database name/schema and its own local `LifeEntry` records, while canonical V2 stores a validated `LifeOSDatabase` snapshot and already has domain operations for creating events, open loops, people, and relationships. Do not share the prototype's database or migrate its records automatically. If the next phase is approved, the safest implementation target is the canonical V2 app's existing capture workflow and domain operations—not a direct IndexedDB bridge. No production or canonical code was changed during this inspection.


## Existing canonical capture workflow (verified)

Further read-only inspection of the current canonical `components/mission-control/MissionControl.tsx` and `domain/services/operations.ts` found that V2 already has a global **Universal Capture** modal and canonical operations:

- The capture UI offers Event, Open Loop / Task, Person, and Note / Observation.
- Event capture has a constrained canonical event-type selector and optional start/due date, modifiers, and body content.
- The component delegates submitted input to its existing `capture(...)` handler; domain operations include `createEvent`, `createOpenLoop`, `createPerson`, and audit-appending update operations.
- Canonical search, attention, and mission summaries are already resolved from the canonical database and domain resolvers.

### Updated next-step recommendation

Do not build another capture system or add a second local data model. First evaluate the existing V2 Universal Capture UI against the prototype's simpler phone-first interaction. The likely smallest next change—only after owner approval—is to simplify the existing capture form and navigation in the canonical app while retaining the existing domain operations, audit trail, integrity checks, and IndexedDB persistence.

The prototype should remain a non-production reference until the owner chooses whether it will be retained, archived, or closed. No source code in the canonical V2 repository was modified in this inspection.
