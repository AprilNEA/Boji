# docs/sites/

This directory is the MDX content source of the standalone pages that `websites/` builds: `/support/`, `/privacy/`, `/terms/`, `/third-parties/` and their English versions under `/en/`. The docs section under `/docs/` lives in the parent directory `docs/`. Read `websites/AGENTS.md` (section "Docs") for the page rules and the build commands.

## Boundary

- Every `.mdx` file in this directory is published. Put only content that may be public here.
- Do not move or copy `docs/developers/`, `ios/docs/` or other documents into this directory. Developer pages belong in `docs/developers/`.
- `websites/src/lib/source.ts` collects only `*.mdx` here. Other files, such as this guide, are not published.
- Do not put secrets, review contacts, review accounts, DSNs or private email addresses in pages.

## Layout

The file name is the URL path. An English version has the same name with `.en` before the extension, and its URL is under `/en/`.

| Path | Route | Content |
| --- | --- | --- |
| `support.mdx` | `/support/` | Support page for app users, in Chinese only |
| `privacy.mdx`, `privacy.en.mdx` | `/privacy/`, `/en/privacy/` | Privacy policy. The English version controls |
| `terms.mdx`, `terms.en.mdx` | `/terms/`, `/en/terms/` | Terms of use. The English version controls. It includes the minimum terms that Apple requires in a custom EULA |
| `third-parties.mdx`, `third-parties.en.mdx` | `/third-parties/`, `/en/third-parties/` | Third-party data sharing list: the processors, and the platform operators that receive data under their own privacy policies, with name, address, country, data and purpose. It is part of the privacy policy. Update it when a processor or a platform operator changes |

- Each page is published only when `websites/src/app/(docs)/(pages)/` has a route file for it. The English routes are in `(pages)/en/`.
- Do not add a `meta.json` here, because no navigation reads it.

## Links

- Link to another page in the same language with a relative file link, for example `[隐私政策](./privacy.mdx)` in a Chinese page and `[Privacy Policy](./privacy.mdx)` in an English page. Fumadocs resolves the link to the page in the same language.
- Link to the other language version with its absolute URL, for example `[English](/en/privacy/)` and `[中文版](/privacy/)`, because a relative file link cannot cross languages.
- Give every heading of the privacy policy and the terms of use a custom anchor with the `[#id]` suffix, and use the same anchors in both language versions. Links from other pages and from the apps must use these anchors, for example `/privacy/#your-rights`.

## Support, privacy and terms pages

- App Store Connect uses `https://leanmuscle.club/support/` and `https://leanmuscle.club/privacy/`. Do not rename or move `support.mdx` or `privacy.mdx`. If a route must change, keep a page at the old route and update App Store Connect first.
- The docs sidebar links to the Chinese standalone pages at its bottom, through `PageLinks` in `websites/src/lib/docs.tsx`. Each language version links to the other version below its effective date.
- The terms of use are in effect from 2026-10-21. The privacy policy and the third-party data sharing list were last updated and are in effect from 2026-10-22. `websites/docs/privacy-support.md` lists the decisions, the open items and the evidence for each statement.
- Keep the Chinese and English versions equal in content and clause numbering. Change both versions in the same change, and update the dates of both. The English version controls when the versions differ.
- Write the privacy policy and the terms of use by category and purpose. Do not list specific data fields, screen names or platform features, because they change with the product. Name processors and platform operators only in the third-party data sharing list. Describe purposes and categories broadly enough that a new feature in an existing category does not require a new clause, but keep the commitments that the law requires: no sale of data, separate consent for sensitive data, user rights and response periods.
- A platform operator, such as Apple for APNs and Wallet, processes data under its own privacy policy and is not a processor. Section 4.5 of the privacy policy covers platform operators. Do not list a platform operator as a processor.
- Write the privacy policy and the terms of use in a formal legal register, not in the style of technical documentation. The Chinese versions address the user as 您 and use numbered clauses. Mark clauses about sensitive personal information, cross-border transfers, disclaimers, limits of liability, indemnification and dispute resolution in bold. `websites/docs/privacy-support.md` (section 文体) describes the register and the reference texts.
- Every statement must stay true for all shipped versions. Check the app source and `bizserver/` before you change a statement about data. Do not promise a practice that the product does not follow.
- `terms.mdx` and `terms.en.mdx` have a section with the minimum terms of Apple's "Instructions for Minimum Terms of Developer's End-User License Agreement". Keep that section complete, because the page is the custom EULA in App Store Connect.
- Keep the liability clauses of the terms within the law. Do not exclude liability for personal injury, or for property loss from intent or gross negligence, because the Civil Code of China (article 506) makes such a clause void. Keep these clauses in bold, because the Civil Code (article 496) requires the provider of standard terms to draw attention to them. Keep the limitation period clause subject to the statutory period, because the Civil Code (article 197) voids an agreed limitation period.
- When product behavior changes the categories, purposes, recipients or retention of data, update both language versions in the same change as the code, and update `websites/docs/privacy-support.md`.
- Use the contact address that matches the purpose: `privacy@leanmuscle.club` in the privacy policy, the third-party data sharing list and privacy requests; `legal@leanmuscle.club` in the terms of use; `support@leanmuscle.club` for app help. `websites/docs/privacy-support.md` (section 邮箱) lists all addresses. Do not use a personal address or the old `thinmuscle-club@proton.me`.
- Follow the membership number rule in the root `AGENTS.md`. Do not describe how the server allocates membership numbers.
