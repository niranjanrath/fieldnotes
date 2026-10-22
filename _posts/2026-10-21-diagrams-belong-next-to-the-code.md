---
title: Diagrams belong next to the code
subtitle: A picture is a decision with the reasoning left out. Keep the reasoning in the same repository.
date: 2026-10-21 18:00:00 +0200
tags: [architecture, documentation, engineering]
description: How to publish architecture diagrams that load fast, survive dark mode, and stay reviewable — with a worked example of every image pattern this blog supports.
image: /assets/images/posts/diagrams-next-to-code/blog-home-1440.png
---
Every architecture review I've sat in has the same moment. Someone shares a diagram, everyone nods, and three months later nobody can say *why* the arrows point the way they do. The picture survived; the reasoning didn't.

The fix is unglamorous: **treat diagrams like code.** Store them in the repository, review them in pull requests, and put the explanation within scrolling distance of the picture.

## Start with one honest diagram

Here is the container-level view of the local-first to-do app from [an earlier post]({{ '/2026/local-first-is-a-boring-idea/' | relative_url }}). It is an SVG, so it stays crisp at any size, and it ships in two colour schemes — flip the theme toggle and watch it follow.

{% include figure.html
   src="/assets/images/posts/diagrams-next-to-code/c4-containers-light.svg"
   dark="/assets/images/posts/diagrams-next-to-code/c4-containers-dark.svg"
   alt="C4 container diagram. A Reader uses a PWA shell inside the user's device. The shell reads and writes a local IndexedDB store and is cached by a service worker. A dashed, optional Sync API sits outside the device boundary."
   caption="Containers inside the user's device, with the optional sync API *outside* the trust boundary."
   width=1200 height=560 wide=true %}

Three things in that picture are decisions, not decoration: the **dashed boundary** (what we trust), the **dashed box** (what we have deliberately not built yet) and the **labels on the arrows** (what actually flows).

## Photos and screenshots need more care

Vector diagrams are the easy case. Raster images — screenshots, photographs, whiteboard shots — are where pages quietly get heavy. The figure below is a real screenshot of this blog's home page, served three ways at once:

- a **WebP** source for browsers that support it, about a third of the size;
- a **PNG** fallback for everything else;
- two widths (720 and 1440 pixels) so a phone never downloads the desktop version.

{% include figure.html
   src="/assets/images/posts/diagrams-next-to-code/blog-home-1440.png"
   srcset="/assets/images/posts/diagrams-next-to-code/blog-home-720.png 720w, /assets/images/posts/diagrams-next-to-code/blog-home-1440.png 1440w"
   webp="/assets/images/posts/diagrams-next-to-code/blog-home-1440.webp"
   webp_srcset="/assets/images/posts/diagrams-next-to-code/blog-home-720.webp 720w, /assets/images/posts/diagrams-next-to-code/blog-home-1440.webp 1440w"
   alt="Screenshot of the Fieldnotes home page: a large serif headline, a short introduction, two buttons and the latest essay card."
   caption="The Fieldnotes home page, served as WebP with a PNG fallback at two widths."
   width=1440 height=900 %}

Notice what you *didn't* see: the page jumping when the image arrived. Every figure declares its `width` and `height`, so the browser reserves the right amount of space before a single byte of the image has loaded. Images further down the page are also lazy-loaded, so they cost nothing until you scroll near them.

## The quick way: plain Markdown

You don't need the include for everything. A standard Markdown image works too, and the theme upgrades it automatically — lazy loading, a numbered caption from the title text, and click-to-zoom:

```markdown
![Alt text that describes the image](/assets/images/posts/my-post/photo.jpg "A caption shown beneath the image")
```

Use the include when you need dark-mode variants, responsive sources or a wide layout; use plain Markdown for everything else.

## A short checklist before you publish

1. **Write real alt text.** Describe what the image *shows*, not that it's an image. If it's a diagram, say what the arrows mean.
2. **Set width and height** so nothing shifts.
3. **Keep source files.** Commit the Mermaid, draw.io or Figma export next to the image so the next person can edit it.
4. **Put the reasoning beside the picture.** One paragraph is enough.

{: .callout}
**Writing your own?** The full option list lives in `docs/images.md` in the repository. Copy this post, swap the images, and you have a new one.
