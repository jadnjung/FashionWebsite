# Search continuation cursor validation, item 77

## Evidence and change

Base is published filter fix b54d44268657c42444b91ce0788be341a236ea3e on surfacebook. Hosted run 44224527084 confirmed the old test raced its own navigation: tablet and mobile Safari read a null productAfter, began changed-query navigation, then were interrupted by the original continuation. The current test clicked once and read page.url immediately. No application defect is inferred from that test race.

Root owns one test path, tests/e2e-collections/search.spec.ts. Capture the Next products href, activate once, await that exact destination and four continuation products, require a nonempty cursor, then use that actual prior-query cursor to test changed-query recovery. Preserve metadata/referrer/privacy assertions and all original navigation actions. No extra waits, click loops, retries or application changes.

## Validation checkpoint

Mandatory read-only security review found no actionable issue; reviewed source SHA-256 14a8d73425348191890c9d16725cd26fb74648a1067d37448b22dd3c8bff1465. Targeted lint/formatter passed. Optimized isolated collection-profile build succeeded; server 17933 is ready at localhost:3000. Root owns runtime. Repeated affected run 2966 is active: ten repetitions across all five profiles, 50 cases, 2 workers. Full collection regression and final compiler/document checks follow. No item 77 publication or completed browser result is claimed yet.


## Final local acceptance

Repeated run 2966 passed all 50 cases in 1.3 minutes. Full collection run 94192 passed 61 cases with nine intended profile/isolated-analytics skips in 1.1 minutes, exit 0. Ignored log: playwright-report/diagnostics/search-cursor-77-collections.log. Typecheck, targeted ESLint and Prettier passed. Security review cleared the exact source hash above. No application behavior or test retry policy changed. Root stopped owned server 17933. Branch-only publication and matching hosted checks remain next.


## Publication

Verified surfacebook before commit and push. Published 389d53b1f4909f5dd572d0549ec9d91f8a200773 using the explicit surfacebook destination; fresh remote revision matches. Matching CI 44261401908 is in progress. The preceding filter fix CI 44260605709 is also in progress.
