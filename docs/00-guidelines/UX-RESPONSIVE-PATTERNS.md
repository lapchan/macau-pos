# UX Responsive Patterns — RetailOS Design Guidelines

> **Status:** Active · **Created:** 2026-03-24 · **Owner:** Product Design
>
> These patterns are **mandatory** for all UI components across admin and cashier apps.
> Follow these rules every time you build interactive elements.

---

## 1. Progressive Disclosure — Icon → Icon + Text

**Rule:** Interactive elements (buttons, status indicators, labels) should adapt to screen width:

| Breakpoint | Display | Interaction |
|---|---|---|
| **< lg (< 1024px)** | Icon only | Tooltip on hover |
| **≥ lg (1024px+)** | Icon + text label | No tooltip needed |

**Implementation pattern:**
```tsx
<div className="relative group/[name]">
  <button className="h-7 w-7 lg:w-auto lg:px-2.5 flex items-center justify-center lg:justify-start gap-1">
    <Icon className="h-3 w-3 shrink-0" />
    <span className="hidden lg:inline">{label}</span>
  </button>
  {/* Tooltip — only when text is hidden */}
  <div className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[11px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 pointer-events-none group-hover/[name]:opacity-100 transition-opacity shadow-lg">
    {label}
    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-text-primary" />
  </div>
</div>
```

**Applies to:**
- Action buttons (Edit, Delete, Duplicate, etc.)
- Status indicators (Active dot + label, Warning dot + label)
- Navigation items in toolbars
- Filter chips with icons
- Any icon + text combination in tables/lists

---

## 2. Status Indicators — Dot + Text

**Rule:** Status should always show a colored dot. Text label appears at `lg` breakpoint.

| Status | Dot Color | CSS Class |
|---|---|---|
| Active / 啟用 | 🟢 Green | `bg-success` |
| Draft / 草稿 | 🟡 Orange | `bg-warning` |
| Inactive / 停用 | ⚪ Gray | `bg-text-tertiary` |
| Sold Out / 售罄 | 🔴 Red | `bg-danger` |
| Online / 在線 | 🟢 Green | `bg-success` |
| Offline / 離線 | ⚪ Gray | `bg-text-tertiary` |
| Warning / 警告 | 🟡 Orange | `bg-warning` |

**Pattern:**
```tsx
<div className="relative group/status flex items-center gap-1.5">
  <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />
  <span className="hidden lg:inline text-[12px] text-text-secondary whitespace-nowrap">{label}</span>
  {/* Tooltip when text hidden */}
  <div className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 ...tooltip styles...">
    {label}
  </div>
</div>
```

---

## 3. Tooltip Standard

**Rule:** All icon-only elements MUST have a tooltip. No exceptions.

**Tooltip specs:**
- Position: Above element (`bottom-full`)
- Background: `bg-text-primary` (near-black)
- Text: `text-[11px] font-medium text-white`
- Padding: `px-2 py-1`
- Border radius: `rounded-[var(--radius-sm)]`
- Arrow: 4px CSS triangle pointing down
- Animation: `opacity-0 → opacity-100` on `group-hover`
- Shadow: `shadow-lg`
- No delay (instant show on hover)
- `pointer-events-none` on the tooltip itself
- `whitespace-nowrap` to prevent wrapping

**When to show tooltip:**
- Always on icon-only buttons
- On small screens when text label is hidden
- On truncated text (`text-overflow: ellipsis`)
- On collapsed sidebar items

**When NOT to show tooltip:**
- When the full text label is visible
- On large touch-only devices (consider `@media (hover: hover)` if needed)

---

## 4. Table Column Responsive Rules

**Rule:** Tables should adapt columns based on screen width:

| Breakpoint | Visible Columns | Hidden |
|---|---|---|
| **< md (< 768px)** | Item, Price, Status dot, Edit icon | Category, Stock |
| **md – lg (768–1023px)** | Item, Price, Stock, Status dot, Edit icon | Category |
| **≥ lg (1024px+)** | All columns + text labels | None |

**Implementation:** Use `hidden md:table-cell` and `hidden lg:table-cell` on `<td>` and `<th>`.

---

## 5. Dropdown / Popover Positioning

**Rule:** Dropdown menus in tables MUST use `fixed` positioning to avoid clipping.

**Why:** Tables use `overflow-hidden` which clips `absolute` positioned dropdowns.

**Pattern:**
```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-40" onClick={close} />
{/* Menu */}
<div className="fixed z-50 w-36 bg-surface border border-border rounded-[var(--radius-md)] shadow-xl py-1"
     style={{ top: 'auto', right: 16 }}>
  ...
</div>
```

---

## 6. Touch Target Minimums

**Rule:** All interactive elements must meet minimum touch targets:

| Context | Minimum Size | Recommended |
|---|---|---|
| Primary action buttons | 44 × 44px | 48px height |
| Table row action buttons | 28 × 28px | 28px (compact OK in tables) |
| Icon-only buttons | 28 × 28px | 32px |
| Checkbox / toggle | 20 × 20px | With 8px padding area |
| Navigation items | 44px height | Full-width tap area |

---

## 7. Sidebar Collapse Behavior

**Rule:** The admin sidebar follows the same icon → icon+text pattern:

| State | Display | Trigger |
|---|---|---|
| Collapsed | Icon only + tooltip | Default on tablet |
| Expanded | Icon + text label | Click logo / hamburger |

The logo area doubles as the expand/collapse toggle with a hover animation.

---

## Summary Checklist

Before shipping any UI component, verify:

- [ ] Icon-only elements have tooltips
- [ ] Text labels hide at < lg, show at ≥ lg
- [ ] Status uses dot + conditional text (not just text badge)
- [ ] Dropdowns use `fixed` positioning in tables
- [ ] Touch targets meet minimums
- [ ] All text uses i18n keys (no hardcoded strings)
- [ ] Responsive: test at 768px, 1024px, and 1440px widths
