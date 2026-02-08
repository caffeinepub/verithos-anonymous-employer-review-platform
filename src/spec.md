# Specification

## Summary
**Goal:** Remove the “Статистика” (Statistics) UI block from the employer (My Official Profile) page only.

**Planned changes:**
- Update `frontend/src/pages/MyOfficialProfilePage.tsx` to stop rendering the entire “Статистика” card/section.
- Keep all other content, styling, layout, behavior, data fetching, and business logic unchanged.

**User-visible outcome:** On the employer (My Official Profile) page, the “Статистика” section is no longer shown, while everything else on the page remains the same.
