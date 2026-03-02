# Long Line Diary V2 — Theme Spec (Phase A)

## Identity
Name: Steel + Construction Green
Goal: premium enterprise construction SaaS; clean hierarchy; strong readability; token-driven only.

## Token Model (semantic)
We will implement tokens in src/index.css for both light and dark:

Base:
--bg, --fg
--muted, --muted-foreground
--card, --card-foreground
--popover, --popover-foreground
--border, --input, --ring

Surfaces / elevation:
--surface-0 (app bg)
--surface-1 (page panels)
--surface-2 (cards)
--surface-3 (raised cards/modals)
--surface-hover
--shadow-1, --shadow-2, --shadow-3

Brand:
--brand
--brand-foreground
--brand-soft
--brand-ring

Status:
--status-success
--status-warning
--status-danger
--status-info
--status-neutral

## Implementation rules (locked)
- No hardcoded hex in components.
- Components use semantic tokens only.
- Apply changes incrementally: build → commit → deploy.

## Target palette guidance (HSL — tune during implementation)
Light mode (cool steel):
- bg:            210 30% 98%
- fg:            222 30% 12%
- surface-1:     210 25% 96%
- surface-2:     210 22% 94%
- surface-3:     210 20% 92%
- border/input:  214 16% 86%

Brand (construction green):
- brand:         92 45% 52%
- brand-soft:    92 45% 92%
- brand-ring:    92 45% 52%

Status (premium, not neon):
- success:       142 45% 40%
- warning:       38  85% 50%
- danger:        0   70% 52%
- info:          210 70% 50%
- neutral:       215 18% 55%

Dark mode (charcoal steel):
- bg:            222 28% 10%
- fg:            210 20% 96%
- surface-1:     222 26% 13%
- surface-2:     222 24% 16%
- surface-3:     222 22% 19%
- border/input:  220 14% 24%

Brand (same hue, tuned for dark):
- brand:         92 45% 55%
- brand-soft:    92 25% 18%
- brand-ring:    92 45% 55%

Status (dark-tuned):
- success:       142 45% 55%
- warning:       38  90% 60%
- danger:        0   75% 60%
- info:          210 80% 60%
- neutral:       215 18% 65%

## Phase A application order
1) Add tokens to src/index.css (light+dark)
2) Bind surfaces to layouts/cards
3) Bind brand to primary actions + sidebar active
4) Bind status to Action Items + Calendar + Dashboard
5) Final polish (shadows, hover, separators)
