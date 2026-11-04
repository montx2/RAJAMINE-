# TCC — artigo científico (ABNT NBR 6022)

Versão entregue: **artigo de 8 páginas**, em PDF e DOCX, com capturas reais do
sistema auditado. Substitui a monografia de 45 páginas, cujo gerador foi
arquivado em `monografia-45-paginas/` (permanece reproduzível).

## Arquivos

| Caminho | O que é |
| --- | --- |
| `TCC_Rajamine_FieldOps.pdf` | artigo final, 8 páginas |
| `TCC_Rajamine_FieldOps.docx` | mesmo conteúdo, editável no Word |
| `gerar_artigo.py` | conteúdo + geradores de PDF e DOCX (fonte única) |
| `figuras_artigo/` | 3 capturas reais do artefato em navegador |
| `preview_artigo/` | renders de conferência (não versionado) |
| `monografia-45-paginas/` | gerador e figuras da versão anterior |

## Regenerar

```bash
python3 tcc/gerar_artigo.py
```

Requer `reportlab`, `python-docx`, `pymupdf` e `Pillow`. O script imprime o número
de páginas ao final. PDF e DOCX saem do mesmo conteúdo, então editar o texto em
um só lugar mantém os dois formatos sincronizados.

## Antes de entregar

Preencher os campos entre colchetes em `gerar_artigo.py`: `AUTOR`, `FILIACAO`
(curso, instituição, orientador, e-mail). Se a instituição tiver manual próprio,
ele prevalece sobre a NBR 6022.

## Formatação aplicada

A4; margens 3 cm (superior/esquerda) e 2 cm (inferior/direita); Times 12;
espaçamento 1,5 no corpo e simples em resumo, legendas, fontes e referências;
recuo de 1,25 cm na primeira linha; numeração de página no canto superior
direito; citações autor-data (NBR 10520) e referências em ordem alfabética
(NBR 6023). Resumo e *abstract* em parágrafo único, com palavras-chave.

## Conteúdo e verificação

Os números citados no artigo são medidos, não estimados: 96 testes automatizados
em 13 arquivos, 37 capturas em Chromium real (1440×900 e 390×844, claro e escuro,
pt-BR), 16 verificações funcionais de ponta a ponta e 6 defeitos corrigidos. A
Tabela 2 do artigo lista cada defeito com causa e correção. Todas as 12
referências são citadas no corpo do texto, e as 3 figuras e 2 tabelas são
chamadas antes de aparecerem.

A base de dados do sistema é inteiramente sintética; nenhuma informação pessoal
ou operacional real foi utilizada, e os envios são simulados e rotulados como tal.
