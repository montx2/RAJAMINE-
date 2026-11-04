import { test, expect } from '@playwright/test';

/* Portal do Motorista — fluxo demonstrativo (CI/local com chromium). */

test('motorista faz checklist com falha e coordenação resolve ocorrência', async ({ page }) => {
  await page.goto('/login');
  await page.getByText('João Batista').click();
  await expect(page.getByText('Meus caminhões')).toBeVisible();

  await page.getByRole('link', { name: /Continuar checklist|Iniciar checklist|Ver checklist/ }).first().click();
  await expect(page.getByText(/Checklist automático/)).toBeVisible();

  // Marca tudo OK e depois coloca uma falha num item de equipamento.
  await page.getByRole('button', { name: 'Marcar tudo OK' }).click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  const falhaButtons = page.getByRole('button', { name: 'Falha', exact: true });
  await falhaButtons.last().click();
  await page.getByRole('button', { name: /Enviar checklist/ }).click();
  await expect(page.getByText(/ocorrência\(s\) aberta\(s\) automaticamente|Checklist enviado/)).toBeVisible();

  await page.goto('/motorista/ocorrencias');
  await expect(page.getByText(/OCO-2026-/).first()).toBeVisible();

  // Troca para coordenação (logout pelo shell do motorista).
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.getByText('Helena Duarte').click();
  await page.goto('/ocorrencias');
  await expect(page.getByText('Ocorrências de motoristas')).toBeVisible();
  await page.getByText(/OCO-2026-/).first().click();
  await page.getByLabel('Resposta ao motorista').fill('Equipe de campo acionada; suporte validado.');
  await page.getByRole('button', { name: 'Resolver' }).click();
  await expect(page.getByText(/atualizada/)).toBeVisible();
});

test('ciência de treinamento exige nome digitado', async ({ page }) => {
  await page.goto('/login');
  await page.getByText('João Batista').click();
  await page.goto('/motorista/treinamento');
  await page.getByRole('button', { name: 'Registrar ciência' }).first().click();
  await page.getByLabel('Digite seu nome completo').fill('João Batista');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirmar ciência' }).click();
  await expect(page.getByText('Ciência registrada. Obrigado!')).toBeVisible();
});
