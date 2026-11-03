# 09 — Referências reais fornecidas pela Rajamine (set/2026)

Este documento registra **o que foi aprendido com o material real** enviado pela empresa e **como isso corrigiu o protótipo**. As imagens originais não são commitadas no repositório (privacidade); o que persiste é a transcrição estruturada em `src/data/referencias.ts`, marcada como `origemDados: 'referencia_empresa'`.

## 1. Material recebido

| Arquivo (referência) | Conteúdo | Uso no produto |
|---|---|---|
| Planilha “Instalações/Manutenções/Retiradas — Equipamentos” | 15 linhas MFS 22/09/2026: Data, Empresa, Técnico, Equipamento, Telemetria, Pulsus, Câmera de fadiga, Atividade, Observação, Situação Telemetria, Fotos | Tela **Operações de campo**, modelo `OperationRow`/`ActivityEntry`, export CSV, alertas de consistência |
| Relatório de Atividade Externa | Consultor, Setor, Empresa, Cidade/Bairros, Período, Objetivo, Serviços realizados, Sensação do cliente, Pontos positivos e melhorias | Campos do formulário, PDF interno, seções de percepção/melhorias |
| Relatório de Visita Técnica | Empresa, Consultor, Período, Objetivo da visita, Atividades por equipamento (CP-101, CP-5015, ESC-49), Avaliação técnica | PDF do cliente, atividades estruturadas, IDs reais |
| Relatório Semanal — Viagens | Consolidação por cliente (AMDA, FDX), período 21–25/09, atividades por dia/equipamento | Tela **Consolidado semanal**, `buildWeeklyPdf`, alerta de atividade fora do período |
| Mensagem de envio de link | “Relatório da viagem para a MFS dos dias 22/09 e 23/09/2026, favor preencher” + link 1drv | Confirma fluxo de link individual e período multi-dia; envio segue **simulado** no protótipo |

## 2. Correções de domínio aplicadas

1. **Equipamento ≠ caminhão.** A operação real é centrada no equipamento do cliente (`CP-101`, `TYE-9A00`, `RUU-1G56`, `ESC-49`). O caminhão passou a ser **opcional** no relatório e no cadastro.
2. **Dispositivos embarcados com IDs próprios.** Telemetria (4 dígitos, com zeros à esquerda: `0987`, `0035`), tablet **Pulsus** (`2758`), **câmera de fadiga** (IMEI 15 dígitos: `864993060408250`) e **Galileo/rotograma** (`867782071392430`). O modelo `DeviceIds` e o OCR foram ampliados para esses padrões.
3. **Atividades tipificadas.** Instalação, desmobilização, manutenção, conferência, coleta de telemetria. A planilha real virou linhas estruturadas, não texto livre apenas.
4. **Transferência legítima sinalizada, não “erro”.** CP-101 (instalação) e CP-5015 (desmobilização) compartilham telemetria 0987 / Pulsus 2758 / câmera 864993060408250 no mesmo dia. O sistema alerta como possível transferência e pede confirmação humana — não apaga nem “corrige” os IDs.
5. **Substituições preservadas.** Observações como “Telemetria antiga: 0995” e “Tablet antigo: 2296” geram alerta de histórico do dispositivo anterior.
6. **Consolidado semanal com checagem de período.** O documento real informa período 21–25/09 mas lista atividades de 17/09 e 18/09. O protótipo **sinaliza a inconsistência** em vez de alterá-la silenciosamente.
7. **Identidade visual real.** Grafite/preto + amarelo/âmbar da marca Rajamine substituiu o azul genérico inicial. O amarelo puro é usado em marca/faixas; links e texto usam âmbar escuro para contraste AA.
8. **PDFs nos formatos reais.** Cliente: “Relatório de Visita Técnica” / “Atividade Externa” / “Semanal — Viagens”, sem fotos internas. Interno: fotos, OCR, texto original, sensação do cliente, pontos positivos/melhorias e histórico.

## 3. O que NÃO foi inferido nem inventado

- CNPJ, e-mail, contato e cidade de MFS/AMDA/FDX quando não constavam no material → campos vazios.
- Aprovações e envios dos documentos reais → relatórios de referência entram como **em revisão**, sem `aprovadoEm` presumido.
- Fotos originais da planilha → marcadas como “Enviadas” na transcrição, mas os arquivos não foram anexados; nenhuma foto demo é apresentada como foto real da empresa.
- Galeria demonstrativa ampliada para **14 imagens sintéticas** (`public/demo/`): etiquetas EQ/CP, câmera de fadiga, câmera externa, tablet Pulsus, Galileo/rotograma, sensor de carga, chicote, checklist e caminhão na mina. O seed distribui imagens diferentes por relatório para evitar repetição, e o painel de Fotos & OCR bloqueia reanexar a mesma imagem no mesmo relatório.
- Situação de telemetria quando a coluna estava vazia → `nao_informada`, mesmo que a observação cite dispositivo antigo.

## 4. Privacidade e governança

- Os registros reais são identificados por `origemDados` e por badges “referência” na UI.
- A exportação JSON e a documentação deixam claro que a base é **mista** (sintética + referência), não uma base de produção.
- Antes de qualquer uso com dados reais em produção, a empresa deve validar bases legais, retenção, acesso e o checklist do `docs/06-legal.md`.
- Recomendação: não commitar imagens originais com dados pessoais; manter em storage privado com URLs assinadas quando o backend existir.

## 5. Onde ver no protótipo

- `/operacoes` — planilha real transcrita, filtros, alertas e CSV.
- `/semanal` — referência real + gerador de consolidado a partir de relatórios aprovados.
- `/relatorios/r_201` — visita técnica Cedro Mariana com atividades por equipamento.
- `/relatorios/r_203` — operações MFS 22/09/2026.
- `/relatorios/r_204` — consolidado semanal de referência (com alerta de período).
- `/equipamentos?q=0987` — busca por telemetria/Pulsus/IMEI real.
