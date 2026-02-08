# Specification

## Summary
**Goal:** Remove all `verithos.com` references from `frontend/index.html` head metadata by using relative URLs where appropriate and `https://verithos.io/` where absolute URLs are required.

**Planned changes:**
- Update `frontend/index.html` `<head>` so asset references (e.g., `og:image`, favicon) use relative paths (e.g., `/assets/verithos-logo-rgb-shield.png`) instead of absolute domain URLs.
- Set canonical and Open Graph page URL metadata to `https://verithos.io/`.
- Replace any `dns-prefetch` entries that reference `verithos.com` with `//verithos.io` (and `//www.verithos.io` if applicable), ensuring no `verithos.com` remains.

**User-visible outcome:** The site’s HTML metadata no longer references `verithos.com`, and SEO/social sharing metadata correctly points to `verithos.io` while assets load via relative paths.
