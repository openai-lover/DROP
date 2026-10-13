import { expect, test } from '@playwright/test';
import type { CampaignView } from '../../src/components/api';

test('an event opens and closes in place without refetching its rules', async ({ page }) => {
  // Only the public campaign response is a fixture. This test exercises rendered
  // time boundaries; it does not authenticate a user or fabricate a live award.
  const now = new Date('2030-01-01T12:00:00Z');
  await page.clock.install({ time: now });
  const campaign: CampaignView = {
    id: 'window-fixture', slug: 'window-fixture', title: 'Scheduled community drop',
    organizer: 'Browser QA', description: 'A public window boundary test.',
    gameType: 'CATCH', rewardType: 'USDC', rewardAmountAtomic: '100000',
    rewardDecimals: 6, maxRecipients: 2, remaining: 2, reservedCount: 0,
    startsAt: new Date(now.getTime() + 6_000).toISOString(),
    endsAt: new Date(now.getTime() + 20_000).toISOString(),
    claimDeadline: new Date(now.getTime() + 60_000).toISOString(),
    maxAttempts: 1, status: 'OPEN', rulesHash: `0x${'11'.repeat(32)}`,
    chainId: 10143, config: { catchPhrase: 'Catch your coffee.' },
  };
  let publicReads = 0;
  await page.route('**/api/campaigns/window-fixture', async route => {
    publicReads++;
    await route.fulfill({ json: { data: campaign } });
  });
  await page.goto('/d/window-fixture');
  await expect(page.getByRole('heading', { name: campaign.title, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Not accepting attempts/ })).toBeVisible();
  // Development Strict Mode may perform two initial effect reads. Neither the
  // opening nor closing timer should add another request after initialization.
  const initialReads = publicReads;
  expect(initialReads).toBeGreaterThan(0);
  await page.clock.runFor(11_000);
  await expect(page.getByRole('button', { name: /^Sign in to participate/ })).toBeVisible();
  await page.clock.runFor(11_000);
  await expect(page.getByRole('button', { name: /^Not accepting attempts/ })).toBeVisible();
  expect(publicReads).toBe(initialReads);
});

test('creator defaults leave a week to play and review all three dates before creating', async ({ page }) => {
  await page.goto('/dashboard/new');
  await expect(page.getByRole('heading', { name: 'Create a drop', exact: true })).toBeVisible();
  await page.getByLabel('Event title', { exact: true }).fill('A week of community play');
  await page.getByLabel('Organizer', { exact: true }).fill('Browser QA');
  await page.getByLabel('Share URL', { exact: true }).fill('week-of-community-play');
  await page.getByLabel('Description', { exact: true }).fill('A community event with a clearly reviewed play window.');
  await page.getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('button', { name: /^Next/ }).click();
  const values = await Promise.all(['Opens', 'Closes', 'Receipt deadline'].map(label => page.getByLabel(label, { exact: true }).inputValue()));
  const fromNowInDays = (value: string) => (new Date(value).getTime() - Date.now()) / 86_400_000;
  expect(fromNowInDays(values[1])).toBeGreaterThan(6);
  expect(fromNowInDays(values[1])).toBeLessThan(8);
  expect(fromNowInDays(values[2])).toBeGreaterThan(13);
  expect(fromNowInDays(values[2])).toBeLessThan(15);
  const formatted = await page.evaluate(dates => dates.map(value => new Date(value).toLocaleString('en')), values);
  await page.getByRole('button', { name: /^Next/ }).click();
  for (const [index, label] of ['Opens', 'Closes', 'Receipt deadline'].entries()) {
    const row = page.locator('.rules-list li').filter({ has: page.getByText(label, { exact: true }) });
    await expect(row).toContainText(formatted[index]);
  }
  await expect(page.getByText('This creates a draft only.', { exact: false })).toBeVisible();
});
