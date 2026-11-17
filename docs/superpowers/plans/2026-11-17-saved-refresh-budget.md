# Saved-item refresh and mobile recovery

This execution record covers backlog item 51 and the subsequently discovered item 74 on base cfe278e. The maintainer owns integration and documentation, and the frontend specialist owns WishlistView and focused browser regressions.

## Acceptance

- Keep all existing saved records and their order.
- Bound concurrent availability requests and let healthy results render independently of failures.
- Removing an entry retains healthy survivors without restarting their requests.
- Adding an entry refreshes the new handle, including cross-tab storage changes.
- Retry refreshes failed handles without refetching healthy survivors.
- Preserve request deadlines, response-handle validation, cancellation and accessible recovery focus.

## Execution

- [x] Reconcile the actual branch, published SHA and interrupted checkpoint.
- [x] Verify setup CI 44018644622 succeeded at 5541a45.
- [x] Trace the whole-list effect and unrestricted Promise.allSettled request burst.
- [x] Execute failing browser regressions on unchanged source.
- [x] Implement the bounded incremental refresh behavior.
- [x] Complete independent quality and security reviews.
- [x] Run integrated validation and update backlog status with actual results.
- [ ] Publish validated work to surfacebook and inspect matching hosted CI.

Item 72 was pushed as cfe278e. Its hosted CI 44020283058 was pending at task start and subsequently completed successfully at that exact SHA. The implementation and validation stages below record current item 51 and 74 status.

RED on the unchanged optimized Demo server passed the regression-sensitivity check. All three new Chromium cases failed for the intended defects. Initial load started 30 held requests against a budget of four. Removing one of three completed entries refetched both survivors, producing five requests. Retrying one failure also refetched the healthy entry. The old server 41750 was subsequently stopped before GREEN builds.

First implementation is saved. Parent full unit run 89605 passed all 567 tests across 56 files. The specialist's typecheck passed. LSP reported zero diagnostics in an incomplete snapshot. Subsequent milestones below include the final source validation.

Independent quality review and mandatory security review found no actionable issue on WishlistView SHA-256 954124e87b4ccca799334c5965c37ed18407b73867e4583e72734566a9dede42 and final six-case browser spec d8d29ceecfb462dac12120c4f14600ba10d6c3e56ecb5513caa29bf8e1cce3c3. Cases cover concurrency, survivor retention, remount freshness, failed-only retry, deliberate focus movement, cross-tab additions, cancellation, queue deadline recovery and late decoder rejection. Removal-to-empty during Retry has no dedicated browser case, and its source path was reviewed.

Integrated optimized run 54986 exited 1 with 144 passed and one failed case, mobile-chrome reliability without Web Locks delayed add. All new saved-item cases passed. The subsequent traced repetitions confirmed that unchanged bag test's reproducible failure. Publication remains pending.

The traced follow-up 55270 failed all three repetitions at retry.click with unstable/detached-element reports. Backlog item 74 records this new mobile recovery defect. The subsequent probe measured the observer feedback loop in ProductPurchasePanel. Item 51 publication is held pending resolution. Server 99572 was used for diagnosis and later replaced by the GREEN build.

Item 74 measurement confirmed a size/visibility feedback loop. In five seconds the Pixel 7 probe recorded 302 observer entries. At constant action Y 791 and scroll Y 1654, target height alternated 281.5/103 pixels, ratio 0.1705/0.4660 and Retry Y 929.5/684 pixels. The minimal fix observes a dedicated primary-button wrapper. GREEN measurement confirmed one observer callback, a stable 48-pixel target and successful pointer Retry.

After capacity recovered, parent full unit run 55952 passed 567 tests across 56 files and full lint 14800 passed on both final source fixes. Final optimized build, specialist typecheck/lint/formatting passed. The unchanged conflict pointer case passed all 15 repeated cases across five profiles in session 45777. Independent quality and security delta reviews found no actionable issue on purchase-panel SHA b5b9dac125d19c852c64e5e7c345f8d008cf4abf4f5735b473c62405253ef297. The temporary geometry probe was removed. Parent integrated rerun 8623 passed all 145 cases on final optimized server 43606, exit 0 in 4.6 minutes, including all 25 shopping-journey checks.

Final documentation updates mark items 51 and 74 implemented and locally verified, preserve all original failure evidence and record D-099/D-100 and the relevant architecture/roadmap changes. Publication and matching hosted CI remain the next steps. Physical-device and connected-service evidence retain their existing owner dependencies.
