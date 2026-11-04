# 09 — Base demonstrativa sintética

A base do protótipo é **100% sintética e realista**. Nenhum dado real de cliente,
colaborador, planilha ou relatório da empresa é utilizado, persistido ou exibido.

## Princípios

- Clientes, colaboradores, equipamentos, operações e relatórios são fictícios.
- IDs seguem formatos operacionais plausíveis: telemetria/Pulsus com 4 dígitos
  (zeros à esquerda preservados), IMEI de câmera/Galileo com 15 dígitos.
- Datas são relativas ao momento em que a base é gerada, mantendo o fluxo de prazos vivo.
- Envios, lembretes, notificações e sincronização são **simulados e rotulados**.
- Aprovações nunca são presumidas: relatórios entram no fluxo humano real.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `src/data/seed.ts` | Usuários, clientes, caminhões, equipamentos, relatórios de viagem, notificações e domínio do motorista |
| `src/data/demoOperations.ts` | Operações de campo sintéticas + equipamentos de cliente derivados |
| `src/data/demoReports.ts` | Visita técnica, atividade externa e consolidado semanal estruturados |

## Formatos de IDs

| Campo | Formato | Exemplo |
|---|---|---|
| Equipamento de cliente | `[A-Z]{2,4}-[A-Z0-9]{2,6}` | `SA-101`, `VA-205` |
| Telemetria | 4 dígitos | `0187`, `0035` |
| Tablet Pulsus | 4 dígitos | `2741`, `2309` |
| Câmera de fadiga | IMEI 15 dígitos | `864993060408250` |
| Galileo / rotograma | 15 dígitos | `867782071392430` |

## Limites

- A base não representa a operação real da SAFIP; serve apenas para demonstrar o fluxo.
- Campos ausentes em operações reais não são inferidos; o modelo foi desenhado para
  aceitá-los quando a empresa optar por importar dados reais em produção.
- Imagens de campo são sintéticas (`public/demo/`), não são fotos reais da empresa.
