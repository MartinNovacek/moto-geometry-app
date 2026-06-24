# Handoff: MotoTrack PWA

## Overview

MotoTrack is a Progressive Web App for sport motorcycle riders — focused on **service & maintenance tracking**. Users log service records, monitor component health, and get alerted when maintenance is overdue. Target audience: trackday enthusiasts and racing riders who own high-performance motorcycles (Ducati, Kawasaki, Yamaha, etc.).

---

## About the Design Files

The files in this bundle (`MotoTrack PWA.dc.html`, `ios-frame.jsx`) are **HTML design prototypes** — high-fidelity mockups showing the intended look, layout, and behavior. They are NOT production code to copy directly.

Your task: **recreate these designs as a real PWA** using a framework of your choice. Recommended stack:

- **React + Vite** with `vite-plugin-pwa` (simplest path to PWA)
- **OR Next.js** with `next-pwa` if you need SSR/routing
- **Styling:** Tailwind CSS or CSS Modules — the design uses very consistent tokens (see Design Tokens section)
- **Storage:** IndexedDB via `idb` or `Dexie.js` for offline-capable data persistence

---

## Fidelity

**High-fidelity.** These are pixel-accurate mocks with final colors, typography, spacing, and micro-interactions. Recreate them faithfully. Every hex value, font weight, and spacing unit below is intentional.

---

## Design Tokens

### Colors
```
--color-bg:          #07090e        /* App background */
--color-surface:     rgba(255,255,255,0.04)   /* Card backgrounds */
--color-border:      rgba(255,255,255,0.08)   /* Card borders */
--color-border-dim:  rgba(255,255,255,0.07)   /* Dividers */
--color-accent:      #00d4f5        /* Primary cyan — buttons, active states, glow */
--color-accent-dim:  rgba(0,212,245,0.07)     /* Tinted accent surface */
--color-accent-border: rgba(0,212,245,0.14)   /* Accent card border */
--color-critical:    #ff3535        /* Overdue / critical alerts */
--color-warning:     #ffb300        /* Approaching due date */
--color-text-1:      #ffffff        /* Primary text */
--color-text-2:      rgba(255,255,255,0.65)   /* Secondary text */
--color-text-3:      rgba(255,255,255,0.30)   /* Labels, captions */
--color-text-4:      rgba(255,255,255,0.18)   /* Dim/disabled text */
--color-mono-label:  rgba(255,255,255,0.25)   /* Monospace data labels */
```

### Typography
Load from Google Fonts:
```
https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap
```

| Role | Family | Weight | Size | Notes |
|---|---|---|---|---|
| App name / hero title | Barlow Condensed | 900 | 24–56px | letter-spacing: 0.01em |
| Section labels | Barlow Condensed | 700 | 9–10px | uppercase, letter-spacing: 0.22em |
| Card titles | Barlow Condensed | 700 | 13–15px | letter-spacing: 0.02em |
| Stat numbers | Barlow Condensed | 900 | 22–56px | letter-spacing: -0.02 to -0.03em |
| Badge text | Barlow Condensed | 900 | 9px | uppercase, letter-spacing: 0.12em |
| Body / subtitles | Barlow | 400–600 | 11–14px | |
| Data / odometer | JetBrains Mono | 400–600 | 9–16px | |

### Spacing
```
--padding-screen:  14–18px   /* Horizontal screen padding */
--padding-card:    11–13px   /* Card inner padding */
--gap-grid:        7px       /* Gap between grid cards */
--gap-section:     8–16px    /* Vertical gap between sections */
```

### Border Radius
```
--radius-card:    9–10px
--radius-button:  9px
--radius-input:   8px
--radius-badge:   5px
--radius-icon-btn: 8–10px
```

### Shadows & Glow
```
--shadow-btn:      0 6px 26px rgba(0,212,245,0.35)    /* Cyan button */
--glow-accent:     drop-shadow(0 0 9px rgba(0,212,245,0.8))  /* SVG filter */
--glow-critical:   0 0 9px rgba(255,53,53,0.85)       /* box-shadow on dot */
--glow-warning:    0 0 7px rgba(255,179,0,0.65)
--glow-ok:         0 0 7px rgba(0,212,245,0.65)
```

