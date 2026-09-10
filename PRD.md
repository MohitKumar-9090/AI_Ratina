# Product Requirements Document (PRD)

## Explainable AI for Diabetic Retinopathy Screening in Rural India

| Field | Detail |
|---|---|
| Problem Statement ID | SIH26038 |
| Organization | MathWorks |
| Category | Software |
| Theme | MedTech / BioTech / HealthTech |
| Submission Deadline | 30 September 2026 |
| Scope of this document | **Frontend only** (no backend/model integration in this phase) |
| Design Language | Glassmorphism |

---

## 1. Overview

Diabetic Retinopathy (DR) is a leading cause of preventable blindness, and rural India faces a severe shortage of ophthalmologists and screening infrastructure. This project aims to build a web-based interface for an **Explainable AI system** that assists healthcare workers (ASHA workers, nurses, general physicians) in screening retinal fundus images for signs of DR, and — critically — explains *why* the AI reached its conclusion (e.g., highlighted microaneurysms, hemorrhages, exudates) rather than acting as a black box.

This PRD covers the **frontend application only**: all screens, components, interactions, and visual design. Backend/model inference will be mocked with placeholder/static responses so the UI can be fully built, demoed, and tested independently.

---

## 2. Goals & Objectives

- Provide a **simple, low-friction interface** usable by community health workers with minimal digital literacy, in low-connectivity rural settings.
- Present AI predictions **alongside visual explanations** (heatmaps/Grad-CAM overlays, confidence scores, highlighted regions) so users trust and understand results.
- Support **offline-first / low-bandwidth** patterns (since rural connectivity is unreliable).
- Keep the interface **accessible**: large touch targets, high contrast where needed, support for regional language toggle.
- Deliver a **polished, modern glassmorphism UI** suitable for hackathon demo and judging.

### Non-Goals (this phase)
- No real AI model integration — use mocked/sample responses.
- No actual patient data storage or backend database.
- No authentication/security hardening (basic mock login only, if needed for demo flow).

---

## 3. Target Users

| User | Context | Needs |
|---|---|---|
| ASHA / Health Worker | Rural PHC (Primary Health Centre), low digital literacy, may use tablet or shared desktop | Simple upload flow, clear pass/fail-style guidance, minimal text |
| General Physician / Nurse | Reviews AI output before referral decision | Detailed explainability (heatmaps, confidence, DR grade) |
| Program Administrator | District health office | Dashboard view of aggregate screening stats |
| Judges / Demo Viewers | SIH evaluation | Clean, impressive, coherent visual narrative of the full flow |

---

## 4. Key User Flows (Frontend Scope)

### Flow A — Screening Upload & Result
1. **Landing / Login** → mock auth (role selection: Health Worker / Admin)
2. **Dashboard** → "New Screening" CTA, recent screenings list
3. **Patient Intake Form** → basic demographic fields (name, age, village, ID)
4. **Image Upload** → drag-drop / camera capture of fundus image (mocked preview)
5. **Processing State** → animated loading state simulating AI inference
6. **Result Screen** →
   - DR severity grade (No DR / Mild / Moderate / Severe / Proliferative)
   - Confidence score
   - **Explainability overlay**: heatmap toggle on the retinal image showing regions influencing the decision
   - Plain-language explanation panel ("The model flagged small red spots called microaneurysms near the optic disc")
   - Referral recommendation (e.g., "Refer to ophthalmologist within 2 weeks")
7. **Save / Export** → save to patient record (mock), export as PDF/share via SMS-link (mock)

### Flow B — Admin Dashboard
1. Aggregate stats (screenings this month, DR positive rate, referrals made)
2. Table/list of recent screenings with filter by village/severity
3. Drill into individual screening → same result view as Flow A

### Flow C — Language & Accessibility Toggle
- Toggle between English and at least one regional language (e.g., Hindi) — UI copy only, mocked translation strings.

---

## 5. Screen Inventory

| # | Screen | Priority |
|---|---|---|
| 1 | Login / Role Select | Must |
| 2 | Health Worker Dashboard | Must |
| 3 | Patient Intake Form | Must |
| 4 | Image Upload / Capture | Must |
| 5 | Processing / Loading State | Must |
| 6 | Result & Explainability View | Must |
| 7 | Patient History / Records List | Should |
| 8 | Admin Analytics Dashboard | Should |
| 9 | Settings (language, profile) | Could |
| 10 | Offline/Sync Status Indicator | Could |

---

## 6. Design System — Glassmorphism

