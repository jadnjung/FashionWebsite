# Actionable CI browser failure diagnostics

## Confirmed gap

At published 6d201c3dadad8d8171e35136f2db30dc227be71c, hosted run 44179007153 failed its unconfigured browser step. The public check output has null title/summary/text and annotations contain only exit code 1 and an Ubuntu image notice. Earlier 7460f7f had a similar inaccessible failure, while exact e1e4ac8 passed all hosted checks. These observations do not establish either failure's cause.

Saved GitHub credential reuse for authenticated CI-log access remains rejected by automatic approval review because that specific use lacks authorization. No credential or authenticated log was accessed. This change improves future repository-owned test reporting.

## Implementation

All three Playwright configs add the built-in github reporter when CI is truthy, alongside their existing HTML reporters. Main default HTML behavior and Demo/collection output folders remain intact. Test selection, retries, workers, assertions, launch profiles and application behavior retain their existing settings. The workflow has one application job without a matrix. [Playwright reporters](https://playwright.dev/docs/test-reporters#github-actions-annotations)

## Validation

- Exact-6d201c3 unconfigured production server 31063 completed its build before item 55 runtime edits. Full run 26386 used CI retries, two workers and explicit line/json reporters. It exited 0 with 617 passed, 15 intended skips, zero unexpected and zero flaky cases across 632 cases in 239.5 seconds. Ignored diagnostics are playwright-report/diagnostics/unconfigured-6d201c3.log and .json. Server stopped afterward.
- The later config change did not alter that frozen run's assertions or explicit reporter selection.
- A temporary ignored probe loaded all three actual configs. CI-mode configuration assertions passed for GitHub reporter inclusion and preserved HTML destinations. Its intentional synthetic failure exited 1 and emitted a ::error annotation with project, test, file, line and assertion details. An HTML report was generated.
- Local-mode configuration assertions passed separately with GitHub reporter absent. Probe source files were removed after verification. Ignored annotation log and HTML artifacts remain under playwright-report/diagnostics.
- Typecheck and targeted Prettier validation passed. Security review found no actionable issue and confirmed the installed reporter makes no credential collection or external requests. Reviewed three-config fingerprint is 85139fa5b5342b287ceeefced91d97f32924491fe4226e6082dcf64d26d0e77d.

This diagnostics change is ready for branch-only publication. Actual hosted annotation visibility and the test causing the earlier hosted failures remain pending the next run. Item 75 stays open. Item 55 helper/tests are independent uncommitted worker-owned work and are excluded from this publication.


## Publication

Branch was verified exactly surfacebook before commit and again before explicit push to HEAD:refs/heads/surfacebook. Published c7fff198d046e0577d21258681e3302989b21e9c and verified the remote revision. Matching public CI run is [44222096860](https://github.com/jadnjung/FashionWebsite/actions/runs/44222096860), currently in progress. Its public job snapshot had reached Demo with no failed step reported. Hosted annotation visibility and final result remain pending.
