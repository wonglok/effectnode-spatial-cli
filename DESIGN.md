---
name: EffectNode FX Studio
description: A calm, precise node-based VFX authoring studio for real-time WebGPU effects
colors:
  tiffany-500: "#0abab5"
  tiffany-600: "#089a96"
  tiffany-700: "#077a77"
  tiffany-800: "#06605e"
  tiffany-50: "#effbf9"
  ink-50: "#f3f7f7"
  ink-200: "#d2dee1"
  ink-300: "#b0c3c8"
  ink-500: "#5e7c83"
  ink-700: "#395057"
  ink-900: "#18272c"
  ink-950: "#0d191c"
  surface: "#ffffff"
  canvas-bg: "#f4f9f8"
typography:
  body:
    fontFamily: '"Avenir Next", Avenir, "Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '"Avenir Next", Avenir, "Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: "12px"
    fontWeight: 500
  mono:
    fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.tiffany-600}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.tiffany-700}"
  button-primary-active:
    backgroundColor: "{colors.tiffany-800}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-700}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
---

# Design System: EffectNode FX Studio

## 1. Overview

**Creative North Star: "The Quiet Instrument."**

EffectNode FX Studio is a tool for real-time VFX artists working in a browser. The interface is an instrument: it must disappear into the task, leaving the artist's attention on the effect in the viewport, not on the chrome around it. Every surface is a working state — a real node tree, a real property editor, a real render — never a styled placeholder. Confidence comes from craft and speed, not decoration.

The system is restrained and light: near-white surfaces, a single sans family, crisp 1px borders, and a single saturated accent (Tiffany teal) reserved for action and active state. It rejects the 2023 AI-SaaS look outright — no frosted cards, no drifting aurora gradients, no gradient text, no marketing hero-metric layouts, no identical icon-card grids, no tiny all-caps eyebrows.

**Key Characteristics:**
- Tiffany is the accent, never the wallpaper (≤10% of any surface).
- One sans family (Avenir Next + system fallbacks) for everything; mono for code and data.
- Crisp 1px borders on cool teal-tinted neutrals; flat surfaces at rest.
- Compact density: text-xs/text-sm labels, tight paddings, deliberate whitespace.
- Standard affordances, familiar patterns — no invented controls, no custom scrollbars.

## 2. Colors: The Tiffany + Ink Palette

A restrained light system with one saturated accent and a cool, teal-tinted neutral ramp. The warm-neutral cream band is deliberately avoided; neutrals tilt toward the brand's own teal hue rather than toward warmth.

