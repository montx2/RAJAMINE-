# 05 — Inteligência Artificial, OCR e Geração de PDFs

## 1. Padronização de textos (implementado)

### Contrato de integridade (inegociável)
1. A IA **nunca inventa** fatos, horários, locais, equipamentos ou resultados de testes.
2. O texto original é **preservado** (primeira versão imutável; demais versões append-only).
3. Toda transformação é **listada com motivo** e comparável em diff palavra a palavra.
4. O usuário **aceita, edita ou rejeita** — nada é aplicado silenciosamente.
5. Informações ausentes viram **alertas**, nunca preenchimento automático.

### Implementação atual: motor local de regras (`services/padronizacao.ts`)
- Dicionário de ~70 verbos em 1ª pessoa (singular/plural, pretérito/presente/futuro) → 3ª pessoa;
- Pronomes e possessivos (`eu`, `nós`, `meu/minha`, `comigo`), reflexivos (`me desloquei` → `deslocou-se`);
- Gramática: crase antes de horas (`as 8h` → `às 8h`), acentuação (`numero`→`número`), unidades (`80km`→`80 km`);
- Estilo: oralidade (`pra`, `tava`, `né`), jargão (`ok` → `em conformidade`);
- Sujeito explícito na abertura (`Cheguei…` → `O técnico chegou…`);
- Alertas de completude/inconsistência: campos vazios, data futura, origem=destino, KM invertido, equipamento sem código, placa divergente, ausência de menção a testes.

**Por que regras e não LLM no protótipo?** Determinismo (demonstração reproduzível), custo zero, privacidade total (roda no navegador) e auditabilidade — cada mudança tem motivo explícito. O motor é honestamente rotulado como "demonstrativo".

### Evolução para LLM (produção)
Mesmo contrato, com prompt estruturado que devolve JSON `{sugerido, mudancas[], alertas[]}`; validação Zod da resposta; recusa de qualquer token novo que pareça fato (números/códigos/horários devem existir no original); temperatura 0; log do prompt/resposta para auditoria. Pode ser API comercial ou modelo aberto auto-hospedado conforme política de dados da empresa. O diff e o fluxo aceitar/editar/rejeitar permanecem idênticos.

## 2. OCR de equipamentos

### Requisitos do campo
Fotos com sujeira, reflexo, ângulo, baixa luz, etiquetas pequenas. O sistema precisa: extrair candidatos, indicar confiança, comparar com o cadastro e **exigir confirmação humana**.

### PaddleOCR × Tesseract (análise)

| Critério | **Tesseract.js 7** (escolhido p/ protótipo) | **PaddleOCR** (recomendado p/ servidor) |
|---|---|---|
| Licença | Apache-2.0 | Apache-2.0 |
| Manutenção (verificada 03/11/2026) | Ativa (engine Tesseract + wrapper naptha) | Muito ativa (92k★, toolkit PP-OCRv5/PP-Structure) |
| Execução | **Navegador (WASM)** e Node | Python (GPU/CPU), servidor |
| Precisão em texto difícil | Boa em etiquetas limpas; sofre com ruído/ângulo | Melhor detecção de texto em cena (DB detector) e ângulos; modelos leves PP-OCRv5 mobile |
| Custo | **Zero** (local, sem servidor) | Servidor Python + possivelmente GPU; custo de infra |
| Implantação com equipe SENAI | `npm install` + assets locais | Stack Python separada, modelos, mais operação |
| Privacidade | **Imagem não sai do dispositivo** | Imagem enviada ao servidor (controlado) |
| Dependências | ~45 MB de assets locais | PaddlePaddle + modelos (centenas de MB) |

**Decisão:** Tesseract.js no protótipo (e como opção padrão em produção pelo custo/privacidade); PaddleOCR como **worker server-side opcional** para fotos de baixa qualidade e reprocessamento em lote — a interface já separa `motor` por leitura, então a troca é transparente. A escolha não foi por popularidade: foi pelo equilíbrio precisão×custo×implantação×privacidade no contexto real.

### Pipeline implementado (`services/ocr.ts`) — validado empiricamente
1. **Pré-processamento**: escala ≤1600px, tons de cinza, expansão de contraste por percentis (2–98%).
2. **Detecção de etiqueta**: componentes conexos em máscara reduzida (360px) — mancha clara, compacta (fill>0.5), aspecto 1–5, sem tocar bordas → recorte com padding.
3. **Multi-pass**: imagem completa em PSM 6 (bloco) e PSM 11 (esparso) + recorte nos dois modos (4 passes).
4. **Extração**: padrões `EQ-XXXX` (com correção O→0, I→1, S→5…), leitura degradada `Q-XXXX` (E perdido, penalizada), `SN XXXXX`, números isolados.
5. **Mesclagem**: candidatos únicos com boost de concordância entre passes (+6 por passe adicional).
6. **Matching com cadastro**: código exato, série, sufixo numérico (`2041` → EQ-2041) — sempre como sugestão; conflito de caminhão alertado.
7. **Conferência humana**: confirmar / corrigir / rejeitar; só então associa ao caminhão e registra autor/data.

Resultados medidos nas fotos demo (Node, mesmo modelo): EQ-1087 lido diretamente; EQ-2041 recuperado via `Q-2041` + série 88231; EQ-3315 (etiqueta suja) permanece baixa confiança → **exige conferência**, exatamente o comportamento desejado. `scripts/ocr-smoke.mjs` reproduz a medição.

### Fallback demonstrativo
Se o WASM não carregar (dispositivo sem suporte), o botão "Simular leitura" gera resultado **rotulado `motor: 'demo'`** — nunca se passa por OCR real. Leituras do seed também são `demo`.

## 3. Geração de PDFs

### Puppeteer × pdf-lib (análise)

| Critério | **pdf-lib** (escolhido) | **Puppeteer** |
|---|---|---|
| Licença | MIT | Apache-2.0 |
| Manutenção | Estável (último push 2024; API madura, amplamente usada) | Muito ativa |
| Execução | **Navegador e Node**, sem binários | Requer Chromium (~300 MB) no servidor |
| Layout | Desenho programático (controle total, mais trabalhoso) | HTML/CSS → PDF (rico, rápido de estilizar) |
| Custo/infra | Zero | Processo de browser por job; fila necessária |
| Adequação ao protótipo | **Perfeita**: PDFs reais sem backend | Inviável no navegador |

**Decisão:** pdf-lib no protótipo (documentos reais, determinísticos, com fotos embutidas no interno). Em produção, Puppeteer no worker para templates HTML mais ricos (mesma fonte de dados), mantendo pdf-lib para carimbo de verificação, merge e marca d'água.

### Estrutura dos documentos
- **Cliente**: dados da viagem → descrição padronizada → equipamentos validados → bloco "APROVADO PARA ENVIO" com autor/data/código de verificação. **Sem fotos internas.**
- **Interno**: tudo do cliente + registro fotográfico (legendas, marcação de imagem demo) → leituras OCR com confiança e resultado da conferência → **texto original preservado** → notas de revisão → histórico completo.
- Rodapé em todas as páginas: código de verificação (hash dos campos aprovados — identificado como mecanismo de protótipo, não assinatura digital ICP-Brasil), paginação, aviso de uso.
