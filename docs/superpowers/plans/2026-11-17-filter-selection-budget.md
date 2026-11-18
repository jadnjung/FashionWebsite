# Per-group filter selection budget, item 73

## Scope and policy

Continue from published quantity commit 90a44916671c47afe5a52b3b9a6fa380ffaa56ed on surfacebook. Its CI 44224527084 failed the unconfigured tablet legal sweep with an RSC access-control page error; parent tracks that investigation separately. Demo completed 850 passes/23 skips with a recovered Quick Add case (76); collections completed 59 passes/9 skips with a recovered Search test race (77). Parent owns documents, integration and publication. Preserve unrelated debug.log and Claude files.

The existing parser trims, excludes empty or more-than 160-character entries, deduplicates case-sensitively and retains the first 20 values per size/color/collection group. Collection-handle validation follows the slice, so malformed collection tokens currently consume slots. Preserve that normalization order during this task. FacetGroup retains off-page drafts but has no budget guidance or guard.

Choose atomic invalid-submission recovery. If any normalized group exceeds 20, keep all normalized submitted choices editable, show a visible accessible recovery message and omit catalog results/pagination. Detect this before CategoryListing calls getCatalogPage, so no matching or facet requests run for an invalid submission. Avoid arbitrary first 20 application. Preserve supported sort, price, availability and other group state while correcting. The existing 20-value budget remains authoritative.

Keep bounded query criteria separate from full recovery selections and overflow metadata. Products/cursor scope hashes the filters object, so do not inject error/draft metadata into it. Share one normalization/analysis helper and budget constant with the parser. Recovery form identity must include the full retained draft so different overflow URLs reset controls correctly, while ordinary option-page navigation retains item 72 draft behavior.

## Enhanced and native behavior

Each group shows concise maximum-selection guidance linked through aria-describedby. Count effective checked values across applied and retained off-page drafts, including explicit unchecks. Reject a 21st distinct client choice with useful announced feedback, retain the preceding 20 and focus, and permit another after one is removed. Recovery URLs with 21+ start with every normalized value checked and require reduction before a successful Apply.

Native GET remains authoritative. Without JavaScript, excess submission reaches an expanded recovery form, with a visible page-level explanation and all submitted normalized choices retained. The visitor can remove choices and Apply successfully. Clear Filters remains reachable. Group error state should distinguish an over-budget recovery draft from a valid 20-choice selection whose extra attempted choice was rejected.

## Discovery evidence and required checks

Read-only explorer identified filters.ts:52–61 as the overflow checkpoint before slicing, filters.ts:99 as post-slice collection validation, FacetGroup.tsx:25–40/56–66 as retained-draft state, FilterBar.tsx:35–79 as selection merge/form key, CategoryListing.tsx:74–87 as the pre-request recovery branch and products.ts:98/132 as cursor-scope hashing. Reuse these findings and inspect only needed integration context.

- Reproduce the current 20/21 loss through a normal enhanced or native GET entry before implementation.
- Unit-check20/21 boundaries for every group, trim/dedup/invalid lengths, collection validation order, independent budgets and unchanged default parsing.
- Verify over-budget recovery does not invoke getCatalogPage or any Shopify lookup.
- Browser-check enhanced size21 rejection, off-page counting, uncheck/reselect, keyboard focus, group-independent limits, history/reset, raw overflow URLs, native no-script recovery and Clear Filters.
- Reuse canonical many-variants size/collection fixtures and existing filter-url-state tests. Do not add production probe routes or service dependencies.
- Run relevant shopping regressions, parent integrated validation and primary/security review before branch-only publication. Record the policy in DECISIONS and applicable product/architecture/content documents.

## Ownership and status

Read-only filter_budget_discovery completed the scoped trace. No item 73 source edits or server exists at plan creation. Implementation assignment follows this checkpoint. Item 75 retains earlier unknown hosted causes, and new item 76 records a separate recovered cold-mobile Quick Add test symptom for later diagnosis.

## Implementation checkpoint

- Normal-route RED: optimized normal Demo server 98802 used unchanged application code. Chromium run 5869 confirmed 20 checked choices at the 20-choice URL, then failed at the 21-choice URL with expected 21 checked inputs versus actual 20. The server was stopped; a fresh escalated listener check confirmed port 3000 free after capacity recovery. Do not repeat this already-proven RED.
- Server-boundary RED: the three new CategoryListing size/color/collection recovery tests each failed because getCatalogPage was called. After implementation, the initial focused command covering CategoryListing, filters and catalog products passed 47 tests in three files.
- Saved implementation owns lib/catalog/filters.ts and its tests, CategoryListing/FilterBar/FacetGroup, CategoryListing.test.ts and tests/e2e-demo/filter-selection-budget.spec.ts. Full recovery selections remain outside CatalogFilters/cursor hashes. Recovery skips getCatalogPage, opens retained controls, and omits product/facet paging and results. The client guard counts checked draft entries, including off-page retained rows and explicit unchecks. The stale deferred-facets header comment is corrected.
- Latest focused command: `python .codex/tools/run_project.py test:unit lib/catalog components/catalog/CategoryListing.test.ts` passed 88 tests across five files, exit 0. It includes normalization/budget/order tests and multiple overflowing groups without catalog calls.
- New browser coverage is drafted but has not yet run GREEN: enhanced off-page/focus/replacement, recovery form identity beyond the bounded first 20, history/reset, actual native no-script submission/correction/Clear, and multiple overflowing groups. Type/lint checks and optimized browser validation remain. No active owned server or browser process exists at this checkpoint.
- Parent owns independent primary/security review, integrated validation, durable project documentation and publication. No commit or push has been made by the implementer.
- Resumed checks passed full units 690/64 files and typecheck/owned lint/format before the recovery-link security fix. Server 5707 completed the first optimized build and was stopped before applying that fix; no browser tests ran against that build.
- Security review confirmed quadratic recovery href output. A new 100/1000-choice server-render regression failed with per-choice removal links present. Recovery now omits those links while retaining every checkbox, Apply and Clear; the 1000-choice output must grow by less than 15 times the 100-choice output. FacetGroup uses its option Map for label initialization. No query cap or truncation was added.
- Latest focused unit run after this fix passed 90/5 files. It includes a full-recovery form identity assertion (changing only the 21st choice resets identity; option paging alone does not). Recovery sort/history remains a browser check; native correction/Clear and off-page enhanced limits are drafted. A fresh final build, browser results and screenshots remain pending. Server 5707 is stopped and no runtime is owned at this checkpoint.

