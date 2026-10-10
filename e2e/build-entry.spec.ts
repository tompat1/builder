import { expect, test } from '@playwright/test';

const user = {
  id: 'usr_test',
  login: 'builder',
  name: 'Builder Test',
  email: '',
  role: 'member',
  hasPassword: true,
  avatarUrl: ''
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/content', async (route) => {
    await route.fulfill({ json: { entries: {} } });
  });
});

test('a signed-out Start building CTA opens the login page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Börja bygga' }).first().click();
  await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)build$/);
  await expect(page.getByRole('heading', { name: 'Välkommen hem.' })).toBeVisible();
});

test('a signed-in account with a saved house sees Continue building everywhere', async ({ page, isMobile }) => {
  await page.addInitScript(() => sessionStorage.setItem('builder.session', 'test-token'));
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ json: { user } });
  });
  await page.route('**/api/houses', async (route) => {
    await route.fulfill({
      json: {
        houses: [{
          id: 'hus_1234567890abcdef1234567890abcdef',
          name: 'My house',
          createdAt: '2026-10-10T10:00:00.000Z',
          createdBy: 'Builder Test'
        }]
      }
    });
  });

  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Meny' }).click();
  await expect(page.getByRole('button', { name: 'Fortsätt bygg' })).toHaveCount(3);
  await page.getByRole('button', { name: 'Fortsätt bygg' }).first().click();
  await expect(page).toHaveURL(/\/build$/);
});
