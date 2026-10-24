# Mission Control — Canonical Visual Contract

**Authority:** The owner-supplied iPhone Mission Control screenshot in the project conversation is the canonical visual reference. If prose and screenshot conflict on appearance, follow the screenshot; architecture and data rules remain governed by `LIFEOS_V1_MVP_SPEC.md`.

## Composition (top to bottom)

1. **Device-safe shell:** near-black outer background; narrow centered phone content; compact status/header area; no desktop-style sidebar. Keep bottom navigation fixed and account for iOS safe areas.
2. **Header:** LifeOS wordmark with blue “OS”, “Mission Control” subtitle, search control, profile affordance, calm one-line mission statement, current date, and small green status.
3. **Next Best Action hero:** full-width, blue gradient, thin vivid blue border, 28px rounded corners, soft blue glow. Show eyebrow and impact badge; icon tile; title and short action context; impact/confidence rings; expected outcome; why it matters; three actions (primary, secondary, overflow). The hero is the dominant card.
4. **Two-column action row:** Execute Now on left and Decisions Required on right. Compact icon tile, title, deadline/context, impact/confidence, and one full-width action each.
5. **At Risk:** full-width amber/brown-tinted panel with amber left rail, warning icon, severity badge, source/title, concise financial/risk context, impact/confidence, and paired actions. Critical state can use red for the severity pill.
6. **Two-column follow-up row:** Waiting on left, Opportunities on right. Waiting uses muted slate/blue; opportunity uses restrained green. Each has icon, title, short context, impact/confidence where available, and a bottom action.
7. **Relationship Repairs:** full-width rose/red-accented panel with heart marker, person avatar, relationship context, last-contact interval, concise recommendation, impact/confidence, and scheduling action.
8. **Review Queue:** full-width dark panel, count pill, dense compact rows with small document icons, short title, due/review context, and trailing chevron.
9. **Bottom navigation:** five equal destinations—Mission, Inbox, Entities, Search, More—with line icons, compact labels, active blue state, and notification dot when relevant. Dark translucent surface, top border, bottom safe-area padding.

## Token contract

- Canvas: `#0A0B0D`; surfaces: `#111318`, `#151820`, `#1A1F29`.
- Primary blue: `#3B82F6`; success: `#22C55E`; warning: `#F59E0B`; danger: `#EF4444`; text: `#F8FAFC`; muted: `#A1AAB8`.
- Hero: `#123569` → `#0E2346` → `#08111D`, border blue at roughly 60% opacity, `0 0 60px rgba(59,130,246,0.35)`, radius 28px.
- Cards: 22–28px corner radius, thin low-contrast borders, restrained internal highlights, no white page background.
- Scores: circular ring indicators with a numeric value; never color-only—always show label and number.
- Text density: short, scannable lines; title and context first; scores and actions aligned consistently.

## Responsive and interaction requirements

- Treat the screenshot as a 1x mobile reference; use a 320px minimum viewport. Two-column cards may stack only when needed to avoid cramped or overflowing content.
- Bottom navigation remains reachable and must not obscure the Review Queue; apply `env(safe-area-inset-bottom)`.
- Interactive cards/actions must have clear labels, visible focus, sufficient hit targets, and pressed/disabled states. Icon-only controls require accessible names.
- Avoid invented profile identities or fake live status in production data. Demo content must be labeled internally as seed content; the screenshot's content is a fixture, not evidence about the user's actual utilities, mortgage, insurance, vehicle, or relationships.
- The UI receives typed feed data; components do not compute priority, fabricate deadlines, or independently derive recommendation categories.
- Keep animation restrained and respect `prefers-reduced-motion`.

## Visual review checklist

- [ ] Header and hero occupy the same hierarchy as the reference.
- [ ] Hero has the blue gradient/glow, two score rings, two rationale blocks, and three action controls.
- [ ] Card order and two-column groupings match the reference.
- [ ] At Risk has a visible amber rail and clear severity.
- [ ] Relationship card visibly prioritizes the person and contact gap.
- [ ] Review Queue is compact but readable above the navigation.
- [ ] Active navigation is blue; inactive destinations are muted slate.
- [ ] No horizontal scrolling at 320px or 390px.
- [ ] Bottom navigation respects iOS safe areas.
- [ ] Screenshot comparison is captured at a fixed viewport after the UI milestone; no claim of pixel-match without an actual comparison.
