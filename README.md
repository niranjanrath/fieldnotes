# Fieldnotes — a Jekyll blog theme

Editorial serif typography, dark mode, client-side search, tags, reading time,
auto table of contents, RSS, SEO tags and syntax highlighting. GitHub Pages
compatible (only allowed plugins; no build step beyond Jekyll).

## Run locally
    bundle install
    bundle exec jekyll serve      # http://localhost:4000

## Deploy (GitHub Pages)
1. Push to a repo; Settings → Pages → deploy from branch.
2. In `_config.yml` set `url` (and `baseurl: "/repo-name"` for project sites).

## Write
Add `_posts/YYYY-MM-DD-title.md`:

    ---
    title: "My post"
    subtitle: Optional italic standfirst
    tags: [css, design]
    description: One-line summary for lists and SEO
    ---

Images: see [`docs/images.md`](docs/images.md) (responsive, lazy, dark-mode aware, zoomable). Example post: `_posts/2026-10-22-diagrams-belong-next-to-the-code.md`.

Diagrams from code (Mermaid): see [`docs/diagrams.md`](docs/diagrams.md). Example post: `_posts/2026-10-22-draw-it-in-text-review-it-in-a-pull-request.md`.

Callout: put `{: .callout}` on the line before a paragraph.

## Customise
- Name, tagline, author, social: `_config.yml`
- Navigation: `_data/navigation.yml`
- Accent colour: `accent: teal` or `accent: terracotta` in `_config.yml`; all tokens at the top of `assets/css/main.css`
- Fonts are self-hosted in `assets/fonts` (SIL OFL).

The five posts are sample content: delete them and write your own.
Search: press `/` or ⌘/Ctrl-K.
