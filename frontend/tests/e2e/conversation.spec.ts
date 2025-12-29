import { test, expect } from '@playwright/test'

test.describe('Conversation Page', () => {
  test('should load conversation page with correct scenario', async ({ page }) => {
    await page.goto('/scenario/coffee/conversation')

    // Should show Coffee Shop scenario name
    await expect(page.locator('h1:has-text("Coffee Shop")')).toBeVisible()

    // Should show Practice Session subtitle (agent name hidden for realism)
    await expect(page.locator('text=Practice Session')).toBeVisible()
  })

  test('should show End button', async ({ page }) => {
    await page.goto('/scenario/coffee/conversation')

    await expect(page.locator('button:has-text("End")')).toBeVisible()
  })

  test('should show microphone control button', async ({ page }) => {
    await page.goto('/scenario/coffee/conversation')

    // Should have mic button in footer
    await expect(page.locator('footer button')).toBeVisible()
  })

  test('should show idle state overlay with instructions initially', async ({ page }) => {
    await page.goto('/scenario/coffee/conversation')

    // Should show instruction overlay when not connected
    await expect(page.locator('text=Start the Conversation')).toBeVisible()
    await expect(page.locator('text=Begin Speaking')).toBeVisible()
  })

  test('should show connecting state when starting conversation', async ({ page }) => {
    await page.goto('/scenario/coffee/conversation')

    // Click Begin Speaking button
    await page.click('text=Begin Speaking')

    // Should show connecting state
    await expect(page.locator('text=Connecting')).toBeVisible({ timeout: 5000 })
  })

  test('should display avatar image', async ({ page }) => {
    await page.goto('/scenario/coffee/conversation')

    // Should have an avatar image
    await expect(page.locator('img[alt]').first()).toBeVisible()
  })

  test('should display tips section', async ({ page }) => {
    await page.goto('/scenario/coffee/conversation')

    // Should show tips
    await expect(page.locator('text=Tips')).toBeVisible()
    await expect(page.locator('text=Be genuine and confident')).toBeVisible()
  })

  test('should work for bar scenario', async ({ page }) => {
    await page.goto('/scenario/bar/conversation')

    await expect(page.locator('h1:has-text("Bar Setting")')).toBeVisible()
    await expect(page.locator('text=Practice Session')).toBeVisible()
  })

  test('should work for restaurant scenario', async ({ page }) => {
    await page.goto('/scenario/restaurant/conversation')

    await expect(page.locator('h1:has-text("Restaurant Group")')).toBeVisible()
    await expect(page.locator('text=Practice Session')).toBeVisible()
  })

  test('should work for transit scenario', async ({ page }) => {
    await page.goto('/scenario/transit/conversation')

    await expect(page.locator('h1:has-text("Public Transit")')).toBeVisible()
    await expect(page.locator('text=Practice Session')).toBeVisible()
  })

  test('should work for street scenario', async ({ page }) => {
    await page.goto('/scenario/street/conversation')

    await expect(page.locator('h1:has-text("Street Approach")')).toBeVisible()
    await expect(page.locator('text=Practice Session')).toBeVisible()
  })

  test('should show error for invalid scenario', async ({ page }) => {
    await page.goto('/scenario/invalid/conversation')

    await expect(page.locator('text=Scenario not found')).toBeVisible()
  })

  test('End button should redirect to review page', async ({ page }) => {
    await page.goto('/scenario/coffee/conversation')

    // Click End button
    await page.click('button:has-text("End")')

    // Should show saving state or redirect
    await page.waitForURL('**/review/**', { timeout: 10000 })

    // Should be on review page
    expect(page.url()).toContain('/review/')
  })
})

test.describe('Full User Flow', () => {
  test('complete flow: dashboard -> intro -> conversation -> review', async ({ page }) => {
    // Start at dashboard
    await page.goto('/')
    await expect(page.locator('h1:has-text("Mack")')).toBeVisible()

    // Click on Coffee Shop scenario
    await page.locator('a[href="/scenario/coffee/intro"]').first().click()
    await expect(page).toHaveURL('/scenario/coffee/intro')

    // Skip intro to get to countdown faster
    await page.waitForTimeout(2500)
    await page.click('text=Skip intro')

    // Wait for countdown and navigation to conversation
    await page.waitForURL('**/conversation', { timeout: 10000 })

    // On conversation page
    await expect(page.locator('h1:has-text("Coffee Shop")')).toBeVisible()

    // End conversation
    await page.click('button:has-text("End")')

    // Wait for redirect to review
    await page.waitForURL('**/review/**', { timeout: 10000 })

    // Should be on review page
    expect(page.url()).toContain('/review/')
  })
})
