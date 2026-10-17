import { expect, test } from '@playwright/test';
import path from 'node:path';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Fahh, pad 3/ })).toBeEnabled();
});

test('loads without broken sample requests and adapts to the viewport', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('[data-pad-id]')).toHaveCount(25);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/studio-${test.info().project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('keyboard plays, loops stop on a second hit, and Escape stops everything', async ({ page }) => {
  await page.getByRole('switch', { name: 'Repetir em loop' }).check();
  await page.getByRole('heading', { level: 1 }).click();
  await page.keyboard.press('1');
  await expect(page.locator('[data-pad-id="0"]')).toHaveAttribute('data-active', 'true');
  await page.keyboard.press('1');
  await expect(page.locator('[data-pad-id="0"]')).toHaveAttribute('data-active', 'false');
  await page.keyboard.press('1');
  await expect(page.locator('[data-pad-id="0"]')).toHaveAttribute('data-active', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-active="true"]')).toHaveCount(0);
});

test('editing never triggers shortcut sounds and settings survive reload', async ({ page }) => {
  await page.getByLabel('Nome do pad').fill('Minha vinheta');
  await expect(page.locator('[data-active="true"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('djpad-settings-v1'))).toContain('Minha vinheta');
  await page.reload();
  await expect(page.getByLabel('Nome do pad')).toHaveValue('Minha vinheta');
  await page.getByRole('button', { name: 'Modo tocar' }).click();
  await page.locator('[data-pad-id="2"]').click();
  await expect(page.getByLabel('Nome do pad')).toHaveValue('Fahh');
  await expect(page.locator('[data-active="true"]')).toHaveCount(0);
});

test('imports, persists, plays and removes a custom sample', async ({ page }) => {
  await page.locator('[data-pad-id="7"]').click();
  await page.getByLabel('Arquivo de áudio para o pad').setInputFiles(path.join(process.cwd(), 'public/sounds/airhorn.mp3'));
  await expect(page.getByLabel('Nome do pad')).toHaveValue('airhorn');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('djpad-settings-v1'))).toContain('airhorn');
  await page.reload();
  await page.locator('[data-pad-id="7"]').click();
  await expect(page.locator('[data-pad-id="7"]')).toHaveAttribute('data-active', 'true');
  await page.getByRole('button', { name: 'Parar tudo' }).click();
  await page.getByRole('button', { name: 'Restaurar este pad' }).click();
  await page.getByRole('button', { name: 'Restaurar pad', exact: true }).click();
  await expect(page.locator('[data-pad-id="7"]')).toHaveAccessibleName(/vazio/);
  await page.reload();
  await expect(page.locator('[data-pad-id="7"]')).toHaveAccessibleName(/vazio/);
});

test('failed audio loads show a useful message and allow a retry', async ({ page }) => {
  await page.route('**/sounds/fahh.mp3', route => route.fulfill({ status: 404 }));
  await page.locator('[data-pad-id="2"]').click();
  await expect(page.getByRole('alert', { name: 'Aviso do estúdio' })).toContainText('Não foi possível carregar');
  await expect(page.locator('[data-pad-id="2"]')).toHaveAttribute('data-active', 'false');
  await page.unroute('**/sounds/fahh.mp3');
  await page.locator('[data-pad-id="2"]').click();
  await expect(page.locator('[data-pad-id="2"]')).toHaveAttribute('data-active', 'true');
});

test('rejects invalid uploads without replacing the current sound', async ({ page }) => {
  await page.getByLabel('Arquivo de áudio para o pad').setInputFiles({ name: 'not-a-sound.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.getByRole('alert', { name: 'Aviso do estúdio' })).toContainText('Escolha um arquivo de áudio');
  await expect(page.getByLabel('Nome do pad')).toHaveValue('Cê pagaria?');
});
