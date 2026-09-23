---
name: mobile-observability
description: Designs and reviews production observability for mobile apps on every stack — Flutter, native Android, native iOS, React Native and Kotlin Multiplatform. Covers crash and error reporting with usable context, breadcrumbs, structured logs, traces and custom metrics, release and cohort segmentation, correlation with backend requests, alerting thresholds, sampling and cost, and what must never be collected. Use when production problems cannot be explained from the available data, when setting up crash reporting or telemetry, or when defining release health alerts.
intents: [observability]
stacks: ["*"]
---

# Mobile Observability

What you can learn about the app after it has shipped, on every stack. This file holds the model, the segmentation rules and the privacy limits; each platform's SDKs, symbol upload and field-metric sources live in its reference.

## 1. Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Native Android | [references/android.md](references/android.md) |
| Native iOS | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

Firebase Crashlytics, Analytics and Performance Monitoring setup per stack is in [mobile-firebase](../mobile-firebase/SKILL.md). Release gating on these signals is in [mobile-release](../mobile-release/SKILL.md); the lab counterpart of the performance metrics is in [mobile-performance](../mobile-performance/SKILL.md).

## 2. Mobile is not a server

Everything below follows from four differences, and ignoring them is what produces a telemetry setup that costs money and answers nothing:

1. **You cannot log in to the device.** There is no `kubectl logs`. If the data was not collected and sent before the user gave up, it does not exist.
2. **The old version never goes away.** A server rolls back in minutes; an app version lives on devices for months. Every signal must be sliced by app version, or a fixed bug and a live bug look identical in the aggregate.
3. **The device is the constraint.** Telemetry costs the user's battery, data plan and storage. A payload sent per event is a wakeup per event — see [background.md](../mobile-performance/references/background.md).
4. **Reports arrive late and out of order.** A crash is reported on the *next* launch; a device offline for a week uploads a week later. Never read the last hour of a metric as "what is happening now" without accounting for the reporting delay.

## 3. The signals, and what each one answers

| Signal | Answers | Usual failure |
|---|---|---|
| **Crashes** | The process died. Where, on which OS/device/version | Obfuscated stack traces — symbols not uploaded |
| **Non-fatal errors** | A caught failure the user saw as a broken screen | Everything caught and logged, so the important one is invisible |
| **ANRs / hangs / terminations** | The app froze or was killed, without a crash report | Only watching crashes and missing the majority of bad sessions |
| **Breadcrumbs** | What the user did in the seconds before the failure | Free text with no structure, useless for grouping |
| **Structured logs** | The detail behind one session | Sent for every session, at full volume, at full cost |
| **Traces / spans** | Where the time went in one flow, across app and backend | Instrumented only in the app, so the backend half is invisible |
| **Metrics** | The aggregate: latency percentiles, success rates, adoption | Averages instead of percentiles |
| **Product analytics** | Whether the user completed the journey at all | Treated as observability; it shows the drop, never the cause |

A production incident needs at least three of these to be explainable: **what broke** (crash/error), **what led to it** (breadcrumbs/logs), and **how many users** (metrics segmented by version).

## 4. Segmentation: the dimensions that must be on every signal

Attach these to every crash, error, span and metric, or the data cannot be sliced when it matters:

- **App version and build number** — non-negotiable; every comparison is version-over-version.
- **OS version and device model** — most "random" crashes are one OS version or one manufacturer.
- **Release channel / rollout stage** — internal, beta, staged rollout percentage, full.
- **A stable install id**, not a user id, for counting affected users. It must be resettable and must not follow the person across reinstalls or apps (see §8).
- **Locale and region** where formatting, right-to-left layout or regulation differ.
- **Connectivity class** at the time (offline, cellular, Wi-Fi) for anything network-related.
- **Feature flag / experiment state** for flags that change the code path. A crash present only in one variant is otherwise unattributable.

Keep the cardinality bounded. A dimension whose value is a user id, a timestamp or a free-text message turns a metric into millions of series and is the standard way to make an observability bill unpayable.

## 5. Error context: make one report enough

A stack trace alone rarely explains a mobile failure. A report is useful when it carries:

- **The stack trace, symbolicated.** Verify symbol upload in CI for every build variant — an unsymbolicated release build is the most common and most expensive gap. The reference names the mechanism per stack.
- **Custom keys** for the state that decides the code path: the screen, the entity id being acted on, the auth state, whether the outbox was non-empty, the flag values.
- **Breadcrumbs as structured events**, not sentences: `screen_view{name}`, `network{method, host, status, ms}`, `tap{target}`, `state_change{from, to}`. Cap them (the last 50–100) and drop the payloads.
- **The grouping key.** Reports group by stack signature; a generic wrapper (`throw AppException(e)`) collapses a hundred distinct causes into one issue and hides all of them. Preserve the cause chain, and put the variable detail in keys, not in the exception message.
- **A correlation id** shared with the backend (§6).
- **Whether the user saw it.** A caught-and-recovered error and a blank screen are different severities and should be distinguishable without reading code.

## 6. Correlation with the backend

