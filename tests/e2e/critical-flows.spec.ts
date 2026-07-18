import { expect, test } from '@playwright/test';

test.describe('Critical E2E flows v1.0', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**://placeholder.supabase.co/**', async route => {
      const url = route.request().url();

      if (url.includes('/auth/v1/signup')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 'u1', email: 'demo@wow.com' }, session: null }),
        });
        return;
      }

      if (url.includes('/auth/v1/user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: null }),
        });
        return;
      }

      if (url.includes('/auth/v1/token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ access_token: 'token', token_type: 'bearer', user: null }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });
  });

  test('registro dispara signup en Supabase', async ({ page }) => {
    await page.goto('/auth?mode=register');

    await page.locator('input[placeholder="Juan Pérez"]').fill('QA Demo');
    await page.locator('input[placeholder="tu@correo.com"]').first().fill('qa-demo@example.com');
    await page.locator('input[placeholder="Mínimo 8 caracteres"]').fill('Password123');
    await page.locator('#terms').check();

    const signupRequest = page.waitForRequest(req => req.url().includes('/auth/v1/signup'));

    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    const req = await signupRequest;
    expect(req.method()).toBe('POST');
  });

  test('checkout permite avanzar hasta registro tras confirmar pago', async ({ page }) => {
    await page.goto('/checkout/negocio');

    await page.getByRole('button', { name: 'Continuar al pago' }).click();
    await page.getByLabel('Yape').check();
    await page.getByRole('button', { name: 'Continuar con el pago' }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'proof.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-content'),
    });

    await page.getByRole('button', { name: 'He realizado el pago' }).click();

    await expect(page.getByText('¡Pago Confirmado!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear cuenta y Finalizar' })).toBeVisible();
  });
});
