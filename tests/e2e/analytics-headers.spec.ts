import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('built headers allow the injected Web Analytics script and same-origin report', async ({ page }) => {
  const headers = readFileSync('dist/_headers', 'utf8');
  const policy = headers.match(/^ +Content-Security-Policy: (.+)$/m)?.[1];
  if (!policy) throw new Error('Missing Content-Security-Policy');
  expect(headers).not.toMatch(/no-transform/);

  const script = 'https://static.cloudflareinsights.com/beacon.min.js/test-version';
  await page.route(script, route => route.fulfill({
    contentType: 'text/javascript',
    body: "navigator.sendBeacon('/cdn-cgi/rum', 'synthetic');",
  }));
  await page.route('**/cdn-cgi/rum', route => route.fulfill({ status: 204 }));
  await page.route('**/analytics-policy-test', route => route.fulfill({
    headers: { 'content-type': 'text/html', 'content-security-policy': policy },
    body: `<!doctype html><script src="${script}"></script>`,
  }));
  const [response] = await Promise.all([
    page.waitForResponse(res => new URL(res.url()).pathname === '/cdn-cgi/rum' && res.request().method() === 'POST'),
    page.goto('/analytics-policy-test'),
  ]);
  expect(response.status()).toBe(204);
});
