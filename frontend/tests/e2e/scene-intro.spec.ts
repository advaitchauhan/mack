import { test, expect } from '@playwright/test'

test.describe('Scene Intro', () => {
  test('should load coffee shop intro page', async ({ page }) => {
    await page.goto('/scenario/coffee/intro')

    // Should show narrative phase initially
    await expect(page.locator('text=Coffee Shop')).toBeVisible()
  })

  test('should display typewriter effect with narrative text', async ({ page }) => {
    await page.goto('/scenario/coffee/intro')

    // Wait for some text to appear (typewriter effect)
    await page.waitForTimeout(500)

    // Should have some narrative text visible
    await expect(page.locator('p.text-2xl, p.text-3xl').first()).toBeVisible()
  })

  test('should show progress dots for narrative lines', async ({ page }) => {
    await page.goto('/scenario/coffee/intro')

    // Should have progress indicator dots
    await expect(page.locator('.rounded-full.bg-rose-400, .rounded-full.bg-rose-500, .rounded-full.bg-gray-600').first()).toBeVisible()
  })

  test('should advance narrative on click', async ({ page }) => {
    await page.goto('/scenario/coffee/intro')

    // Wait for first line to complete
    await page.waitForTimeout(1500)

    // Click to advance
    await page.click('text=Next')

    // Wait a moment for transition
    await page.waitForTimeout(500)

    // Should advance to next line (check progress dot changed)
  })

  test('should show skip intro button', async ({ page }) => {
    await page.goto('/scenario/coffee/intro')

    // Wait for skip button to appear (has 2s delay)
    await page.waitForTimeout(2500)

    await expect(page.locator('text=Skip intro')).toBeVisible()
  })

  test('should skip to countdown when clicking Skip intro', async ({ page }) => {
    await page.goto('/scenario/coffee/intro')

    // Wait for skip button
    await page.waitForTimeout(2500)

    // Click skip intro
    await page.click('text=Skip intro')

    // Should see countdown phase with "You're approaching..."
    await expect(page.locator('text=approaching')).toBeVisible({ timeout: 3000 })
  })

  test('should show countdown numbers', async ({ page }) => {
    await page.goto('/scenario/coffee/intro')

    // Skip to countdown
    await page.waitForTimeout(2500)
    await page.click('text=Skip intro')

    // Should see countdown number (5, 4, 3, 2, or 1)
    await expect(page.locator('text=/^[1-5]$/').first()).toBeVisible({ timeout: 3000 })
  })

  test('should show avatar during countdown', async ({ page }) => {
    await page.goto('/scenario/coffee/intro')

    // Skip to countdown
    await page.waitForTimeout(2500)
    await page.click('text=Skip intro')

    // Should see avatar image (name is hidden for realism - user doesn't know name until they ask)
    await expect(page.locator('img[alt="Person you\'re approaching"]')).toBeVisible({ timeout: 3000 })
  })

  test('should navigate to conversation after countdown completes', async ({ page }) => {
    await page.goto('/scenario/coffee/intro')

    // Skip to countdown
    await page.waitForTimeout(2500)
    await page.click('text=Skip intro')

    // Wait for countdown to complete (5 seconds) + navigation
    await page.waitForURL('**/conversation', { timeout: 10000 })

    // Should be on conversation page
    expect(page.url()).toContain('/scenario/coffee/conversation')
  })

  test('should work for bar scenario', async ({ page }) => {
    await page.goto('/scenario/bar/intro')

    await expect(page.locator('text=Bar Setting')).toBeVisible()
  })

  test('should work for restaurant scenario', async ({ page }) => {
    await page.goto('/scenario/restaurant/intro')

    await expect(page.locator('text=Restaurant Group')).toBeVisible()
  })

  test('should work for transit scenario', async ({ page }) => {
    await page.goto('/scenario/transit/intro')

    await expect(page.locator('text=Public Transit')).toBeVisible()
  })

  test('should work for street scenario', async ({ page }) => {
    await page.goto('/scenario/street/intro')

    await expect(page.locator('text=Street Approach')).toBeVisible()
  })

  test('should show 404 for invalid scenario', async ({ page }) => {
    await page.goto('/scenario/invalid-scenario/intro')

    await expect(page.locator('text=Scenario not found')).toBeVisible()
  })
})
