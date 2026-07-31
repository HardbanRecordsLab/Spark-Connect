import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

// Logs in through the real UI (not a direct API call) so this setup
// also exercises the actual login form once per run, then saves the
// session so authenticated specs don't each have to log in again.
// Requires a dedicated, persistent test account -- see README note in
// tests/authenticated/ for how it's provisioned.
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'E2E_TEST_EMAIL / E2E_TEST_PASSWORD env vars are required to run authenticated e2e tests. ' +
      'See tests/authenticated/README.md.'
    );
  }

  await page.goto('/');
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /zaloguj się/i }).click();

  // Confirm we actually landed in the authenticated app shell (bottom
  // nav), not still on the login form or an error state.
  await expect(page.getByRole('button', { name: 'Profil' })).toBeVisible({ timeout: 20000 });

  await page.context().storageState({ path: authFile });
});
