---
name: mobile-offline-sync
description: Designs and reviews offline-first mobile data on every stack — Flutter, native Android, native iOS, React Native and Kotlin Multiplatform. Covers the local store, the outbox of pending mutations, idempotency keys, retry and backoff, conflict resolution, reconnection, and how to test a flaky network deterministically. Use when an app must work without connectivity, when writes are lost or duplicated after reconnecting, or when local and server data disagree.
intents: [offline]
stacks: ["*"]
---

# Mobile Offline Sync

One design for offline-capable mobile data, on every stack. This file holds the model and the failure cases; each platform's storage engines, queue runners and network-condition tooling live in its reference.

## 1. Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Native Android | [references/android.md](references/android.md) |
| Native iOS | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

Background scheduling — when the sync is actually allowed to run — is in [mobile-performance/references/background.md](../mobile-performance/references/background.md). Where the queue and the store belong in the app's layers is in [mobile-architecture](../mobile-architecture/SKILL.md).

## 2. Decide what "offline" means here, first

Most offline bugs come from building more than the product needs, or less. Pick one of these three before designing anything:

| Level | The app can… | Cost |
|---|---|---|
| **Read cache** | Show previously fetched data while offline; writes fail with a clear message | Low. A store and a freshness policy |
| **Queued writes** | Accept writes offline, apply them optimistically, send them on reconnect | Medium. Everything in §3–§6 |
| **Full replication** | Work indefinitely offline, with concurrent edits on several devices merged | High. Needs a server designed for it: versioning, per-record change history, or a CRDT/sync engine |

Level 2 is what most apps need and what this skill is written for. Do not build level 3 machinery for a product whose users are offline for minutes; do not sell level 1 as "works offline" when users expect their edits to survive.

## 3. The local store is the source of truth for the UI

Offline-first inverts the usual flow. The UI never reads from the network; it reads from the local store, and the network's only job is to fill and drain that store.

```
UI  ──reads──▶  local store  ◀──writes──  sync engine  ◀──▶  server
        ▲                ▲
        └──writes────────┘  (optimistic, immediately visible)
```

What this requires:

- **A real database, not a cache of responses.** Rows with your own primary keys, queryable, with a schema you migrate. Caching JSON blobs keyed by URL cannot answer "show me this user's unsent orders".
- **Reactive reads.** The store emits on change (Flow, Stream, publisher, subscription) so an applied mutation or a completed sync updates every screen without a manual refresh.
- **Per-record sync state**, stored next to the record: `synced`, `pending`, `failed`, plus the server version/ETag it was last based on and the time it was fetched. Without it the UI cannot show "sending…" and the engine cannot tell a local edit from a server row.
- **A freshness policy.** How stale is too stale, per entity. A price list and a chat message do not have the same answer, and "refresh everything on launch" is what makes launches slow.

## 4. The outbox: every write is a durable, replayable intent

A mutation made offline is not a paused HTTP call. It is a record in a table.

An outbox entry carries: a **stable client-generated id** (UUID, created on the device), the **operation** and its payload, the **entity it targets**, the **attempt count**, the **next attempt time**, the **last error**, and the **creation time**.

Consequences that are easy to get wrong:

- **Generate ids on the client.** A record created offline needs an id immediately, because the UI shows it and later operations reference it. Use a UUID (or ULID, which sorts by time) as the real primary key and let the server accept it, rather than mapping a temporary id to a server id afterwards. If the server must assign the id, you need an explicit id-mapping table and every queued operation that references the new record must be rewritten when the id arrives — design for that deliberately or avoid it.
- **Order matters, per entity.** Create-then-update-then-delete on the same record must reach the server in that order. Process the queue in order per entity key; parallelize across unrelated entities only.
- **Collapse redundant operations before sending.** Three edits to the same field while offline are one PUT. A create followed by a delete of a record the server never saw is *nothing at all* — both entries are dropped. Doing this at drain time, not at enqueue time, keeps the UI history honest.
- **A failed entry must not block the queue forever.** After N attempts, move it to a dead-letter state, surface it to the user, and continue with the rest. A permanent 400 retried forever stops every later write.
- **The queue survives everything.** Process death, reboot, app update, low storage. That means a database table, not an in-memory list, and a migration story for the payload format when the app updates while entries are pending.

## 5. Idempotency: the network will lie to you

The dangerous failure is not "the request failed". It is "the request succeeded and the response was lost" — the device retries, and the user has two orders.

- **Send an idempotency key with every mutating request.** The client-generated operation id is that key; put it in a header (`Idempotency-Key` is the common spelling) or in the body. The server stores the key with the result and returns the *original* result for a repeat, instead of performing the operation again.
- **Without server support, retrying a POST is unsafe.** If the API has no idempotency mechanism, say so explicitly in the review: the choice is to add one server-side, to make the endpoint naturally idempotent (a PUT to a client-chosen id), or to accept duplicates. There is no client-only fix — a client that "checks whether it already exists" before retrying still races.
- **Only delete the outbox entry after a confirmed success.** Acknowledge, then delete, in that order; a crash between the two costs a retry, which idempotency makes harmless. The reverse order costs a lost write.
- **Deletes and increments need the same care.** `DELETE` is naturally idempotent for a given id; a relative operation ("add 1 to the counter") is not, and must be sent as an absolute value or carry a key.

