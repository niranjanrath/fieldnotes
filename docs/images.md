# Adding images to posts

Every image on the blog is **responsive, lazy-loaded, layout-shift free, keyboard accessible,
dark-mode aware (optional) and click-to-zoom.** There are two ways to add one. A complete
example lives in `_posts/2026-10-21-diagrams-belong-next-to-the-code.md`.

## 1. Where files go

```
assets/images/posts/<post-slug>/
    diagram-light.svg
    diagram-dark.svg
    photo-720.webp   photo-1440.webp
    photo-720.jpg    photo-1440.jpg
```

One folder per post keeps things tidy and easy to delete.

## 2. The quick way: Markdown

```markdown
![Alt text](/assets/images/posts/my-post/photo.jpg "Caption shown under the image")
```

The theme automatically wraps it in a `<figure>`, turns the title into a numbered caption
("Fig. 1 …"), adds `loading="lazy"` and `decoding="async"`, and enables click-to-zoom.

Add dimensions with kramdown attributes to stop the page shifting while it loads:

```markdown
![Alt text](/assets/images/posts/my-post/photo.jpg "Caption"){: width="1200" height="800"}
```

## 3. The full way: `figure.html`

```liquid
{% include figure.html
   src="/assets/images/posts/my-post/photo-1440.jpg"
   alt="Describe what the image shows"
   caption="Optional caption, *markdown* and [links](https://example.com) allowed"
   width=1440 height=900 %}
```

| Option | Required | What it does |
| --- | --- | --- |
| `src` | yes | Image path, starting with `/assets/`. `baseurl` is added for you. |
| `alt` | yes | Text for screen readers and when the image fails. Use `alt=""` only for purely decorative images. |
| `width`, `height` | yes | Intrinsic pixel size. Reserves space so the layout never jumps. |
| `caption` | no | Shown beneath as "Fig. N". Markdown allowed. |
| `wide` | no | `wide=true` lets the figure extend beyond the text column on large screens. |
| `dark` | no | Path to a dark-mode version of `src`. Swaps with the theme toggle. |
| `webp` | no | WebP version, served through `<picture>` with `src` as the fallback. |
| `srcset` | no | Widths for the fallback, e.g. `"/assets/a-720.jpg 720w, /assets/a-1440.jpg 1440w"`. |
| `webp_srcset` | no | Same, for the WebP source. |
| `sizes` | no | Defaults to the text column width. Override only for unusual layouts. |
| `eager` | no | `eager=true` disables lazy loading. Use for an image at the very top of a post. |
| `zoom` | no | `zoom=false` turns off click-to-zoom for that figure. |

> **Tip.** In `srcset` values every path must start with `/assets/` — the include rewrites that
> prefix to include your `baseurl`, so the same markup works locally and on GitHub Pages.

## 4. Social preview image

Add `image:` to the post's front matter. `jekyll-seo-tag` uses it for the link preview on
social networks and chat apps. Use about 1200 × 630 px.

```yaml
image: /assets/images/posts/my-post/cover-1200.png
```

## 5. Dark mode

- **SVG diagrams:** export a light and a dark version and pass both (`src` and `dark`).
- **Photos and screenshots:** usually need no variant.
- **Screenshots of a light UI:** the soft border and rounded corners keep them from glaring.

## 6. Making smaller files

```bash
# WebP (needs libwebp / `cwebp`)
cwebp -q 82 photo-1440.jpg -o photo-1440.webp
# resize with ImageMagick
magick photo.jpg -resize 720x photo-720.jpg
```

Aim for under ~150 KB per image at 1440 px wide. SVG is best for diagrams.

## 7. Accessibility checklist

- Alt text says what the image **shows or means**, not "image of".
- Diagrams: describe the relationships ("A reads from B"), not just the boxes.
- Captions add context; they don't repeat the alt text.
- Zoomable images are reachable by keyboard (Tab, then Enter; Esc closes).
