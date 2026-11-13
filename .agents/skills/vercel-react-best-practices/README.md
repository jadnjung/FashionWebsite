# React best practices reference

Use this installed skill to review and improve React and Next.js performance. Start with [SKILL.md](SKILL.md), open the relevant files under `rules/`, or read the [compiled guide](references/compiled-guide.md).

## Installed resources

- `rules/` contains individual rules, examples, section metadata, and a rule template.
- `references/compiled-guide.md` contains the expanded reference manual.
- `metadata.json` records the upstream version, organization, and abstract.
- `source-metadata.json` preserves the original skill frontmatter and attribution.

## Maintaining the copied rules

This directory contains the installed reference files. The upstream contributor tools, `src/`, package manifest, and generated test cases are outside this copy. Run upstream build, validation, and test-extraction commands in the upstream project's development checkout. Running `pnpm build` here may invoke the storefront build through the parent package.

For a local rule correction, edit the corresponding `rules/area-description.md` and keep the compiled guide consistent. Preserve the rule title, impact, tags, behavioral explanation, and examples.

Use four backticks around a Markdown template containing fenced code examples.

````markdown
---
title: Rule title
impact: MEDIUM
tags: react, performance
---

## Rule title

Explain when the rule applies and the behavior it improves.

```typescript
// Include a focused example.
```
````

## Attribution

The rules were created by [@shuding](https://x.com/shuding) and [Vercel](https://vercel.com). The installed resource locations and maintenance guidance were adapted for this repository during the Codex migration.
