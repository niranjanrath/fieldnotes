---
title: "Local-first is a boring idea whose time has come"
subtitle: Your app doesn't need a server to be useful. It needs one to be shared.
date: 2026-10-14 09:00:00 +0200
tags: [architecture, local-first, pwa]
description: Most small tools are single-user, so why do they all start with a login page and a database in someone else's cloud? A case for building the other way around.
---
Most of the software I use daily is embarrassingly simple. A list, a form, a chart. Yet nearly all of it wants an account, an internet connection and a monthly fee — for the privilege of storing my own data on a computer I don't control.

Local-first software turns that around. The **primary copy of your data lives on your device**, the app works with no network at all, and the server — if there is one — becomes a convenience for syncing and sharing rather than a prerequisite for existing.

## Why it feels better

Three things change when the data is already in your pocket:

- **Speed.** Reads and writes hit local storage, so the UI never waits on a round-trip. There is no spinner because there is nothing to wait for.
- **Ownership.** Export is a file. Backup is a file. Leaving the app is a file. Nobody can sunset your notes.
- **Resilience.** A tunnel, a plane, a flaky café connection — the app doesn't care.

> The best loading state is the one you never see.

## The smallest useful version

You don't need a CRDT research paper to start. For a single-user tool, a thin wrapper over IndexedDB gets you surprisingly far. Here is the whole persistence layer for a to-do list, using [Dexie](https://dexie.org):

```js
import Dexie from "dexie";

export const db = new Dexie("todos");
db.version(1).stores({
  // ++id = auto-increment primary key; the rest are indexed fields
  items: "++id, done, createdAt",
});

export const add = (title) =>
  db.items.add({ title, done: false, createdAt: Date.now() });

export const toggle = async (id) => {
  const item = await db.items.get(id);
  return db.items.update(id, { done: !item.done });
};

export const open = () => db.items.where("done").equals(0).toArray();
```

That's it. No API, no auth, no migrations service. Add a service worker and the thing installs on a phone and works on a train.

## Where it gets hard

I won't pretend it's free. The honest list of costs:

| Concern | What bites | Pragmatic answer |
| --- | --- | --- |
| Sync | Two devices edit the same record | Last-write-wins to start; CRDTs when it hurts |
| Backup | Browsers can evict storage | Offer one-tap export and import |
| Search | No server-side index | Build a small in-memory index at load |
| Sharing | There is no "central" copy | Share snapshots, not live state |

Notice that every row has a boring, shippable answer. That is the theme of this whole approach: **defer the hard distributed-systems problem until a real user actually has it.**

## A rule of thumb

Ask of any new tool: *does this need to be multi-user on day one?* If the honest answer is no, start local, make export trivial, and add a sync layer only when someone asks for it. You'll ship sooner, your users will keep their data, and — a small bonus — your hosting bill will be zero.

{: .callout}
**Try it:** take the next side project you were going to wire to a database and ship it as a static page with IndexedDB instead. See how far you get in an afternoon.
