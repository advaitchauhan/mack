import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should load dashboard with Mack branding', async ({ page }) => {
    await page.goto('/')

    // Check header branding
    await expect(page.locator('h1')).toContainText('Mack')
    await expect(page.locator('text=Practice real conversations')).toBeVisible()
  })

  test('should display Practice Scenarios and History tabs', async ({ page }) => {
    await page.goto('/')

    // Check tabs exist
    await expect(page.locator('text=Practice Scenarios')).toBeVisible()
    await expect(page.locator('text=History')).toBeVisible()
  })

  test('should show featured Coffee Shop scenario', async ({ page }) => {
    await page.goto('/')

    // Check featured section
    await expect(page.locator('text=Recommended')).toBeVisible()
    await expect(page.locator('h2:has-text("Coffee Shop")')).toBeVisible()
    await expect(page.locator('text=Start Practice').first()).toBeVisible()
  })

  test('should display all scenario cards', async ({ page }) => {
    await page.goto('/')

    // Check for all scenarios
    const scenarios = ['Coffee Shop', 'Bar Setting', 'Restaurant Group', 'Public Transit', 'Street Approach']

    for (const scenario of scenarios) {
      await expect(page.locator(`text=${scenario}`).first()).toBeVisible()
    }
  })

  test('should show difficulty badges on scenario cards', async ({ page }) => {
    await page.goto('/')

    // Check for difficulty badges
    await expect(page.locator('text=Beginner').first()).toBeVisible()
    await expect(page.locator('text=Intermediate').first()).toBeVisible()
    await expect(page.locator('text=Advanced').first()).toBeVisible()
  })

  test('should navigate to scenario intro when clicking Start Practice', async ({ page }) => {
    await page.goto('/')

    // Click the featured Coffee Shop Start Practice button
    await page.locator('a[href="/scenario/coffee/intro"]').first().click()

    // Should navigate to intro page
    await expect(page).toHaveURL('/scenario/coffee/intro')
  })

  test('should switch to History tab', async ({ page }) => {
    await page.goto('/')

    // Click History tab
    await page.locator('button:has-text("History")').click()

    // Wait for tab content to change - History tab should show conversation history component
    await page.waitForTimeout(300)

    // Check that History tab is now active (button should have active state)
    await expect(page.locator('button:has-text("History")')).toHaveAttribute('data-state', 'active')
  })

  test('should show tips for success section', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('text=Tips for Success')).toBeVisible()
    await expect(page.locator('text=Be Genuine')).toBeVisible()
    await expect(page.locator('text=Listen Actively')).toBeVisible()
    await expect(page.locator('text=Practice Makes Progress')).toBeVisible()
  })
})
