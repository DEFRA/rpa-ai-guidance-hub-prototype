---
status: draft
url: /guide/:id/bookmark
---

**Shaun Fitzsimons — 28 September 2026**

Separate question page for case bookmarking (moved from guide panel), follows GOV.UK radios-with-conditional-reveal.

- Type (Case ID/SBI) and value are one question, not two
- Two named fields to avoid conditional reveal CSS-only hiding issue with form submission
- Redirects to guide on success with session flash for notification banner
- Prototype-only: role switch for permissions

---

**Shaun Fitzsimons — 28 September 2026**

Now also bookmarks a single section: `?section=<anchor>` (from a section heading's "Bookmark section" link) asks the same question about that section, carries it in a hidden field, and returns to the section rather than the top of the guide. Same question page, not a new one: it's the same case/SBI choice, just aimed more precisely, which matters on a 200-page guide.

- Removing a guide's last bookmarked section also takes the guide off that case (`side-nav.js`'s `removeBookmark`). Whole-guide and section bookmarks aren't tracked apart, a deliberate simplification for the prototype.
