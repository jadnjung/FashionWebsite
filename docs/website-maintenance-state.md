# Website maintenance checkpoint

Resume with AGENTS.md, .codex/WEBSITE_MAINTENANCE.md and .codex/AGENT_WORKFLOW.md. Findings remain in docs/website-improvement-backlog.md.

## Current task and ownership

- Status is ready for branch-safe publication of validated items 51 and 74.
- Base is cfe278e438476d18581beb96a5302271ebd33867 on surfacebook.
- Owner is maintenance-items-51-74 in chat 01a1d24c-d335-7533-83ac-b1ab13a0c637. Source and test implementation is complete. The parent owns integration, documents, server 43606 and publication. Specialists have handed back their files and server. Preserve the pre-existing untracked debug.log.
- Owned source paths are components/product/WishlistView.tsx, components/product/ProductPurchasePanel.tsx and tests/e2e-demo/saved-item-refresh.spec.ts. The parent also owns the related architecture, decisions, roadmap, backlog, execution record and this checkpoint.
- Next candidate after completion is item 50, followed by 57. Item 73 remains open.

## Implementation and evidence

Item 51 now limits per-mount saved-item availability refreshes to four active reads. It retains survivor results, queues additions, retries failures, cancels removed/unmounted jobs and rejects stale responses using job identity. Saved records stay uncapped and genuine remounts refresh anew. Baseline RED reproduced 30 simultaneous reads and unwanted survivor refetches. Six focused Chromium regressions passed after implementation.

The first integrated 145-case run 54986 passed 144 and failed a mobile-chrome bag conflict pointer Retry. Traced repetitions 55270 failed all three times because the button was unstable/detached. Item 74 records the new finding. A measured visibility feedback loop produced 302 observer callbacks in five seconds at fixed scroll, alternating target heights 281.5/103 pixels and Retry positions 929.5/684 pixels. The fix observes the primary-button wrapper, excluding feedback height. GREEN measurement showed one callback, a stable 48-pixel target and a successful pointer Retry. The unchanged conflict test passed 15/15 across all five profiles in session 45777. Temporary probe removed.

Optimized build and final typecheck passed. Parent integrated unit run 55952 passed 567 tests across 56 files, and full lint 14800 passed after both source fixes. Quality and mandatory security reviews found no actionable issue on current source. Reviewed hashes are WishlistView 954124e87b4ccca799334c5965c37ed18407b73867e4583e72734566a9dede42, saved-item spec d8d29ceecfb462dac12120c4f14600ba10d6c3e56ecb5513caa29bf8e1cce3c3 and purchase panel b5b9dac125d19c852c64e5e7c345f8d008cf4abf4f5735b473c62405253ef297.

Parent integrated browser rerun 8623 passed all 145 cases against optimized Demo server 43606, exit 0 in 4.6 minutes. Backlog, roadmap, architecture, decisions and execution record are updated. Exact next action is final formatting/diff/link checks, stop the owned server and publish only validated owned files on surfacebook, then inspect matching hosted CI. No item 51/74 commit or push has occurred.

## Published work and scheduling

Setup 5541a45058337bc4e83f26a7f82de2141aaee37a and item 72 cfe278e438476d18581beb96a5302271ebd33867 are pushed. Their matching hosted CI runs 44018644622 and 44020283058 succeeded. Item 72 local evidence remains in its facet execution record.

Fashion website maintainer remains ACTIVE every 30 minutes in this owner chat. The daily audit remains PAUSED. Current host applies website-maintainer TOML directly because the new role was unavailable in this running chat. The prior interruption was an actual account usage-limit failure. The user's continuation recovered capacity, observed at primary 1 percent and weekly 0 percent with ordinary usage allowed. Recheck actual limits when relevant. Scheduled recovery requires app/machine/project availability and capacity.
