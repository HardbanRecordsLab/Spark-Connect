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
    
    // Check if noscript static content is present (for SEO bots)
    const noscriptH1 = page.locator('h1').filter({ hasText: 'Spark Connect – Rewolucyjna Darmowa Aplikacja Ran' });
    // Only check noscript h1 if React h1 is not visible (fallback for SEO)
    const reactH1Visible = await page.locator('h1.text-6xl.font-black.mb-3.gradient-text').isVisible();
    if (!reactH1Visible) {
      await expect(noscriptH1).toBeVisible();
    }
    
    // Check React app h1
    const reactH1 = page.locator('h1.text-6xl.font-black.mb-3.gradient-text');
    await expect(reactH1).toBeVisible();
    await expect(reactH1).toContainText('Spark Connect');
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
