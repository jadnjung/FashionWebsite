# CI clock and browser prerequisite recovery

November 21, 2026. Base 07582d66139976905e9e961a2a45dfeabbf042af on surfacebook. Root owns lib/home/upcoming-drop.test.ts and .github/workflows/ci.yml; frontend separately owns the uncommitted Quick Add Escape patch. Do not stage that unfinished app work in this batch.

## Reproduction and fixes

Matching legal-repair CI 44966663898 passed format/lint/typecheck but failed units before build, browser installation and unconfigured browser checks. Demo continued under its cancellation-only condition. This means the published legal repair was not exercised by that hosted run.

Frozen current-source local CI-mode unit run 73708 reproduced 691 passes/one failure: the mixed-list upcoming-drop test expected November 20 to remain future while using the current date. Its production helper and injected-now parameter were unchanged. Pass the fixture's November 19 reference date explicitly; full unit run 17724 then passed 692 tests across 64 files in 9.05 seconds. No production calendar behavior changed. Ignored reports: playwright-report/diagnostics/unit-ci-reproduction.* and unit-clock-fixed.*.

Give browser installation the id playwright_browsers. Demo and collection follow-ups require !cancelled() and steps.playwright_browsers.outcome == 'success'. This retains reporting after the main browser suite fails, while preventing work when earlier failure skipped installation. It does not suppress the original failing step. GitHub documents the status-function override and completed-step outcomes in [status checks](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions) and [steps context](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#steps-context).

## Validation and limits

Full units passed. Targeted ESLint and Prettier passed. Existing YAML 2.9.0 parsed the workflow without errors; assertions checked both exact conditions, prerequisite ordering, unchanged production flags and the absence of continue-on-error. Five scenarios matched the documented condition: ready after success/failure, prerequisite skipped, installation failed, installation cancelled and workflow cancelled. This is a structure/logic check; actual GitHub expression execution still requires hosted verification. No new validator dependency was added.

Native security review cleared both files and the independently pending app patch. CI SHA-256 ec1b5b481a5f23d3a4cc4bce5f2bf85ae59369c5483cfc100e56bb2f618662fa; unit test 06f2c4c1c48cc965cc440248e6d62e1da67ebe2d7393ddffe1fe746352fcaa34. Triggers, permissions, credentials and browser-test assertions remain unchanged. Root owns final integrated checks and branch-only publication. Items 83/84 and legal item 75 remain pending matching hosted results. Separate Quick Add browser validation is in progress; reuse its stable source only after its own acceptance.


## Final parent acceptance

The original/new Escape cases passed 10/10 in parent integration run 40977 in 14.7 seconds. Final parent compiler passed and full lint/format run 43407 passed for all frozen changes. Full unit run 17724 had already passed 692/64 against the same candidate bytes. Both logical batches are accepted; their source fingerprints match native security review. Root will keep the CI health correction and app ownership fix in separate commits and push once after both commits validate, avoiding redundant overlapping workflow runs. Hosted outcome checks remain pending.


## Publication

Root verified surfacebook before each logical commit and before the single explicit push. CI health commit e6d4374 and app Escape commit f5d95e9 were pushed together. Fresh remote tip matches f5d95e913e1695052a6f33a55f713bd215633235. Matching CI 44968464859 at that tip covers both accepted batches and is in progress. No main action, credential access or Claude-file change occurred. Hosted unit/prerequisite and legal-suite verification remain pending.


## Matching hosted outcome, November 21 follow-up

CI 44968464859 at exact f5d95e913e1695052a6f33a55f713bd215633235 completed with an overall failure from the independent expired Demo countdown fixture (item 86). Units/build/browser installation and agent setup passed. Unconfigured passed 645 with 15 skips; collections passed 61 with nine skips, including execution after Demo failure. Demo passed 885 with 23 skips, failed countdown on five profiles and recovered one mobile-Safari filter-selection-budget case. No Quick Add close test appeared among failed/recovered cases. These are matching hosted acceptance for the repaired scopes, not a full-green workflow claim.