## 6. Conflict resolution: name the strategy, per entity

A conflict is a server-side change to a record the device edited based on an older version. Detecting one requires a version: an ETag, a `version` integer, or an `updated_at` the server controls. **If the API returns no version, conflicts cannot be detected at all** — the last writer silently wins, and that must be stated as a finding rather than assumed to be the design.

| Strategy | Use when | Cost |
|---|---|---|
| **Server wins** | Reference data the user does not edit — catalogues, settings pushed by an admin | None; discard the local change |
| **Client wins (last write wins)** | Single-user data edited on one device at a time — a draft, a local preference | Silent data loss if the assumption breaks |
| **Field-level merge** | Records where different fields change independently — a profile, a form | Needs per-field dirty tracking in the outbox, not a whole-object PUT |
| **Ask the user** | The conflict is meaningful and rare — a document, an appointment | UI work, and a place to hold both versions until it is resolved |
| **Append-only / event log** | Values that accumulate rather than replace — comments, measurements, a ledger | Changes the data model; removes most conflicts by construction |
| **CRDT / sync engine** | Genuine multi-device concurrent editing | A library and a compatible backend; do not hand-roll it |

Two rules regardless of strategy: **send only the fields that changed** (a full-object PUT turns every concurrent edit into a conflict), and **never resolve a conflict by silently discarding user input** — if the local version loses, the user is told, or the version is kept somewhere recoverable.

## 7. Reconnection

- **Connectivity APIs report the interface, not reachability.** "Connected to Wi-Fi" is true on a captive portal, behind a dead VPN, and on a hotel network that resolves DNS to a login page. Treat the connectivity event as a *hint to try*, and treat a successful request as the only proof of connectivity.
- **Backoff with jitter.** Exponential, capped (a minute or two), with randomization. Without jitter, every device that lost the same backend retries in lockstep and re-creates the outage.
- **Distinguish the error classes.** Retry on timeouts, 5xx, and connection failures. Do not retry a 4xx other than 408/429 — it will fail identically forever. Honour `Retry-After` on 429 and 503.
- **Drain on the right triggers:** app foreground, connectivity regained, a periodic constrained background job, and an explicit user pull-to-refresh. Not a polling timer.
- **Single-flight the drain.** Two concurrent drains after a fast reconnect/disconnect/reconnect send everything twice; a mutex or a single worker with unique work policy prevents it.

## 8. Tell the user the truth

Offline UX fails in predictable ways, and each one is reviewable:

- [ ] The user can tell the difference between "saved on this device" and "saved on the server". A pending indicator per item, not one global banner.
- [ ] An optimistic update that later fails is **rolled back visibly**, with the reason and a retry — never silently reverted, never left looking saved.
- [ ] Stale data shows its age ("updated 2 hours ago") where staleness matters.
- [ ] Actions that genuinely cannot work offline are disabled with an explanation, not offered and then failed.
- [ ] Dead-lettered operations are reachable and retryable or discardable by the user; nothing is lost in silence.
- [ ] Logging out, or clearing data, with a non-empty outbox asks the user first.

## 9. Test the failure cases, not the happy path

An offline feature that was only tested by toggling airplane mode is untested. The cases that break real implementations:

1. Write offline → kill the process → relaunch → reconnect. The write must still be sent.
2. Write → the response is lost after the server committed → retry. Exactly one record must exist.
3. Two writes to the same record offline → reconnect. The server must end up with the final state, in order.
4. Write offline → the same record is changed on the server → reconnect. The configured conflict strategy must be what actually happens.
5. Reconnect with a large queue → the app is backgrounded mid-drain. The drain resumes and does not duplicate.
6. A permanently rejected operation (validation error). The queue continues; the user is told.
7. Clock skew: the device's clock is hours off. Nothing that decides ordering or expiry may depend on the device clock.
8. App update with pending entries whose payload format changed.

Each reference names the platform's tools for forcing these conditions — network link conditioners, emulator network profiles, and the fake/test doubles that make cases 2 and 4 deterministic instead of a race. Test-harness patterns are in [mobile-test](../mobile-test/SKILL.md).

## 10. Evidence and severity

Point to `file:line`, and name which of the nine cases in §9 the code fails.

- **Critical:** data loss or duplication — writes dropped on process death, retries without idempotency, a conflict strategy that discards user input silently, an outbox held in memory.
- **High:** the feature does not work as promised — the queue blocked by one failed entry, no backoff (battery and a self-inflicted outage), no conflict detection where concurrent edits are expected, optimistic updates never rolled back.
- **Medium:** friction and waste — no operation collapsing, refetching everything on every launch, a connectivity check trusted as reachability.
- **Low:** polish — missing per-item pending state, no age on stale data.
