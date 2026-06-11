import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'docs/test-results/US-006',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4300',
    trace: 'retain-on-failure',
    video: 'off',
  },
  webServer: [
    {
      command: 'firebase emulators:start --only firestore,auth --project acquaapp-dev',
      url: 'http://127.0.0.1:8080',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm start -- --host 127.0.0.1 --port 4300',
      url: 'http://127.0.0.1:4300',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          slowMo: 300,
        },
      },
    },
  ],
});
