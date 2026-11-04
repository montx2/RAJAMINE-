# TCC — dois formatos disponíveis

| Formato | Arquivo | Quando usar |
| --- | --- | --- |
| **ABNT com capa e sumário** | `TCC_Rajamine_FieldOps_ABNT.pdf` / `.docx` | 23 páginas, texto enxuto e **25 figuras** do sistema. É a versão para quem quer ver o produto. |
| Artigo científico (NBR 6022) | `TCC_Rajamine_FieldOps.pdf` / `.docx` | 8 páginas, texto corrido, 3 figuras. Para submissão como artigo. |

Ambos são gerados por script a partir de uma fonte única: editar o texto em um
lugar mantém PDF e DOCX sincronizados.

## Versão ABNT com capa e sumário

Estrutura conforme NBR 14724: **capa, folha de rosto, sumário**, parte textual
(1 Introdução, 2 Objetivo, 3 Metodologia, 4 A solução em telas, 5 Portal do
motorista, 6 Preenchimento pelo colaborador, 7 Verificação, 8 Considerações
finais) e **referências**.

O texto é deliberadamente curto — cerca de 1.580 palavras em 23 páginas — porque
o argumento é carregado pelas figuras. São 25 capturas reais do protótipo em
execução, com dados sintéticos, cobrindo acesso, painel, link individual,
carteira, padronização lado a lado, OCR com conferência humana, revisão,
histórico, os dois PDFs, arquivo, operações, consolidado semanal, equipamentos,
frota, ocorrências, cadastros, tema escuro e o portal do motorista no celular.

### Arquivos

| Caminho | O que é |
| --- | --- |
| `TCC_Rajamine_FieldOps_ABNT.pdf` | documento final, 23 páginas |
| `TCC_Rajamine_FieldOps_ABNT.docx` | mesmo conteúdo, editável no Word |
| `gerar_tcc_visual.py` | conteúdo + geradores de PDF e DOCX (fonte única) |
| `figuras_tcc/` | 27 capturas preparadas, em 2× para impressão |
| `figuras/` | capturas brutas, antes do reenquadre (não versionado) |

### Regenerar

Só o documento, a partir das figuras já preparadas:

```bash
python3 tcc/gerar_tcc_visual.py
```

Requer `reportlab`, `python-docx`, `pymupdf` e `Pillow`.

Para refazer as capturas do zero (precisa do sistema rodando em `localhost:5173`
e do Chromium de auditoria instalado):

```bash
node .audit/capturas_tcc.mjs        # 25 telas de gestão e celular
node .audit/capturas_checklist.mjs  # checklist em 6/6, sem sobreposições
node .audit/capturas_docs.mjs       # dois PDFs gerados e arquivados
python3 .audit/prepara_figuras.py   # reenquadre e corte para a mancha A4
python3 tcc/gerar_tcc_visual.py
```

### Detalhes de formatação

A4; margens 3 cm (superior/esquerda) e 2 cm (inferior/direita); Times 12;
espaçamento 1,5 no corpo e simples em legendas, fontes e referências; recuo de
1,25 cm na primeira linha. Numeração no canto superior direito **a partir da
primeira página textual** — capa, folha de rosto e sumário são contadas mas não
numeradas (NBR 14724, 5.2). Legendas acima da figura e fonte abaixo, em 10 pt
(NBR 14724, 5.8). Sumário conforme NBR 6027.

O sumário é resolvido em **duas passadas**: a primeira coleta a página real de
cada título, a segunda imprime os números. Como o número de linhas do sumário não
muda entre as passadas, a paginação permanece estável. Todas as 31 entradas foram
conferidas contra a página real.

Título, texto e figura ficam no mesmo bloco coeso, para não deixar título órfão
no pé da página. Telas de celular aparecem em pares lado a lado.

### Antes de entregar

Preencher os campos entre colchetes em `gerar_tcc_visual.py`: `AUTOR`,
`ORIENTADOR`, `INSTITUICAO`, `CURSO` e o `[GRAU]` da natureza do trabalho. Se a
instituição tiver manual próprio, ele prevalece sobre a NBR.

## Artigo científico (8 páginas)

| Caminho | O que é |
| --- | --- |
| `TCC_Rajamine_FieldOps.pdf` / `.docx` | artigo final |
| `gerar_artigo.py` | fonte única do artigo |
| `figuras_artigo/` | 3 capturas |
| `monografia-45-paginas/` | gerador da versão longa anterior, reproduzível |

```bash
python3 tcc/gerar_artigo.py
```

Citações autor-data (NBR 10520), referências em ordem alfabética (NBR 6023),
resumo e *abstract* em parágrafo único com palavras-chave. Preencher `AUTOR` e
`FILIACAO` antes de entregar.

## Conteúdo e verificação

Os números citados são medidos, não estimados: **99 testes automatizados** em 13
arquivos, **49 capturas** em Chromium real (1440×900, 1280×720, 768×1024 e
390×844, claro e escuro, pt-BR) e **16 verificações funcionais** de ponta a ponta.
A Tabela 2 do artigo lista 6 defeitos encontrados na auditoria, com causa e
correção.

A base de dados do sistema é inteiramente sintética; nenhuma informação pessoal
ou operacional real foi utilizada. Envios, notificações e sincronização são
simulados e rotulados como tal na interface.
