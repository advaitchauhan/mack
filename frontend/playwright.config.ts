import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Mack E2E tests
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // The app requires sign-in. Set E2E_ACCESS_TOKEN to a Supabase access
    // token for a test user to run the suite.
    extraHTTPHeaders: process.env.E2E_ACCESS_TOKEN
      ? { Authorization: `Bearer ${process.env.E2E_ACCESS_TOKEN}` }
      : undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