## Final implementation handoff

- Final normal optimized Demo build/server 35988 passed Next.js Turbopack build and build-time TypeScript, then served the seven-path application/test implementation. It pinned Demo on, scenario/grant profile empty and all commerce/email/real analytics integrations empty through scripts/run-browser-server.mjs. NO_COLOR was removed per invocation. The earlier build 5707 was superseded before browser validation.
- First Chromium browser pass found two test assumptions, corrected without application changes: the many-variants fixture has Size only, so the independent Color choice is removed before asserting that product matches; native numeric price state preserves 95.50 as the equivalent 95.5. Corrected new behavior cases passed 5/5.
- Full focused browser command was `python .codex/tools/run_project.py test:e2e:demo filter-selection-budget.spec.ts filter-url-state.spec.ts catalog-filters.spec.ts shopping-journey.spec.ts --workers=2 --reporter=line`, with PLAYWRIGHT_PRODUCTION=1 and PLAYWRIGHT_EXTERNAL_SERVER=1. Session 45919 completed 150/150 passed, exit 0, in 2.5 minutes across all five profiles.
- Final test-only correction removed unsupported screen from testInfo.project.use. Native no-script contexts inherit viewport, isMobile, hasTouch, deviceScaleFactor and userAgent. The affected command with `filter-selection-budget.spec.ts --grep 'native GET overflow' --workers=2 --reporter=line` passed all five profiles, session 2905 exit 0, in 14.9 seconds. The application build is unchanged; final test bytes are frozen.
- Parent reports final integrated units 692/64 files and full lint passed; primary reviewed screenshots at all four widths and security re-review is clean. Parent retains final compiler/full-formatter verification and publication. The implementer's final supported-source lint and formatting checks passed before the final no-script context correction; the corrected test was formatted with actual stdout. git diff --check passes.
- Recovery screenshots are preserved under C:/Users/jaden/Desktop/FashionWebsite/test-results/diagnostics/filter-budget-recovery-mobile.png (390), -tablet.png (768), -laptop.png (1024), and -desktop.png (1440). The ignored capture-filter-budget.mjs script reproduces them against the isolated Demo server. No media changes were needed.
- Server 35988 was stopped after the final tests. An escalated listener check confirmed no process listening on port 3000. No active owned browser/test/build process remains. No commit or push has been made by the implementer.
- Final sorted path:SHA256 manifest fingerprint (joined with LF, UTF-8) is 72d5374007b881c7916eb8579ad7f355f7acec6ac9bdf3ad906307996e468ba6. Owned paths and file hashes:
  - components/catalog/CategoryListing.test.ts: 43ec04aafe23f2cd0ffc16cddb48d9ab0eacee6b8940bd32ae4b5d1c94c3e9bd
  - components/catalog/CategoryListing.tsx: 253c04d2aad155c92db26913c5096d7e39133c598f2e480d56298ffd725461c0
  - components/catalog/FacetGroup.tsx: 012d952043c2a230194f5c0dce4ded2b90ac7fb92e82f7f5137759ef5dd0116c
  - components/catalog/FilterBar.tsx: 7ef69fb78521d41d627f4a01c922a4bddbf0abeb80658e33ddd5be5aba589c11
  - lib/catalog/filters.test.ts: 5ec5f71f5351d9e5fa7390da8bafab5288da97b3087a662b823db2bfc0460421
  - lib/catalog/filters.ts: 70082da95c41cb2c5033970591631e6a4a3dfd174900962664d227ff92a44932
  - tests/e2e-demo/filter-selection-budget.spec.ts: 1ee234f2a2a1fe8b863e6e042f0ed1a9cc54576bb73814153a2eef08e349eb18


## Parent integrated acceptance

Parent full units passed 692/64 files, full lint passed, and final frozen typecheck and whole-repository formatting passed. Governance/planning documents are intentionally excluded from automatic formatting; their local links, sequential backlog numbering and diff whitespace are checked separately. Final no-script test removed the unsupported screen property. Both reviewers rechecked that test delta and confirmed no remaining actionable findings; final seven-path fingerprint is 72d5374007b881c7916eb8579ad7f355f7acec6ac9bdf3ad906307996e468ba6. Screenshot review covered widths 390/768/1024/1440; actual assistive-technology speech and physical devices remain outside this automated evidence.

Worker reports server stopped and port 3000 free. Parent updated D-105, architecture, roadmap, backlog and checkpoint. Publication to surfacebook and matching hosted validation are next.
