---
title: Typography is most of the interface
subtitle: Ninety per cent of a reading UI is text. Treat the other ten as garnish.
date: 2026-09-04 10:00:00 +0200
tags: [css, design, typography]
description: A short, practical tour of the CSS that makes long-form text pleasant to read — measure, rhythm, optical sizes and the details that quietly add up.
---
Open any article you've enjoyed and strip away the colours. What's left is typography, and it's doing nearly all the work. The good news: great reading experiences come from a handful of decisions you can make once and forget.

## Pick a measure and defend it

The single most effective change is **line length**. Somewhere around 60–70 characters per line is where eyes track comfortably. Use the `ch` unit and let the font do the arithmetic:

```css
.prose {
  max-width: 66ch;
  margin-inline: auto;
}
```

Wide screens don't need wide text; they need generous margins.

## Let size breathe with the viewport

Fixed font sizes are either too small on a big monitor or too big on a phone. `clamp()` gives you a floor, a ceiling and a smooth line between them:

```css
body {
  font-size: clamp(1.125rem, 1.06rem + 0.28vw, 1.25rem);
  line-height: 1.62;
}

h1 {
  font-size: clamp(2.1rem, 1.3rem + 3.6vw, 3.8rem);
  line-height: 1.06;
  letter-spacing: -0.025em;
}
```

Notice the pattern: **big type gets tighter leading and tighter tracking; small type gets looser.** Display sizes can afford to hug; body text needs room.

## Use the font's optical sizes

Modern variable fonts ship with an *optical size* axis: letterforms redraw themselves for display or text. It's free quality — you only have to turn it on.

```css
body { font-optical-sizing: auto; }

.hero-title {
  font-family: "Fraunces", Georgia, serif;
  font-variation-settings: "opsz" 144, "SOFT" 30;
}
```

## The small stuff that adds up

- `text-wrap: balance` on headings stops the lonely last word.
- `text-wrap: pretty` on paragraphs avoids orphans.
- `hyphens: auto` with a correct `lang` attribute tidies ragged edges on narrow screens.
- Tabular numerals (`font-variant-numeric: tabular-nums`) keep columns of figures aligned.

| Property | Where | Effect |
| --- | --- | --- |
| `text-wrap: balance` | headings | even line lengths |
| `text-wrap: pretty` | paragraphs | no orphans |
| `font-optical-sizing` | body | better letterforms |
| `hanging-punctuation` | quotes | cleaner left edge |

## One last thing

Contrast isn't just for accessibility checklists. Soft, warm greys on paper tones read beautifully — right up until they drop below roughly 4.5:1. Check the numbers, then trust your eyes.

> Good typography is invisible. Bad typography is everywhere.
