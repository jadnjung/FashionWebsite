import { test, expect } from '@playwright/test';

// ROADMAP.md Phase 9 — "a reduced-motion audit across all of the above."
// This is a verification/completeness pass over every animated surface in
// the codebase (DESIGN_SYSTEM.md §63, INTERACTIONS.md §17), not just this
// phase's own new work — see DECISIONS.md D-042.
//
// Each surface below already has its own full behavioral test elsewhere
// (access-gate.spec.ts, homepage.spec.ts, custom-cursor.spec.ts) — the
// assertions here are deliberately minimal, smoke-level confirmations that
// the reduced-motion contract specifically holds for that surface, so this
// file reads as one coherent audit record rather than a full re-test.
//
// Conclusion of the audit (recorded in full in DECISIONS.md D-042): every
// pre-existing animated surface was already correct. The one real gap this
// phase's own research surfaced — the sitewide universal-selector reduced-
// motion rule (app/globals.css) does not reach the browser's UA-generated
// ::view-transition-* pseudo-element tree — was fixed as part of adding the
// shared-element transition CSS itself (Task 5), not discovered here after
// the fact; this file's own new assertion below is what confirms the fix.

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

test.describe('reduced-motion audit — pre-existing surfaces (regression)', () => {
  test('FullScreenMenu open/close transition collapses to near-zero', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const duration = await page
      .locator('.esque-menu')
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    for (const part of duration.split(',')) {
      expect(parseFloat(part)).toBeLessThan(0.05);
    }
  });

  test('access-gate incorrect-password animation collapses to near-zero', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/access');
    await page.getByLabel(/password/i).fill('definitely-wrong-password');
    await page.getByRole('button', { name: 'ENTER' }).click();
    const shift = page.locator('.esque-access-error-shift');
    await expect(shift).toBeVisible();
    const duration = await shift.evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.05);
  });

  test('homepage hero entrance fade collapses to near-zero', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const duration = await page
      .locator('.esque-hero-reveal')
      .evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.05);
  });
});

test.describe('reduced-motion audit — this phase’s new surfaces', () => {
  test('custom cursor never activates under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.mouse.move(200, 200);
    await page.waitForTimeout(200);
    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains('esque-cursor-none'),
    );
    expect(hasClass).toBe(false);
    // Full behavioral coverage lives in custom-cursor.spec.ts — this is the
    // audit's cross-reference confirmation, not a duplicate suite.
  });

  test('homepage hero parallax applies no offset under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(200 + i, 200 + i);
      await page.waitForTimeout(100);
    }
    const props = await page.locator('[data-hero-parallax]').evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        x: style.getPropertyValue('--parallax-x').trim(),
        y: style.getPropertyValue('--parallax-y').trim(),
      };
    });
    expect(props.x).toBe('');
    expect(props.y).toBe('');
    // Full behavioral coverage lives in homepage.spec.ts's own parallax
    // describe block — this is the audit's cross-reference confirmation.
  });

  test('the ::view-transition-* reduced-motion rule exists and targets the right selectors', async ({
    page,
  }) => {
    // The one genuine gap this phase's research surfaced: the sitewide `*`
    // universal-selector rule does not reach the browser's UA-generated
    // view-transition pseudo-element tree (confirmed against Next.js's own
    // bundled View Transitions guide, which documents this exact gap and
    // ships its own targeted recipe). A live transition's pseudo-elements
    // only exist for the brief, non-deterministic duration of an actual
    // browser-driven animation, so asserting against a real one mid-flight
    // would be flaky; reading the parsed stylesheet rule directly is a
    // deterministic way to confirm the fix is genuinely in place, not just
    // asserted in a comment.
    await page.goto('/');
    const targets = [
      '::view-transition-old(*)',
      '::view-transition-new(*)',
      '::view-transition-group(*)',
    ];
    // Returns structured {selector, duration} pairs rather than a
    // concatenated string — the selectors themselves contain colons
    // (`::view-transition-old(*)`), which made an earlier `"selector:value"`
    // + `.split(':')` version of this check parse the wrong segment.
    const found = await page.evaluate((targetSelectors) => {
      const matches: { selector: string; duration: string }[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue; // cross-origin sheets throw on access; none expected here
        }
        for (const rule of Array.from(rules)) {
          if (!(rule instanceof CSSMediaRule)) continue;
          if (!rule.media.mediaText.includes('prefers-reduced-motion')) continue;
          for (const inner of Array.from(rule.cssRules)) {
            if (!(inner instanceof CSSStyleRule)) continue;
            for (const selector of targetSelectors) {
              if (inner.selectorText.includes(selector)) {
                matches.push({ selector, duration: inner.style.animationDuration });
              }
            }
          }
        }
      }
      return matches;
    }, targets);

    for (const target of targets) {
      const match = found.find((entry) => entry.selector === target);
      expect(match, `expected a reduced-motion rule for ${target}`).toBeDefined();
      expect(parseFloat(match!.duration)).toBeLessThan(0.05);
    }
  });
});