### Background Texture
All screens use a subtle scanline overlay. Apply as a CSS background-image on the root screen container:
```css
background-image: repeating-linear-gradient(
  0deg,
  rgba(255,255,255,0) 0px,
  rgba(255,255,255,0) 23px,
  rgba(255,255,255,0.013) 23px,
  rgba(255,255,255,0.013) 24px
);
```

---

## Screens / Views

### Screen 1 — Onboarding (`/onboarding`)

**Purpose:** First-run setup. User picks their motorcycle brand, enters model name and starting odometer reading, then proceeds to the main app.

#### Layout
Full-screen dark column, vertically flex, center-aligned, `padding: 30px 22px`. Ambient radial glow at the top: `radial-gradient(circle, rgba(0,212,245,0.12) 0%, transparent 65%)`, positioned absolute at top center, 260×260px, -110px above the top edge.

#### Elements (top → bottom)

**Logotype row** — centered, `margin-top: 10px`
- SVG speedometer icon: 22×22px. Draw a circle (r=10) with a partial arc (270° stroke, `stroke-dasharray: 47 16`, rotated 135°, #00d4f5 with drop-shadow glow) and a needle line from center to top-right, capped with a 1.8px dot.
- Wordmark: `MOTOTRACK` — Barlow Condensed 900, 26px, #fff, letter-spacing 0.1em
- Tagline below: `Precision maintenance` — Barlow 400, 10px, rgba(255,255,255,0.28), uppercase, letter-spacing 0.14em, margin-top 5px

**Divider** — centered, 28×1px, `background: #00d4f5`, opacity 0.4, `margin: 20px auto`

**Section label** — `VYBERTE ZNAČKU` — Barlow Condensed 700, 9px, rgba(255,255,255,0.3), uppercase, letter-spacing 0.22em, width 100%, margin-bottom 9px

**Brand grid** — CSS grid, 3 columns, gap 6px, width 100%
- Each cell: `border-radius: 8px`, padding `13px 6px`, text-align center
- Default state: `border: 1px solid rgba(255,255,255,0.08)`, `background: rgba(255,255,255,0.03)`, text Barlow Condensed 700 12px, rgba(255,255,255,0.38)
- **Selected state:** `border: 1px solid #00d4f5`, `background: rgba(0,212,245,0.07)`, `box-shadow: 0 0 16px rgba(0,212,245,0.1)`, text #00d4f5, font-weight 900
- Brands (in order): DUCATI *(selected by default)*, KAWASAKI, YAMAHA, HONDA, APRILIA, BMW M

**Model field** — margin-top 16px
- Label: Barlow Condensed 700, 9px, rgba(255,255,255,0.3), uppercase, letter-spacing 0.22em
- Input (styled div or real `<input>`): `background: rgba(255,255,255,0.05)`, `border: 1px solid rgba(255,255,255,0.11)`, `border-radius: 8px`, padding `12px 14px`
- Left: model name text — Barlow Condensed 700, 16px, #fff
- Right: year — JetBrains Mono 400, 10px, rgba(255,255,255,0.28)

**Starting odometer field** — margin-top 10px, same structure as model field
- Label: `POČÁTEČNÍ NÁJEZD`
- Left: km number — JetBrains Mono 600, 16px, #fff (e.g. "12 453" with thin space separator)
- Right: `km` — Barlow Condensed, 10px, rgba(255,255,255,0.28), uppercase

**CTA button** — margin-top 22px, full width
- `background: #00d4f5`, `border-radius: 9px`, `padding: 16px`, `box-shadow: 0 6px 28px rgba(0,212,245,0.35)`
- Text: `INICIALIZOVAT GARÁŽ` — Barlow Condensed 900, 13px, #07090e, uppercase, letter-spacing 0.16em

**Sign-in link** — centered below button, margin-top 12px
- `Máte garáž? ` — Barlow 400, 11px, rgba(255,255,255,0.2)
- `Přihlásit se` — Barlow 400, 11px, rgba(0,212,245,0.55), cursor pointer

---

### Screen 2 — Dashboard (`/`)

**Purpose:** Main hub. Shows the active motorcycle's overall health score, key stats, and maintenance alerts.

#### Layout
Full-screen dark column with scanline texture, `display: flex; flex-direction: column; height: 100vh`.

#### Elements (top → bottom)

**Header** — `padding: 16px 18px 4px`, flex row, space-between
- Left:
  - Label: `Garáž` — Barlow Condensed 700, 9px, rgba(255,255,255,0.3), uppercase, letter-spacing 0.22em
  - Bike name: `PANIGALE V4 R` — Barlow Condensed 900, 24px, #fff, letter-spacing 0.01em, line-height 1.05
- Right: notification bell button
  - Container: 38×38px, `border: 1px solid rgba(255,255,255,0.1)`, `border-radius: 10px`, `background: rgba(255,255,255,0.04)`
  - SVG bell icon, 17×17px, stroke rgba(255,255,255,0.65), sw 1.5
  - Alert dot: 7×7px absolute at top-right (8px from each edge), `background: #ff3535`, `border: 1.5px solid #07090e`, border-radius 50%, **blinking animation** (see Animations)

**Sub-info** — `padding: 0 18px 10px`
- `2023 · Ducati · 12 453 km` — JetBrains Mono 400, 10px, rgba(255,255,255,0.27)

**Health Gauge** — centered, `padding: 4px 0 2px`
- SVG, 190×190px viewBox `0 0 190 190`
- Outer decoration: `<circle cx=95 cy=95 r=89>` stroke rgba(255,255,255,0.035) sw=1
- Track arc (270°, `r=76`): `stroke-dasharray: 358 119`, rotated `rotate(135, 95, 95)`, stroke rgba(255,255,255,0.08) sw=11 round linecap
- Fill arc (87% health): same circle, `stroke-dasharray: 477 477`, `stroke-dashoffset: 477` → animated to `165`, stroke #00d4f5 sw=11, `filter: drop-shadow(0 0 9px rgba(0,212,245,0.8))`, **draw animation** (see Animations)
- Inner ring: `<circle r=62>` stroke rgba(0,212,245,0.06) sw=1
- Center text (absolutely positioned, translate -50% -53%):
  - Score: `87` — Barlow Condensed 900, 50px, #fff, line-height 1, letter-spacing -0.03em
  - Label: `HEALTH` — Barlow Condensed 700, 10px, #00d4f5, uppercase, letter-spacing 0.22em
- Scale labels: `0` (bottom-left) and `100` (bottom-right) — JetBrains Mono 9px, rgba(255,255,255,0.18)

**Quick Stats row** — 3-column grid, gap 7px, `padding: 10px 14px`

Each stat card: `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 10px`, `padding: 11px 8px`, text-align center

| Card | Number | Number style | Label |
|---|---|---|---|
| km do servisu | `847` | Barlow Condensed 900 22px #fff | `km do servisu` |
| dní od oleje | `32` | Barlow Condensed 900 22px #fff | `dní od oleje` |
| hladina oleje | `94%` | Barlow Condensed 900 22px **#00d4f5** | `hladina oleje` |

Third card uses accent coloring: `background: rgba(0,212,245,0.05)`, `border-color: rgba(0,212,245,0.14)`, label color rgba(0,212,245,0.45).

Label style: Barlow Condensed 700, 8px, letter-spacing 0.1em, uppercase, line-height 1.45, color rgba(255,255,255,0.3).

**Alerts section** — `padding: 2px 14px`, `flex: 1`
- Section label: `UPOZORNĚNÍ` — Barlow Condensed 700, 9px, rgba(255,255,255,0.3), uppercase, letter-spacing 0.22em, margin-bottom 8px

**Critical alert card** — `background: rgba(255,53,53,0.08)`, `border: 1px solid rgba(255,53,53,0.26)`, `border-radius: 10px`, `padding: 12px 13px`, flex row, gap 11px
- Status dot: 7×7px `background: #ff3535`, `box-shadow: 0 0 10px rgba(255,53,53,0.85)`, **blinking animation**
- Text column:
  - Title: `Napnutí řetězu` — Barlow Condensed 700, 14px, #fff
  - Subtitle: `3 dny po splatnosti` — Barlow 400, 11px, rgba(255,110,110,0.85)
- Badge: `background: rgba(255,53,53,0.14)`, `border: 1px solid rgba(255,53,53,0.35)`, `border-radius: 5px`, `padding: 4px 7px`
  - Text: `IHNED` — Barlow Condensed 900, 9px, #ff3535, uppercase, letter-spacing 0.12em

**Warning alert card** — same structure with yellow theme
- Colors: rgba(255,179,0,…) for background/border/dot/text
- Dot: no blink animation (not overdue yet)
- Title: `Brzdová kapalina`, subtitle: `Splatnost za 12 dní`
- Badge text: `12 DNÍ`, color #ffb300

**Bottom Nav** — `border-top: 1px solid rgba(255,255,255,0.07)`, 4-column grid, `padding: 10px 0 20px`

Each item: flex column, center, gap 4px. Icon (SVG, 20×20px) + label (Barlow Condensed 700, 9px, uppercase, letter-spacing 0.1em).

| Tab | Icon | Active color | Inactive color |
|---|---|---|---|
| Garáž | home/house fill | #00d4f5 | rgba(255,255,255,0.3) |
| Servis | wrench | — | rgba(255,255,255,0.3) |
| Historie | clock | — | rgba(255,255,255,0.3) |
| Nastav. | gear/settings | — | rgba(255,255,255,0.3) |

Active tab (Garáž): icon filled with #00d4f5, label color #00d4f5.

---

### Screen 3 — Motorcycle Detail (`/bike/:id`)

**Purpose:** Deep-dive on one motorcycle. Shows odometer, component health grid, service history with progress indicator, and a FAB to log a new service entry.

#### Layout
Full-screen dark column, `display: flex; flex-direction: column; height: 100vh`.

#### Elements (top → bottom)

**Header** — `padding: 14px 18px 0`, flex row, gap 11px, align-items center
- Back button: 32×32px, `border: 1px solid rgba(255,255,255,0.12)`, `border-radius: 8px`, SVG chevron-left (14×14, stroke #fff sw 2.2)
- Text column:
  - Label: `Detail` — Barlow Condensed 700, 9px, rgba(255,255,255,0.3), uppercase, letter-spacing 0.22em
  - Bike name: `PANIGALE V4 R` — Barlow Condensed 900, 20px, #fff

**Odometer hero** — `padding: 16px 18px 14px`, `border-bottom: 1px solid rgba(255,255,255,0.07)`, margin-top 4px
- Number + unit: flex row, align baseline, gap 7px
  - `12 453` — Barlow Condensed 900, 56px, #fff, letter-spacing -0.03em, line-height 1
  - `km` — Barlow Condensed 600, 18px, rgba(255,255,255,0.30), letter-spacing 0.04em
- Sub-row: flex row, gap 14px, margin-top 5px
  - `Celkový nájezd` — JetBrains Mono 400, 10px, rgba(255,255,255,0.25)
  - `+342 km / měsíc` — JetBrains Mono 400, 10px, **#00d4f5**

**Tab bar** — `padding: 0 14px`, `border-bottom: 1px solid rgba(255,255,255,0.07)`
- Each tab: `padding: 10px 12px`
- Active tab (`Komponenty`): `border-bottom: 2px solid #00d4f5`, margin-bottom -1px (overlap border), text Barlow Condensed 700, 11px, #00d4f5, uppercase, letter-spacing 0.14em
- Inactive tabs (`Servis`, `Historie`): same text style but color rgba(255,255,255,0.28)

**Component grid** — `padding: 12px 14px 8px`, `flex: 1`, 2-column grid, gap 7px

Each component card: flex row, align-items center, gap 9px, `padding: 11px 13px`, `border-radius: 9px`

Status dot: 7×7px, border-radius 50%

| Component | Status | Dot color | Dot shadow | Card bg | Card border | Subtitle |
|---|---|---|---|---|---|---|
| Motor | V pořádku | #00d4f5 | glow-ok | surface | border | rgba(0,212,245,0.6) |
| Brzdy | V pořádku | #00d4f5 | glow-ok | surface | border | rgba(0,212,245,0.6) |
| Pneumatiky | Zkontrolovat | #ffb300 | glow-warning | rgba(255,179,0,0.05) | rgba(255,179,0,0.2) | rgba(255,179,0,0.8) |
| Řetěz | Ihned! | #ff3535 | glow-critical | rgba(255,53,53,0.07) | rgba(255,53,53,0.28) | rgba(255,53,53,0.9) |
| Olej | Čerstvý (32d) | #00d4f5 | glow-ok | surface | border | rgba(0,212,245,0.6) |
| Vzduch. filtr | V pořádku | #00d4f5 | glow-ok | surface | border | rgba(0,212,245,0.6) |

"Řetěz" dot uses the **blinking animation**. Card text: title Barlow Condensed 700, 13px, #fff + subtitle Barlow 400, 10px.

**Last Service record** — `padding: 0 14px 10px`
- Section label: `POSLEDNÍ ZÁZNAM` — same label style
- Card: `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 10px`, `padding: 13px`
  - Header row: flex space-between
    - Title: `Výměna oleje + filtr` — Barlow Condensed 700, 15px, #fff
    - Subtitle: `Moto Servis Praha · 11 621 km` — Barlow 400, 11px, rgba(255,255,255,0.3)
    - Date badge: `32d` — JetBrains Mono 10px, rgba(255,255,255,0.22), right-aligned
  - Progress bar: `margin-top: 10px`, 3px height, `background: rgba(255,255,255,0.07)`, `border-radius: 2px`
    - Fill div: width 37%, `background: linear-gradient(90deg, #00d4f5, rgba(0,212,245,0.3))`, `border-radius: 2px`
  - Km range: flex space-between, `margin-top: 5px`
    - Left: `11 621 km`, Right: `13 300 km` — JetBrains Mono 9px, rgba(255,255,255,0.18)

**FAB** — `padding: 0 14px 22px`
- Same style as onboarding CTA button
- Text: `PŘIDAT ZÁZNAM`, `background: #00d4f5`, `box-shadow: 0 6px 26px rgba(0,212,245,0.35)`
- Left: `+` SVG icon (15×15, stroke #07090e, sw 2.8), gap 8px

---

## Interactions & Behavior

### Navigation
- Onboarding → Dashboard: after tapping "INICIALIZOVAT GARÁŽ" and data is saved
- Dashboard → Motorcycle Detail: tap the bike name header or a dedicated bike card
- Detail → Dashboard: tap back button (chevron-left)
- On first launch: always show Onboarding. On subsequent launches: go straight to Dashboard.

### Animations

**Gauge draw-in (Dashboard load):**
```css
@keyframes gaugeIn {
  from { stroke-dashoffset: 477; }
  to   { stroke-dashoffset: 165; }
}
/* Apply to fill circle: */
animation: gaugeIn 1.9s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both;
```

**Status dot blink (critical alerts, overdue components):**
```css
@keyframes blinkDot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.18; }
}
/* Critical dot: */ animation: blinkDot 1.5s ease-in-out infinite;
/* Alert badge dot: */ animation: blinkDot 2s ease-in-out infinite;
```

**Screen transitions:** 300ms slide-left (push) / slide-right (pop), CSS transform translateX.

**Brand selection:** tap a brand card → it instantly gains the selected style, others deselect. No transition needed.

### States

- **Component status:** dynamically computed from service records. If a record is overdue, show red + blink. If due within 14 days / 200km, show yellow. Otherwise cyan/green.
- **Health score (87):** computed as weighted average of all component statuses (0–100). Update on every service record change.
- **Alerts:** only show components that are yellow or red. If none, hide the alerts section entirely.

---

## Data Model

Use IndexedDB (via `Dexie.js`) for offline-capable storage.

```typescript
// Motorcycle
interface Motorcycle {
  id: string;           // uuid
  brand: string;        // e.g. "DUCATI"
  model: string;        // e.g. "Panigale V4 R"
  year: number;         // e.g. 2023
  startingKm: number;   // odometer at registration
  currentKm: number;    // updated on each service log
}

// Service Record
interface ServiceRecord {
  id: string;
  motorcycleId: string;
  type: ComponentType;  // see below
  date: string;         // ISO date
  kmAtService: number;
  notes?: string;
  shop?: string;        // e.g. "Moto Servis Praha"
  nextServiceKm?: number;
  nextServiceDate?: string;
}

type ComponentType =
  | 'oil'           // Olej
  | 'oil_filter'    // Olejový filtr
  | 'chain'         // Řetěz
  | 'brakes'        // Brzdy
  | 'tires'         // Pneumatiky
  | 'air_filter'    // Vzduchový filtr
  | 'coolant'       // Chladivo
  | 'brake_fluid'   // Brzdová kapalina
  | 'spark_plugs';  // Zapalovací svíčky
```

### Service Intervals (defaults, user-overridable)
| Component | km interval | day interval |
|---|---|---|
| oil + filter | 7 000 km | 365 days |
| chain | 500 km | — |
| tires | 8 000 km | — |
| air_filter | 15 000 km | — |
| brakes | 20 000 km | 730 days |
| brake_fluid | — | 730 days |
| coolant | 20 000 km | 730 days |
| spark_plugs | 24 000 km | — |

---

## PWA Requirements

### manifest.json
```json
{
  "name": "MotoTrack",
  "short_name": "MotoTrack",
  "description": "Precision maintenance for sport motorcycles",
  "theme_color": "#07090e",
  "background_color": "#07090e",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### App Icon
Use the speedometer motif from the design: dark background (#07090e), partial arc in #00d4f5 with glow, needle, center dot. Render as SVG then export to 192 and 512px PNG.

### Service Worker
- Cache-first strategy for all static assets (JS, CSS, fonts, icons)
- Network-first (with cache fallback) for any API calls
- Offline fallback page showing the last cached dashboard data

### Install prompt
Show an "Add to Home Screen" prompt after the user has logged their first service record.

---

## Assets

- **Fonts:** loaded from Google Fonts CDN (Barlow Condensed, Barlow, JetBrains Mono)
- **Icons:** use Lucide React or Heroicons — the design uses standard icons:
  - Bell (notification)
  - Home (fill, for active nav)
  - Wrench (services nav)
  - Clock (history nav)
  - Settings/gear (settings nav)
  - ChevronLeft (back button)
  - Plus (FAB)
- **No photography or illustration** — the design is purely typographic + data-driven

---

## Files in This Package

| File | Description |
|---|---|
| `README.md` | This document — the full implementation spec |
| `MotoTrack PWA.dc.html` | High-fidelity HTML prototype (open in browser to see all 3 screens) |
| `ios-frame.jsx` | iPhone device bezel component used in the prototype (ignore for implementation) |

---

## Additional Screens to Design/Implement

The three screens above are the MVP. After implementation, these should follow:

1. **Add Service Record** — form screen with component picker, km input, date, notes, shop name
2. **Service Schedule** — timeline view of upcoming maintenance sorted by urgency
3. **History** — chronological log of all past service records, filterable by component type
4. **Settings** — edit motorcycle details, customise service intervals, manage multiple bikes

---

*Design by MotoTrack PWA design system · June 2026*
