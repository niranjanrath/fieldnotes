---
title: A PWA is a service worker and a promise
subtitle: The manifest is the easy part. The promise — "this works offline" — is the work.
date: 2026-08-02 11:00:00 +0200
tags: [pwa, javascript, local-first]
description: What installability really requires, a minimal cache-first service worker, and the mobile details that make a web app feel native.
---
Making a web app installable takes about ten minutes. Making it *dependable* takes longer, and it's the part users actually feel.

## The checklist

To get an install prompt, you need a web app manifest, a registered service worker and HTTPS. The manifest is just JSON:

```json
{
  "name": "Work Links",
  "short_name": "Links",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#faf7f1",
  "theme_color": "#b4421a",
  "icons": [{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }]
}
```

## A cache-first service worker

For a static, self-contained app, the simplest strategy is the right one: precache the shell, serve from cache, fall back to the network.

```js
const CACHE = "app-v3";
const SHELL = ["/", "/index.html", "/app.js", "/styles.css"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
```

Bump the cache name whenever the shell changes; the `activate` handler tidies up the old one.

## The details that feel native

- Respect the safe areas: `padding-bottom: env(safe-area-inset-bottom)` on bottom bars.
- Put primary navigation within thumb reach, at the bottom.
- Make tap targets at least 44 pixels square.
- Never block on the network to paint the first screen.

## Keep the promise

Test offline mode like you test everything else: open DevTools, tick *Offline*, reload and click around. If anything spins forever, the promise is broken — and a user will find out on a train, not at your desk.
