## Design System: Rajamine FieldOps

### Pattern
- **Name:** Trust & Authority + Conversion
- **Conversion Focus:** Security badges. Case studies. Transparent pricing. Low-friction form. Provide pause/stop and stop the logo carousel on focus, hover, and reduced motion. Previous/next controls provide the keyboard equivalent; pause offscreen/hidden and render a static logo set under reduced motion.
- **CTA Placement:** Contact Sales / Get Quote (primary) + Nav
- **Color Strategy:** Navy/Grey corporate. Trust blue. Accent for CTA only.
- **Sections:** Hero (mission/credibility) > Proof (logos, certs, stats) > Solution overview > Clear CTA path

### Style
- **Name:** Accessible & Ethical
- **Mode Support:** Light supported | Dark supported
- **Keywords:** Accessible, inclusive interface, high contrast, large text (16px+), keyboard navigation, screen reader friendly, accessibility standards aware, focus state, semantic
- **Best For:** Government, healthcare, education, inclusive products, large audience, legal compliance, public
- **Performance:** cost:low|drivers:none | **Accessibility:** risk:low|requires:contrast-text-4.5,keyboard,visible-focus,reduced-motion

### Colors
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#0F172A` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#334155` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `--color-on-secondary` |
| Accent/CTA | `#0369A1` | `--color-accent` |
| On Accent/CTA | `#FFFFFF` | `--color-on-accent` |
| Background | `#F8FAFC` | `--color-background` |
| Foreground | `#020617` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#020617` | `--color-card-foreground` |
| Muted | `#E8ECF1` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#E2E8F0` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#0F172A` | `--color-ring` |

*Notes: Professional navy + blue CTA*

### Typography
- **Heading:** Plus Jakarta Sans
- **Body:** Plus Jakarta Sans
- **Mood:** enterprise, saas, b2b, professional, indigo, modern, approachable, legible, ios dynamic type, android scaling
- **Best For:** B2B SaaS apps, productivity tools, government and finance mobile apps, admin dashboards, enterprise onboarding
- **Google Fonts:** https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400
- **CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');
```

### Key Effects
Clear focus rings (3-4px), ARIA labels, skip links, responsive design, reduced motion, 44x44px touch targets

### Avoid (Anti-patterns)
- Playful design
- Hidden credentials
- AI purple/pink gradients

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

## UI Pro Max Search Results
**Domain:** chart | **Query:** dashboard data table charts
**Source:** charts.csv | **Found:** 3 results

### Result 1
- **Data Type:** Performance vs Target (Compact)
- **Keywords:** bullet, compact, kpi, dashboard, target, benchmark, range, accessible chart, keyboard accessible chart
- **Best Chart Type:** Bullet Chart
- **Secondary Options:** Gauge, Progress Bar
- **When to Use:** Dashboard with multiple KPIs side by side; space-constrained contexts where a gauge is too large
- **When NOT to Use:** Single KPI with emphasis (use gauge); data has no defined target range; fewer than 3 KPIs
- **Data Volume Threshold:** Ideal for 3–10 bullet charts in a grid; scales to any count efficiently
- **Color Guidance:** Qualitative ranges: #FFCDD2 / #FFF9C4 / #C8E6C9 (bad/ok/good). Performance bar: #1976D2. Target: black 3px marker
- **Accessibility Grade:** deprecated: use Accessibility Risk
- **Accessibility Risk:** risk:low
- **Accessibility Notes:** Label every qualitative range and target with text; color is supplementary.
- **A11y Fallback:** Visible KPI/target table plus status summary. Keyboard: focus reveals the same detail as hover.
- **Library Recommendation:** D3.js, Plotly, Custom SVG
- **Interactive Level:** Hover

### Result 2
- **Data Type:** Hierarchical / Nested Data
- **Keywords:** hierarchy, nested, treemap, parent, children, breakdown, drill, accessible chart, keyboard accessible chart
- **Best Chart Type:** Treemap
- **Secondary Options:** Sunburst, Nested Donut, Icicle
- **When to Use:** Showing size relationships within a hierarchy; overview of proportional structure (e.g., budget breakdown)
- **When NOT to Use:** Hierarchy depth > 3 levels (too complex to read); user needs to compare sibling values precisely
- **Data Volume Threshold:** <200 nodes: SVG; 200–1000: Canvas; >1000: paginate or pre-filter before rendering
- **Color Guidance:** Parent nodes: distinct hues. Children: lighter shades of same hue. White separator borders: 2–3px
- **Accessibility Grade:** deprecated: use Accessibility Risk
- **Accessibility Risk:** risk:high
- **Accessibility Notes:** Label hierarchy nodes and use borders/patterns as well as hue; make the tree table the primary accessible view. Do not rely on color alone.
- **A11y Fallback:** Collapsible tree table plus hierarchy summary; treemap remains supplementary. Keyboard: focus reveals hover values; Enter/Space drills or expands; Back collapses/returns.
- **Library Recommendation:** D3.js, Recharts, ApexCharts
- **Interactive Level:** Hover + Drilldown

### Result 3
- **Data Type:** Compare Categories
- **Keywords:** compare, categories, bar, comparison, ranking, accessible chart, keyboard accessible chart
- **Best Chart Type:** Bar Chart (Horizontal or Vertical)
- **Secondary Options:** Column Chart, Grouped Bar
- **When to Use:** Comparing discrete categories by magnitude; ranking or ordering is the core insight; categories ≤ 15
- **When NOT to Use:** Categories > 15 (use table or search); data has time dimension (use line); showing proportions (use waffle/stacked)
- **Data Volume Threshold:** <20 categories: vertical bar; 20–50: horizontal bar; >50: paginated table
- **Color Guidance:** Each bar: distinct color. Grouped: same hue family. Always sort descending by value
- **Accessibility Grade:** deprecated: use Accessibility Risk
- **Accessibility Risk:** risk:low
- **Accessibility Notes:** Use direct category/value labels and group outlines or patterns; never encode category solely by bar color. Do not rely on color alone.
- **A11y Fallback:** Visible sortable data table plus concise comparison summary. Keyboard: focus reveals hover values; focusable headers with Enter/Space sort and aria-sort reports direction.
- **Library Recommendation:** Chart.js, Recharts, D3.js
- **Interactive Level:** Hover + Sort

