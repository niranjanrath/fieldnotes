---
title: Threat modeling without the ceremony
subtitle: Thirty minutes, one diagram and six questions will find more than a quarterly workshop.
date: 2026-09-29 08:30:00 +0200
tags: [security, process, architecture]
description: STRIDE is a checklist, not a ritual. How to run a lightweight threat model against a diagram you already have.
---
Threat modeling has a reputation problem. It sounds like a two-day workshop with sticky notes, a facilitator and a report no one reads. But the core idea is small: **look at your system as an attacker would, before they do.**

You can do a useful version in half an hour, alone, with the architecture diagram you already drew.

## Start from the boxes you have

If your team uses the [C4 model](https://c4model.com), you're already most of the way there. A container diagram shows people, systems, data stores and the arrows between them. Every arrow is a trust boundary waiting to be questioned.

Draw it. If you can't draw it, that's finding number one.

## The six questions

STRIDE gives each category a name, but you only need to ask a question per arrow and per box:

| Letter | Threat | Ask yourself |
| --- | --- | --- |
| S | Spoofing | Can someone pretend to be this caller? |
| T | Tampering | Can data be changed in transit or at rest? |
| R | Repudiation | Could someone deny doing this, and could I prove otherwise? |
| I | Information disclosure | What leaks if this is read by the wrong person? |
| D | Denial of service | What happens when this is slow or gone? |
| E | Elevation of privilege | Can a low-trust actor reach a high-trust action? |

Don't aim for completeness. Aim for the **three scariest** answers, write each as a sentence, and attach an owner.

## Make it a habit, not an event

The trick is to shrink the unit of work. Instead of modeling "the platform", model the change in the pull request:

```yaml
# .github/pull_request_template.md  (excerpt)
## Security
- [ ] Does this add or move a trust boundary?
- [ ] New data stored? Where, and who can read it?
- [ ] New input from outside the system?
- [ ] Anything here an attacker would want to abuse?
```

Four checkboxes won't find everything. They will keep the question alive, which is the part that usually dies.

## What good looks like

A finished threat model is not a document; it's a short list of decisions:

1. *We accept this risk* — and here's why.
2. *We mitigate it* — and here's the ticket.
3. *We don't understand it yet* — and here's who's finding out.

That third one is the honest one, and the most valuable.