Mobile latency is mostly backend latency, and the app's "the request was slow" is unactionable on its own.

- Generate a **request id** per outbound call on the device, send it in a header, log it on both sides, and put it on the client-side span and on any error report from that call. One id makes "slow for this user at that minute" a single backend query instead of a guess.
- Use **W3C Trace Context** (`traceparent`) when the backend is already traced, so the mobile span is the parent of the server spans rather than a disconnected record. OpenTelemetry clients exist for mobile; the reference names the current state per stack.
- Attach a **session id** that spans the app session, so several failing calls can be recognized as one bad session.
- **Propagate nothing sensitive** in these headers, and never put a token in a trace attribute.

Without correlation, the mobile team and the backend team argue from two datasets. With it, the argument is a join.

## 7. Alerting: on the few things that mean "stop the rollout"

Most mobile alerts are noise because they fire on a raw count that tracks daily usage. Alert on **rates**, segmented by version, with the reporting delay in mind:

| Alert | Reasonable shape |
|---|---|
| Crash-free sessions drop | Below your baseline (commonly 99.5%+ for a mature app) **for the new version**, compared against the previous one |
| ANR / hang rate | Above the platform's own bad-behaviour threshold; both stores act on this |
| New issue in a new release | Any issue whose first occurrence is this version and which affects more than N users — this is the one that stops a staged rollout |
| Critical journey success rate | Login, checkout, sync drain: success percentage per version, not per absolute count |
| Startup and key-screen latency | P90, per version, against the previous release's value |

Rules that keep alerts trustworthy: compare a version against the previous version and not against last week; require a minimum session count before a percentage can fire; suppress alerts during the first minutes of a rollout when the denominator is tiny; and route each alert to someone who can act — a page for release health, a dashboard for everything else. An alert nobody acts on should be deleted, not muted.

## 8. Sampling and cost

Full-fidelity telemetry from every session is neither affordable nor kind to the device.

- **Never sample crashes, ANRs or fatal errors.** They are rare and each one matters.
- **Sample traces and verbose logs** — a small percentage of sessions at full detail answers most questions. Make the decision **per session, not per event**, so a sampled session is complete and readable end to end.
- **Always keep the sessions that failed.** Sampling that discards the broken session is worse than no sampling: raise the rate for sessions with an error, or buffer locally and upload only on failure.
- **Batch uploads**, with a size and a time bound, and flush on background/terminate. One flush per event is a radio wakeup per event.
- **Bound the local buffer** and drop the oldest when it is full; an unbounded telemetry queue fills the device and turns a monitoring feature into a support ticket.
- **Respect the network.** Do not upload telemetry on metered or constrained connections unless it is a crash report.
- **Record the sampling rate with the data.** A percentile computed from a sampled set without knowing the rate is wrong, and someone will read it as absolute.

## 9. What must never be collected

Observability is where privacy violations happen by accident, because logging "the request" logs whatever was in it.

- **Never log:** passwords, tokens, refresh tokens, API keys, full payment data, government ids, health data, precise location, message or document contents, or full request/response bodies from authenticated endpoints.
- **Redact at the source**, in the SDK's callback before send (every reporter has one), not in the backend pipeline. Data that left the device is already disclosed.
- **URLs carry secrets** in query strings — strip query parameters, or allow-list them. A URL is an attribute, not a free-text field.
- **Crash reports include more than you sent**: register values, thread names, and sometimes fragments of memory in native crashes. Treat the whole report as sensitive and restrict who can read it.
- **Consent gates collection.** On both stores, telemetry and analytics must match the declared data-safety/privacy-nutrition disclosures and the app's consent state. A user who declined analytics must not have analytics sent, and the SDK must be initialized accordingly — not initialized and then asked to stay quiet.
- **Prefer aggregation and short retention** for anything user-linked, and be able to delete a person's data on request, which requires the install id to be mappable and resettable.

This overlaps with [mobile-security](../mobile-security/SKILL.md); when in doubt, the answer is to send less.

## 10. Reviewing an existing setup

- [ ] Symbol/mapping upload happens in CI for every shipped variant, and a release build's crash is verifiably readable.
- [ ] App version, OS, device, channel and flag state are on every signal.
- [ ] ANRs, hangs and background terminations are collected, not just crashes.
- [ ] Caught errors are distinguishable from user-visible failures, and grouping is not collapsed by a generic wrapper.
- [ ] Breadcrumbs are structured and capped; logs are sampled; crashes are not.
- [ ] A client-generated correlation id reaches the backend and appears in error reports.
- [ ] Alerts are rate-based, per version, with a minimum-volume guard, and each one has an owner.
- [ ] Telemetry uploads are batched, bounded, flushed on background, and off on metered connections.
- [ ] A redaction callback exists and is tested; no secrets, bodies or precise location are sent.
- [ ] Collection respects consent and matches the store privacy declarations.
- [ ] Someone can answer "how many users on 4.2.0 hit this, and what were they doing" without adding code.

The last line is the real test. If answering an ordinary production question requires shipping a new build and waiting two weeks for adoption, the setup has failed regardless of how many SDKs are installed.
