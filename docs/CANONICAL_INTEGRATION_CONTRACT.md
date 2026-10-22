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
