import { test, expect } from '@playwright/test';

/* Fluxos principais do protótipo. Requer browsers instalados: npx playwright install chromium */

test('login demonstrativo e dashboard carregam KPIs', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Acesso de demonstração')).toBeVisible();
  await page.getByRole('button', { name: /Helena Duarte/ }).click();
  await expect(page.getByText('Relatórios registrados')).toBeVisible();
  await expect(page.getByText('Aguardando revisão').first()).toBeVisible();
  await expect(page.getByText('Prazos e pendências')).toBeVisible();
});

test('listagem de relatórios filtra por código de equipamento', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Helena Duarte/ }).click();
  await page.getByRole('link', { name: 'Relatórios' }).first().click();
  await page.getByLabel('Pesquisar relatórios').fill('EQ-2041');
  await expect(page.getByText('REL-2026-0143')).toBeVisible();
});

test('padronização de IA compara textos e aceita sugestão preservando original', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Marta Fonseca/ }).click();
  await page.goto('/relatorios/r_145?tab=texto');
  await expect(page.getByText('1ª pessoa detectada no texto')).toBeVisible();
  await expect(page.getByText('Sugestão padronizada')).toBeVisible();
  await page.getByRole('button', { name: 'Aceitar sugestão' }).click();
  await expect(page.getByText(/original foi preservado/i).first()).toBeVisible();
  await expect(page.getByText('Versões do texto')).toBeVisible();
});

test('aprovação bloqueada com OCR pendente; conferência humana libera', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Marta Fonseca/ }).click();
  await page.goto('/relatorios/r_145?tab=revisao');
  await page.getByRole('button', { name: 'Aprovar relatório' }).click();
  await page.getByRole('button', { name: 'Confirmar aprovação' }).click();
  await expect(page.getByText(/aguardando conferência humana/i).first()).toBeVisible();
});

test('link individual permite preenchimento sem login', async ({ page }) => {
  await page.goto('/login');
  await page.getByText('Abrir link individual do colaborador').click();
  await expect(page.getByText('Dados da visita / atividade')).toBeVisible();
  await expect(page.getByText(/link individual/i).first()).toBeVisible();
});

test('documento do cliente exige aprovação (bloqueio de geração)', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Marta Fonseca/ }).click();
  await page.goto('/relatorios/r_145?tab=documentos');
  await expect(page.getByText('Documentos bloqueados')).toBeVisible();
});

test('arquivo de documentos lista PDFs gerados', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Helena Duarte/ }).click();
  await page.goto('/documentos');
  await expect(page.getByText('REL-2026-0139').first()).toBeVisible();
  await expect(page.getByText('Cliente · sem fotos').first()).toBeVisible();
});

test('operações de campo mostram a base sintética e o consolidado semanal exige aprovação', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Helena Duarte/ }).click();
  await page.goto('/operacoes');
  await expect(page.getByText('SA-101').first()).toBeVisible();
  await expect(page.getByText('VA-205').first()).toBeVisible();
  await page.goto('/semanal');
  await expect(page.getByText('Consolidado semanal de viagens')).toBeVisible();
  await expect(page.getByText('Gerar consolidado a partir de relatórios aprovados')).toBeVisible();
});

test('perfil colaborador tem escopo restrito (menor privilégio)', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Carlos Menezes/ }).click();
  await expect(page.getByText('Meus relatórios')).toBeVisible();
  // Não vê central de revisão
  await expect(page.getByRole('link', { name: 'Central de Revisão' })).toHaveCount(0);
  // Acesso direto a relatório de outro colaborador é bloqueado
  await page.goto('/relatorios/r_144');
  await expect(page.getByText('Acesso restrito')).toBeVisible();
});
