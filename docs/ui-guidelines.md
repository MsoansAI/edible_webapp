# Edible Web App - UI Branding Guidelines

This document provides UI and branding guidelines for developers working on the Edible web application. Following these guidelines will ensure a consistent, professional, and on-brand user experience across the platform.

Our brand identity is **clean, modern, premium, and sharp**.

---

## 1. Color Palette

Colors are defined in `tailwind.config.js`. Always use these predefined theme colors instead of hardcoded hex values.

### Primary Color: Edible Red

Our primary color is a vibrant red. It should be used for key calls-to-action (like "Add to Cart" buttons), active states, and important highlights.

- **Main:** `primary-600` (`#dc2626`)
- **Lighter shades (`primary-50` to `primary-500`):** For hover states, backgrounds, or subtle highlights.
- **Darker shades (`primary-700` to `primary-950`):** For pressed states or dark-mode components.

### Neutral Colors

Neutrals provide the backbone of our UI. They are used for text, backgrounds, borders, and component containers.

- **Text:**
  - **Headings/Primary Text:** `neutral-900` (`#171717`)
  - **Body/Secondary Text:** `neutral-700` (`#404040`)
  - **Subtle Text/Placeholders:** `neutral-500` (`#737373`)
- **Backgrounds:**
  - **Main Page Background:** `white` or `neutral-50` (`#fafafa`)
  - **Component Backgrounds:** `neutral-100` (`#f5f5f5`)
- **Borders:** `neutral-200` (`#e5e5e5`) or `neutral-300` (`#d4d4d4`)

### System Colors

- **Success:** `success-500` (`#22c55e`) - For confirmations, success messages.
- **Warning:** `warning-500` (`#f59e0b`) - For alerts or items needing attention.
- **Error:** `primary-600` (`#dc2626`) - Our primary red also serves as the error color for consistency.

---

## 2. Typography

We use a single, clean, and modern font family for all text to maintain a consistent and readable interface.

- **Font Family:** `Inter` (`font-sans` or `font-display` in Tailwind).
- **Weights:** Use a range of font weights to create hierarchy.
  - `font-normal` (400) for body text.
  - `font-medium` (500) or `font-semibold` (600) for headings and important labels.
  - `font-bold` (700) for strong emphasis.

### Typographic Scale

Use the predefined font sizes from `tailwind.config.js`.

- `text-6xl`, `text-5xl`: Main page titles (H1).
- `text-4xl`, `text-3xl`: Section titles (H2).
- `text-2xl`, `text-xl`: Sub-section titles (H3).
- `text-lg`: Large body text or component titles.
- `text-base`: Default body text.
- `text-sm`, `text-xs`: Helper text, captions, and labels.

---

## 3. Layout & Styling

Our layout philosophy is structured, spacious, and sharp.

### The Golden Rule: No Rounded Corners

To enforce our sharp, premium aesthetic, **we do not use rounded corners on any element**. All containers, buttons, inputs, and images must have sharp, 90-degree angles. `tailwind.config.js` is configured to enforce this (`borderRadius` is set to `0`).

### Spacing

Use the default Tailwind spacing scale (`p-4`, `m-8`, etc.) to maintain rhythmic and consistent spacing. Avoid arbitrary values.

### Shadows

Use shadows subtly to create depth. Prefer the custom `shadow-clean` and `shadow-premium` variants for a refined look over default, heavy shadows.

---

## 4. Core Components

### Buttons

- **Primary Button:** Solid `primary-600` background, white text. Use for the most important action on the page.
- **Secondary Button:** White background, `primary-600` border and text. Use for secondary actions.
- **States:** All buttons must have clear `hover`, `focus`, and `disabled` states.

### Product Options

As seen on the product detail page, options should not be styled like "cards". They are simple, rectangular selectors.

- **Layout:** A horizontal `flex` container.
- **Contents:** A small, square product thumbnail on the left, and text labels on the right.
- **Selected State:** The selected option should have a distinct border, typically using `primary-600`.

### Forms & Inputs

- **Style:** Inputs should be simple, with a `neutral-300` border, no rounded corners, and a `neutral-100` background.
- **Labels:** Use clear, visible labels placed above the input field.

---

## 5. Image Handling

- **Product Images:** Should be high-quality and displayed in a square aspect ratio.
- **Stickiness:** On desktop product detail pages, the main image should remain "sticky" while the details scroll.
- **Interactivity:** The main product image must update to reflect the selected product option.

---

This guide is a living document. As our design system evolves, we will update these guidelines. 