### 6.1 Visual Principles
- Frosted-glass panels: `backdrop-filter: blur(16–24px)` with semi-transparent backgrounds (`rgba(255,255,255,0.12–0.25)`).
- Soft, layered depth via subtle box-shadows and thin 1px translucent borders (`rgba(255,255,255,0.3)`).
- Vivid but soft gradient backgrounds (avoid pure white/black backgrounds — glass needs contrast behind it to read).
- Rounded corners throughout (`border-radius: 16–24px`) for a soft, approachable, clinical-but-friendly feel.
- Minimal flat icons (outline style) with a medical/health accent color.

### 6.2 Color Palette (suggested)

| Token | Value | Use |
|---|---|---|
| Background gradient | `#0F2027 → #2C5364` (deep teal) or `#e0f7fa → #80deea` (light clinical) | App background |
| Glass surface | `rgba(255,255,255,0.15)` | Cards, panels, nav |
| Glass border | `rgba(255,255,255,0.35)` | Card outlines |
| Accent — primary | `#2EC4B6` (teal/medical) | CTAs, active states |
| Accent — alert | `#FF6B6B` (coral red) | Severe DR, high urgency |
| Accent — caution | `#FFD166` (amber) | Moderate DR |
| Accent — safe | `#06D6A0` (green) | No DR |
| Text — primary | `#0B1D26` (on light) / `#F5FAFA` (on dark) | Body copy |

> Two theme modes recommended: a **light clinical glass** mode (for outdoor/bright PHC use) and a **dark glass** mode (for indoor/demo use). Consider defaulting to light mode given outdoor rural usage conditions.

### 6.3 Typography
- Sans-serif, highly legible at small sizes (e.g., Inter, Poppins, or system UI font).
- Minimum body text 16px given older/low-literacy users; headers 24–32px.

### 6.4 Component Notes
- **Cards**: glass panels for patient records, result summaries, stat tiles.
- **Buttons**: glass or gradient-filled with clear icon + label (avoid icon-only for low-literacy users).
- **Heatmap overlay control**: a glass-panel toggle/slider sitting on top of the fundus image to switch between raw image and explainability overlay.
- **Severity badges**: solid-color pill badges (not glass) for DR grade so urgency is unambiguous against the translucent background.
- **Navigation**: bottom tab bar (mobile-first) or left glass sidebar (desktop/tablet), frosted with icons + labels.

---

## 7. Technical Requirements (Frontend Only)

- **Framework**: React (recommended) or Vue — component-based, supports the interactive states needed (upload, processing, toggle overlays).
- **Styling**: Tailwind CSS (utility classes pair well with custom glassmorphism utilities) or CSS Modules with custom `backdrop-filter` classes.
- **State**: Local component state / lightweight store (e.g., Context API or Zustand) — no backend required; all data mocked via local JSON/fixtures.
- **Mock Data Layer**: Static JSON fixtures simulating:
  - Patient records
  - AI prediction responses (severity grade, confidence, heatmap image URL)
  - Aggregate dashboard stats
- **Image Handling**: File upload input + drag-drop; use placeholder/sample fundus images with pre-generated (static) heatmap overlay images for the explainability demo.
- **Responsiveness**: Mobile-first (tablets are the likely field device); must degrade gracefully to low-end Android browsers.
- **Performance**: Glassmorphism `backdrop-filter` is GPU-intensive — test on low-end devices; provide a reduced-blur fallback mode if performance suffers.
- **Accessibility**: WCAG AA contrast for text over glass; ensure severity badges don't rely on color alone (add icon/text).

---

## 8. Success Metrics (for hackathon demo)

- Complete, clickable end-to-end flow: login → upload → result with explainability → save.
- Visually distinct, polished glassmorphism theme consistently applied across all screens.
- Works smoothly on a mid-range Android tablet/browser (simulating rural field conditions).
- Judges can understand the explainability concept within 30 seconds of viewing the result screen.

---

## 9. Open Questions

- Should regional language support be a toggle (English/Hindi) or multi-language dropdown for the demo?
- Do we simulate an offline/low-connectivity indicator (e.g., "queued for sync") to emphasize the rural-use narrative to judges?
- Should the admin dashboard be in scope for MVP demo, or deferred as a "Could" item if time-constrained?

---

## 10. Milestones (Frontend Build)

| Milestone | Deliverable |
|---|---|
| M1 | Design system + component library (glass cards, buttons, badges, nav) |
| M2 | Core flow: login → upload → mock processing → result screen |
| M3 | Explainability overlay interaction (heatmap toggle) |
| M4 | Patient history + admin dashboard screens |
| M5 | Responsive polish, accessibility pass, demo data seeding |
| M6 | Final QA + demo rehearsal build |
