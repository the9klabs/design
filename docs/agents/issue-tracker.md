# Issue tracker

<!-- Read by: brainstorm-to-issue, superpowers-issue-bridge, fetch-issues, and any future spec/plan/triage skills -->

## Backend

GitHub

## Location

the9klabs/design

## Labels

- intent — applied to issues created by brainstorm-to-issue

## Reading

- Issue reference: `#<number>`
- List open issues: `gh issue list --repo the9klabs/design --state open --limit 1000 --json number,title,body,labels,author,createdAt,url`
- Read one issue: `gh issue view <number> --repo the9klabs/design`

## Linking

- Finishing PR: `Closes #<number>` in the PR body to close the issue on merge
- Partial PR: `Relates to #<number>` in the PR body to reference the issue without closing it
- Close by hand: `gh issue close <number> --repo the9klabs/design`

## Notes

None
