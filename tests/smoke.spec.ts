import { test, expect } from '@playwright/test';

test.describe('Spark Connect - Smoke Tests', () => {
  
  test('Page loads correctly and has SEO meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Check title
    await expect(page).toHaveTitle(/Spark Connect/);
    
    // Check if main logo or splash exists
    const logo = page.locator('img[alt="Spark Connect"]');
    await expect(logo).toBeVisible({ timeout: 15000 });
    
    // Debug: log what's actually on page
    const pageContent = await page.content();
    console.log('Page content preview:', pageContent.substring(0, 500));
    
    // Check SEO metadata
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('randkowa');

    // The React landing hero should render *some* non-empty h1 inside
    // <main> — not pinned to exact marketing copy/classes, which
    // change often and shouldn't break this smoke test every time.
    // Scoped to <main> to skip the hidden #seo-content h1 (a static,
    // display:none fallback for JS-disabled crawlers, which none of
    // these browser projects run with).
    const heroH1 = page.locator('main h1').first();
    await expect(heroH1).toBeVisible();
    await expect(heroH1).not.toBeEmpty();
  });

  test('Login page is accessible', async ({ page }) => {
    await page.goto('/');
    // Assuming there's a button to go to login or the page redirects
    const loginBtn = page.getByRole('button', { name: /Zaloguj się/i });
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });

  test('Admin panel is protected', async ({ page }) => {
    // First ensure we're logged out
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Try to logout if possible
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto('/admin');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Logout attempt failed:', e);
    }
    
    // Now check for login form
    await page.goto('/admin');
    
    // Wait for potential session check to complete
    await page.waitForTimeout(3000);
    
    // Should show login form if not authenticated, not dashboard
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page).toHaveURL(/\/admin/);
  });
});
