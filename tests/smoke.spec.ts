import { test, expect } from '@playwright/test';

test.describe('Spark Connect - Smoke Tests', () => {
  
  test('Page loads correctly and has SEO meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Spark Connect/);
    
    // Check if main logo or splash exists
    const logo = page.locator('img[alt="Logo"]');
    await expect(logo).toBeVisible({ timeout: 10000 });
    
    // Check SEO metadata
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('randkowa');
    
    // Check if noscript static content is present (for SEO bots)
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Spark Connect');
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
    await page.goto('/admin');
    // Should show login form if not authenticated, not the dashboard
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page).toHaveURL(/\/admin/);
  });
});
