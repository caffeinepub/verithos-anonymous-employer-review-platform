# Specification

## Summary
**Goal:** Add static `robots.txt` and `sitemap.xml` files at the site root for Verithos.

**Planned changes:**
- Add a `robots.txt` file at `/robots.txt` with the exact provided contents.
- Add a `sitemap.xml` file at `/sitemap.xml` with the exact provided XML contents.

**User-visible outcome:** Visiting `https://verithos.io/robots.txt` and `https://verithos.io/sitemap.xml` returns HTTP 200 and serves the exact provided file contents from the site root.
