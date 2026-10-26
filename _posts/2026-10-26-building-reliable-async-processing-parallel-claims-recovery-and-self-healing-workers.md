---
title: "Building Reliable Async Processing: Parallel Claims, Recovery, and Self-Healing Workers"
subtitle: A small Spring Boot case study on turning at-least-once delivery from theory into observable, multi-instance behavior.
date: 2026-10-26 20:55:00 +0200
tags: [architecture, spring-boot, outbox, distributed-systems]
description: A practical case study using a requester/processor split, PostgreSQL transactional outbox, FOR UPDATE SKIP LOCKED, and ShedLock-protected recovery.
---
Most architecture diagrams make event delivery look clean: write once, process once, done. Real systems are less polite. Instances restart. Network calls fail. One worker gets slower than the rest. If the design is weak, "event-driven" becomes "event-mystery-driven".

This case study shows a deliberately small, testable setup that behaves like a production shape:

- `demo-requester` accepts API calls and writes business data + outbox event in **one transaction**.
- `demo-processor` runs on multiple instances and processes outbox rows with `FOR UPDATE SKIP LOCKED`.
- A recovery scheduler (ShedLock-protected) requeues stale `PROCESSING` rows after worker crashes.

The goal is not novelty. The goal is confidence: you can explain *why* no duplicate claim happens, *why* stalled rows are recovered, and *what* each instance is doing in SQL terms.

## Repository

> TODO: Add GitHub repository link here once published.
>
> Example: `https://github.com/<your-org-or-user>/<repo-name>`

## The whole design in one flowchart

```mermaid
%% caption: Request write and asynchronous processing path.
%% alt: Flowchart. API request enters requester. In one transaction, user_request and outbox_event rows are inserted. Processor instances poll NEW rows with SKIP LOCKED, mark rows PROCESSING, process them, and update status to PROCESSED or FAILED. A recovery scheduler requeues stale PROCESSING rows to NEW.
flowchart LR
  caller([Client]) --> api[demo-requester\nPOST /api/requests]
  api --> tx{Single DB\ntransaction}
  tx --> ur[(user_request)]
  tx --> oe[(outbox_event\nstatus=NEW)]

  subgraph workers [demo-processor instances]
    p1[processor-1 scheduler]
    p2[processor-2 scheduler]
  end

  oe --> claim[Claim batch\nFOR UPDATE SKIP LOCKED]
  p1 --> claim
  p2 --> claim
  claim --> processing[(outbox_event\nstatus=PROCESSING)]
  processing --> done[(status=PROCESSED)]
  processing --> failed[(status=FAILED)]

  rec[Recovery scheduler\nShedLock protected] --> stale{stale PROCESSING\nlocked_at too old?}
  stale -- yes --> requeue[(status=NEW\nlocked_* cleared)]
  requeue --> claim
```

## Why the split matters: write path and process path fail differently

Putting "write business data" and "publish event" in separate systems creates an unavoidable gap. The transactional outbox closes that gap because both writes happen in the same commit.

```mermaid
%% caption: Request-side sequence with transactional outbox write.
%% alt: Sequence diagram. Client calls requester. Requester opens a transaction, inserts user_request, inserts NEW outbox row, commits, and returns accepted. If commit fails, neither row is kept.
sequenceDiagram
  autonumber
  actor C as Client
  participant R as demo-requester
  participant DB as PostgreSQL

  C->>R: POST /api/requests
  R->>DB: BEGIN
  R->>DB: INSERT user_request
  R->>DB: INSERT outbox_event(status=NEW)
  R->>DB: COMMIT
  DB-->>R: success
  R-->>C: 202 Accepted
```

No message broker is needed to prove the pattern. The outbox table itself is the durable hand-off.

## Parallel claim without duplicate claim

`FOR UPDATE SKIP LOCKED` is the key to safe multi-instance polling.

```mermaid
%% caption: Two processors claim different rows in parallel.
%% alt: Sequence diagram. Processor-1 and processor-2 run claim query concurrently. Processor-1 locks first rows; processor-2 skips those locks and claims later rows. Both update their rows to PROCESSING and commit, resulting in disjoint batches.
sequenceDiagram
  autonumber
  participant P1 as processor-1
  participant P2 as processor-2
  participant DB as PostgreSQL

  par Poll tick
    P1->>DB: SELECT ... WHERE status='NEW'\nFOR UPDATE SKIP LOCKED LIMIT 10
    and
    P2->>DB: SELECT ... WHERE status='NEW'\nFOR UPDATE SKIP LOCKED LIMIT 10
  end

  Note over DB: Rows locked by P1 are skipped by P2, not waited on.

  P1->>DB: UPDATE claimed rows -> PROCESSING, locked_by='processor-1'
  P2->>DB: UPDATE claimed rows -> PROCESSING, locked_by='processor-2'
  P1->>DB: COMMIT
  P2->>DB: COMMIT
```

Important nuance: this guarantees **disjoint claims**, not equal distribution. Faster workers tend to claim more over time.

## Where ShedLock helps (and where it doesn't)

For claim loops using `SKIP LOCKED`, ShedLock is optional for correctness. For maintenance jobs, it is operationally valuable.

```mermaid
%% caption: Responsibility split between SKIP LOCKED and ShedLock.
%% alt: Flowchart. Processing lane uses parallel polling with SKIP LOCKED for safe row-level claim. Recovery lane uses ShedLock so only one instance runs stale-row requeue at each interval.
flowchart TB
  subgraph processing_lane [High-throughput processing lane]
    a[All processor instances poll]
    b[SKIP LOCKED prevents duplicate claim]
    c[Rows transition NEW -> PROCESSING -> PROCESSED/FAILED]
    a --> b --> c
  end

  subgraph recovery_lane [Maintenance recovery lane]
    r1[Scheduled stale-row scan]
    r2[ShedLock elects one runner]
    r3[Requeue stale PROCESSING rows]
    r1 --> r2 --> r3
  end
```

In plain terms:

- `SKIP LOCKED` protects row-claim concurrency.
- ShedLock protects singleton maintenance behavior.

Using both in the right place keeps throughput and predictability together.

## State model as an engineering contract

Treat status transitions as an explicit contract, not an incidental implementation detail.

```mermaid
%% caption: Outbox event state transitions.
%% alt: State diagram. NEW transitions to PROCESSING when claimed. PROCESSING transitions to PROCESSED on success or FAILED on processing error. Stale PROCESSING can be recovered back to NEW.
stateDiagram-v2
  [*] --> NEW
  NEW --> PROCESSING: claim batch
  PROCESSING --> PROCESSED: handler success
  PROCESSING --> FAILED: handler error
  PROCESSING --> NEW: recovery requeue\n(stale lock)
```

If a transition is not in the diagram, it should not be in code.

## What this case study proves in practice

1. **No write gap:** API data and outbox event commit atomically.
2. **No duplicate claim in parallel pollers:** concurrent workers claim disjoint sets.
3. **Crash tolerance:** stale `PROCESSING` rows are returned to `NEW` by scheduled recovery.
4. **Operability:** `locked_by`, `locked_at`, attempts and status counts make behavior explainable from SQL.

{: .callout}
**Try it:** run two `demo-processor` instances with different `-Ddemo.processor.instance-name` values, submit 30 requests, and inspect `outbox_event`. You should see both instances in `locked_by`, uneven but valid distribution, and clear status transitions.


