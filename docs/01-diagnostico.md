# 01 — Diagnóstico, Proposta e Diferenciais

## 1. O processo atual (conforme o desafio)

```
Viagem realizada → link enviado ao colaborador (prazo 2 dias) → preenchimento livre
→ revisão manual (1ª→3ª pessoa, gramática, padronização) → geração manual de 2 documentos
→ identificação visual dos nºs de equipamentos nas fotos → registro manual em planilha
→ envio ao cliente + arquivamento
```

## 2. Gargalos identificados

| # | Gargalo | Consequência | Como o FieldOps resolve |
|---|---|---|---|
| G1 | Texto livre em 1ª pessoa, com erros e oralidade | Retrabalho de revisão a cada relatório | Motor de padronização com diff visual; aceitar/editar/rejeite em 1 clique |
| G2 | Prazo de 48 h sem acompanhamento | Atrasos descobertos tarde | Dashboard de prazos, badges de atraso, lembretes (simulados no protótipo) |
| G3 | Nºs de equipamentos lidos olho a olho | Erros de transcrição; planilha desatualizada | OCR real com confiança + matching com cadastro + confirmação humana |
| G4 | Dois documentos montados manualmente | Inconsistência entre versões; tempo | Geração automática dos 2 PDFs a partir da MESMA fonte de dados aprovada |
| G5 | Sem trilha de quem alterou o quê | Risco de auditoria e retrabalho | Histórico por evento (autor, data, detalhe); originais imutáveis |
| G6 | Fotos e documentos espalhados | Busca lenta por cliente/equipamento/período | Arquivo central com filtros cruzados (código, EQ, placa, cliente, período) |
| G7 | Risco de envio sem revisão | Informação errada ao cliente | Bloqueio técnico: PDF do cliente exige aprovação humana registrada |

## 3. Proposta tecnológica (produto, não planilha)

Um fluxo único com **estados explícitos**:

```
pendente → rascunho → em_revisao → [correcao ⇄ em_revisao] → aprovado → arquivado → enviado(simulado)
```

- **Colaborador**: recebe link individual (token), preenche em 4 passos no celular, anexa fotos, roda OCR, aceita/recusa a padronização e envia.
- **Revisora**: fila ordenada por chegada, checklist automático (dados, OCR pendente, hodômetro), comparação original × vigente, notas, aprovação ou devolução.
- **Administrador**: cadastros, criação de relatórios, prazos, indicadores e arquivo.
- **Sistema**: validações, auditoria, geração dos PDFs, organização do arquivo, notificações.

## 4. Diferenciais inovadores (com justificativa operacional)

1. **OCR no dispositivo (edge)** — as fotos são analisadas no próprio navegador (WASM). Menor custo de servidor, funciona com conectividade ruim após o carregamento e **minimiza o tratamento de dados** (LGPD, art. 6º, III): a imagem não precisa sair do celular para o reconhecimento.
2. **Pipeline multi-pass para fotos de campo** — imagem completa + recorte automático da etiqueta (detecção de mancha clara compacta) em dois modos de segmentação; candidatos mesclados com boost de concordância. Lida com sujeira, reflexo e ângulo — e **não maquia a confiança**.
3. **Matching com o cadastro** — o número lido é comparado a códigos e séries existentes (inclusive sufixo numérico e leitura degradada "Q-2041"), sugerindo a associação correta e **alertando conflitos** (equipamento registrado em outro caminhão).
4. **IA com contrato de integridade** — a padronização só reescreve o que foi escrito; cada transformação é listada com motivo; o original é preservado; inconsistências (KM, datas, placas, equipamento sem código) são apontadas, nunca "corrigidas" por invenção.
5. **Aprovação humana como porta de saída** — o documento do cliente é tecnicamente bloqueado até aprovação com autor/data; OCR pendente bloqueia a aprovação.
6. **Dois PDFs, uma fonte de verdade** — cliente e interno saem dos mesmos dados aprovados; o interno carrega fotos, OCR, texto original e auditoria.
7. **Auditoria de ponta a ponta** — criação, edição, confirmação de equipamento, revisão, geração e envio: tudo com autor e timestamp.

## 5. O que NÃO fizemos de propósito

- Não eliminamos a revisão humana (requisito do desafio e boa prática).
- Não tratamos OCR como verdade: toda leitura nasce "aguardando conferência".
- Não disparos reais: links, lembretes e envios são simulados e rotulados.
- Não prometemos "conformidade LGPD pronta": o mapa legal separa o que é técnica do que é decisão jurídica da empresa.

## 6. Requisitos operacionais modelados

O material enviado pela empresa mudou o centro de gravidade do produto:

- **Equipamento do cliente, não apenas caminhão.** Códigos como `SA-101`, `VA-205`, `SR-305` são a chave operacional. O caminhão é vínculo opcional.
- **Dispositivos embarcados têm IDs próprios.** Telemetria (4 dígitos com zeros à esquerda), tablet **Pulsus**, **câmera de fadiga** (IMEI 15 dígitos) e **Galileo/rotograma**. O sistema preserva zeros à esquerda e valida tamanho de IMEI.
- **Atividades tipificadas.** Instalação, desmobilização, manutenção, conferência e coleta de telemetria.
- **Transferência × erro.** Os mesmos IDs em instalação e desmobilização no mesmo dia são sinalizados como possível transferência legítima, nunca “corrigidos” automaticamente.
- **Consolidado semanal.** Agrupamento por cliente/período com checagem de datas; o documento real tinha atividades fora do período informado, e o sistema alerta sem alterar o original.
- **Identidade visual.** Grafite/preto + amarelo-segurança da SAFIP substituiu o azul genérico, mantendo contraste AA e o design system acessível.

Detalhamento da base sintética em [09-dados-demo.md](09-dados-demo.md).
