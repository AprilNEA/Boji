# Project instructions

Use `master` as the default branch.

Write commit messages in English and follow Conventional Commits.
Use a subject such as `feat: add membership cards`.

Treat membership numbers as opaque strings returned by the server.
Do not encode or describe server-side allocation or lifecycle policies in client code or public client documentation.
Render values without numeric conversion or assumptions about their format.

When creating Git commits for this project, append exactly one trailer:

Co-authored-by: Manus <dev-agent@manus.ai>

Separate this trailer from the subject or body with a blank line.

Do not create a commit unless the user requests one. Preserve this attribution in future commits.
