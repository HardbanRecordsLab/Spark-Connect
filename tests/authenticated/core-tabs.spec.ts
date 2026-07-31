import { test, expect, type Page } from '@playwright/test';

// Catches the exact bug class that shipped twice this cycle: a
// component using an icon/prop it never imported crashes only at
// render time (tsc under the wrong config missed it, `vite build`
// doesn't type-check, and it's invisible unless you're logged in and
// actually click into the tab). ErrorBoundary swallows the crash into
// a "Coś poszło nie tak" fallback screen instead of a blank page or a
// failed network request, so neither shows up without this check.

const TABS = [
  { name: 'Odkryj', label: 'discover' },
  { name: 'Feed', label: 'feed' },
  { name: 'Czaty', label: 'chats' },
  { name: 'Mapa', label: 'map' },
  { name: 'Profil', label: 'profile' },
];

async function assertNoCrash(page: Page) {
  await expect(page.getByText('Coś poszło nie tak')).not.toBeVisible();
}

for (const tab of TABS) {
  test(`${tab.label} tab renders without crashing`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Profil' })).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: tab.name }).click();
    await page.waitForTimeout(1500); // let async data fetches + renders settle
    await assertNoCrash(page);

    expect(errors, `Uncaught JS errors on ${tab.label} tab: ${errors.join('; ')}`).toEqual([]);
  });
}