### Primary
- **Tiffany** (#0abab5, `tiffany-500`): the brand accent. Used for primary actions, current selection, active node state, focus rings, and selection highlights — never for decoration or large filled surfaces.
- **Tiffany Deep** (#089a96, `tiffany-600`): the canonical primary-button fill. Slightly darker than `tiffany-500` so text on it clears 4.5:1.
- **Tiffany Dark** (#077a77, `tiffany-700`): primary-button hover.
- **Tiffany Ink** (#06605e, `tiffany-800`): primary-button active (pressed).
- **Tiffany Tint** (#effbf9, `tiffany-50`): faint tint for hover washes and selected-row backgrounds.

### Neutral
- **Ink Wash** (#f3f7f7, `ink-50`): hover background for secondary controls.
- **Ink Border** (#d2dee1, `ink-200`): the default 1px border / divider color.
- **Ink Muted** (#395057, `ink-700`): secondary text, inactive icons, secondary-button text.
- **Ink** (#18272c, `ink-900`): body text and primary labels.
- **Ink Deep** (#0d191c, `ink-950`): strongest text, selection foreground.
- **Surface** (#ffffff): card and panel background.
- **Canvas Background** (#f4f9f8): the app body background — near-white with a subtle Tiffany tint, carrying faint radial washes of Tiffany / lavender / pink at very low alpha.

### Named Rules
**The Tiffany Is the Accent Rule.** Tiffany is reserved for actions and active state. It never fills a large surface, never backgrounds a panel, and never appears as a decorative gradient. Its rarity is the point.
**The Cool Neutral Rule.** Neutrals are teal-tinted, not warm. No cream, sand, bone, or beige body backgrounds — those are the saturated AI default this system rejects.

## 3. Typography

**Display Font:** none — this is product UI. A single sans carries headings, labels, body, and data.
**Body Font:** "Avenir Next", Avenir, "Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
**Mono Font:** ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace.

**Character:** One calm, legible family. No display/body pairing; hierarchy is carried by weight and size, not font change. Mono is for code, numeric data, and technical readouts only.

### Hierarchy
- **Title** (600, 18px, 1.4): page and panel headings.
- **Body** (400, 14px, 1.5): default text; prose capped at 65–75ch.
- **Label** (500, 12px, 1.4): buttons, field labels, toolbar text, node names.
- **Mono** (400, 13px, 1.5): code, coordinates, numeric values.

### Named Rules
**The One Sans Rule.** One sans family for the entire interface. No display faces in buttons, labels, or data. If a second font is wanted, it is the mono face — never a decorative display.

## 4. Elevation

Flat by default; depth is conveyed by tonal layering and 1px borders, not by shadow. Shadows are a response to state (hover) or true elevation (modals), not ambient decoration.

### Shadow Vocabulary
- **Card** (`0 1px 2px rgba(13,25,28,0.04), 0 10px 30px -12px rgba(13,25,28,0.16)`): resting cards and panels.
- **Card Hover** (`0 2px 4px rgba(13,25,28,0.05), 0 18px 44px -14px rgba(13,25,28,0.22)`): lifted cards on hover/focus.
- **Modal** (`0 24px 80px -16px rgba(13,25,28,0.35)`): dialogs and dropdowns floating above the app.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, focus) or to genuine stacking (modal, dropdown).

## 5. Components

### Buttons
- **Shape:** gently curved — 8px radius (`rounded-lg`) for standard buttons, 6px (`rounded-md`) for compact controls.
- **Primary:** Tiffany Deep fill (#089a96), white text, 8px/14px padding, 150ms ease transitions.
- **Hover / Active:** background darkens to `tiffany-700` on hover, `tiffany-800` on press (with a 1px translateY).
- **Secondary:** white fill, 1px `ink-200` border, `ink-700` text; hover swaps to `ink-50` background with `ink-300` border.
- **Compact / toolbar:** white fill, 1px `ink-200` border, `ink-700` text at 12px, hover to `ink-50`. Destructive actions tint red on hover only.

### Cards / Containers
- **Corner Style:** 12px radius (`rounded-xl`) for large cards, 8px for panels.
- **Background:** white (`#ffffff`).
- **Border:** 1px `ink-200`.
- **Shadow Strategy:** `--shadow-card` at rest, `--shadow-card-hover` on lift. No nested cards.

### Inputs / Fields
- **Style:** white fill, 1px `ink-200` border, 8px radius.
- **Focus:** 2px Tiffany ring (`ring-2` with `tiffany-500`), or the global `:focus-visible` 2px Tiffany outline with 2px offset.
- **Disabled / Error:** disabled at 40% opacity with cursor-not-allowed; error uses a red border and red-50 wash.

### Navigation
- **Style:** top toolbar with 1px `ink-200` bottom border on white; compact 12px labels; active state carries the Tiffany accent; inactive controls are `ink-700` on white.

## 6. Do's and Don'ts

### Do:
- **Do** use Tiffany only for actions, active state, and focus rings — ≤10% of any screen.
- **Do** keep 1px `ink-200` borders as the default separation; let whitespace do the rest.
- **Do** use Avenir Next (or its system fallbacks) for all text, mono for code and numbers.
- **Do** keep labels at 12px (text-xs) / body at 14px for a calm, dense working surface.
- **Do** respect reduced motion and visible `:focus-visible` rings.

### Don't:
- **Don't** use dreamy glassmorphism, frosted cards, or animated aurora gradients — the 2023 AI-SaaS look is banned.
- **Don't** use gradient text (`background-clip: text`) — emphasis is weight and size, never a gradient.
- **Don't** build marketing hero-metric layouts or identical icon-card grids.
- **Don't** add tiny all-caps tracked eyebrows above every section; one deliberate kicker is voice, one on every section is AI grammar.
- **Don't** use `border-left` / `border-right` thicker than 1px as a colored accent stripe.
- **Don't** use a display font in labels, buttons, or data.
- **Don't** reinvent standard affordances — no custom scrollbars, no non-standard modals.
