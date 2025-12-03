import { test, expect } from '@playwright/test';

// Helper to login before tests
test.beforeEach(async ({ page }) => {
  // For now, we'll skip login - in real scenario you'd:
  // 1. Create a test user in Supabase
  // 2. Use page.goto('/login') and fill credentials
  // 3. Or set auth tokens directly in localStorage
  await page.goto('/');
});

test.describe('Trips Management', () => {
  test.skip('should display trips list', async ({ page }) => {
    await page.goto('/trips');
    
    await expect(page.getByRole('heading', { name: /trips/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new trip/i })).toBeVisible();
  });

  test.skip('should open create trip modal', async ({ page }) => {
    await page.goto('/trips');
    
    await page.click('button:has-text("New Trip")');
    
    await expect(page.getByRole('heading', { name: /create new trip/i })).toBeVisible();
    await expect(page.getByLabel(/trip name/i)).toBeVisible();
    await expect(page.getByLabel(/vehicle/i)).toBeVisible();
  });

  test.skip('should create a new trip', async ({ page }) => {
    await page.goto('/trips');
    
    await page.click('button:has-text("New Trip")');
    await page.fill('input[name="name"]', 'Test Trip');
    await page.selectOption('select[name="vehicle_id"]', { index: 1 });
    await page.fill('input[type="datetime-local"]', '2025-12-03T09:00');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('Test Trip')).toBeVisible();
  });

  test.skip('should click on trip to view deliveries', async ({ page }) => {
    await page.goto('/trips');
    
    // Click on first trip row
    await page.click('table tbody tr:first-child');
    
    // Should display deliveries section
    await expect(page.getByText(/deliveries for/i)).toBeVisible();
  });

  test.skip('should drag and drop delivery to reorder', async ({ page }) => {
    await page.goto('/trips');
    
    // Click trip to show deliveries
    await page.click('table tbody tr:first-child');
    
    // Get delivery rows
    const deliveryRows = page.locator('table:last-of-type tbody tr');
    const firstRow = deliveryRows.nth(0);
    const secondRow = deliveryRows.nth(1);
    
    // Perform drag and drop
    await firstRow.dragTo(secondRow);
    
    // Order should be swapped (verify by checking sequence numbers)
    await expect(firstRow.locator('td:first-child')).toContainText('2');
  });
});
