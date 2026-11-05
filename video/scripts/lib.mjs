import { chromium as pw } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';

export async function launch({ width = 1600, height = 900, dsf = 1 } = {}) {
  const executablePath = await sparticuz.executablePath();
  const browser = await pw.launch({
    executablePath,
    headless: true,
    args: [
      ...sparticuz.args.filter((a) => !a.startsWith('--single-process')),
      '--font-render-hinting=none',
      '--force-device-scale-factor=' + dsf,
      '--disable-lcd-text',
      '--force-color-profile=srgb',
    ],
  });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dsf,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  });
  return { browser, context };
}

export async function login(page, nome) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
  await page.getByRole('button', { name: new RegExp(nome) }).first().click();
  await page.waitForTimeout(1200);
}
