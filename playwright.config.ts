import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests drive the real game in a real browser, with real touch
 * events: the gesture handling, the animation loop and the canvas painting
 * only come together there.
 */

// Some environments ship a browser outside Playwright's own cache.
const executablePath: string | undefined =
  process.env['PLAYWRIGHT_CHROMIUM_PATH'];

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  // The game is timing sensitive, so parallel runs would fight for the CPU
  // and make the drop rate unreliable.
  workers: 1,
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:4200',
    browserName: 'chromium',
    // A phone viewport with touch, which is how the game is played.
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'npm run start -- --port 4200',
        url: 'http://127.0.0.1:4200',
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
