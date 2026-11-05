# Formulário — detalhes da solução

Respostas prontas para colar. Baseadas no que o artefato realmente faz
(protótipo funcional auditado, base sintética).

---

## 1. Resumo da solução proposta pela equipe

### Versão recomendada (~120 palavras)

Desenvolvemos o SAFIP FieldOps, uma aplicação web que organiza o ciclo do
relatório de campo — do preenchimento na operação até a entrega do PDF ao
cliente — mantendo a decisão sempre com uma pessoa.

A coordenação gera um link individual com prazo de 48 horas. O técnico preenche
pelo celular, sem criar conta e sem depender de sinal: os registros ficam no
aparelho e entram na fila de envio quando há conexão. O sistema sugere a
padronização do texto preservando o original e lê códigos de equipamento e IMEI
das fotos no próprio navegador, sem enviar as imagens para servidores. Toda
sugestão e toda leitura exigem confirmação humana.

Nenhum documento é liberado ao cliente sem aprovação registrada com autor, data
e hora. O portal do motorista segue o mesmo princípio: uma falha no checklist do
turno abre ocorrência e avisa a coordenação.

Em resumo: a automação elimina o retrabalho da revisão; a responsabilidade
permanece identificável.

### Versão curta (~45 palavras — para campos pequenos)

O FieldOps padroniza relatórios de campo sem tirar a decisão de quem responde: o
técnico preenche por um link individual, o sistema sugere a redação e lê os
códigos das fotos no próprio aparelho, e nada chega ao cliente sem revisão humana
registrada.

### Frase-síntese (~20 palavras)

Automação que prepara o relatório, não que o assina: sugestão de texto e leitura
de fotos com confirmação humana obrigatória.

---

## Elementos que sustentam a resposta (uso interno)

| Alegação no texto | Onde está implementado |
| --- | --- |
| Link individual com prazo de 48 h | `NewReport` gera token; `FillReport` preenche sem login |
| Funciona sem conexão, fila de envio | persistência local + contador de pendentes no `DriverShell` |
| Sugestão preserva o original | `PadronizacaoPanel` + histórico de versões no detalhe |
| OCR no navegador, imagem não sai do aparelho | Tesseract em WebAssembly, assets locais em `public/ocr` |
| Confirmação humana de cada leitura | `DetectionCard` / `PhotosOcrPanel` (confirmar, corrigir, rejeitar) |
| PDF do cliente só após aprovação | bloqueio na camada de estado + teste em `tests/store.test.ts` |
| Falha no checklist abre ocorrência | verificado ponta a ponta na auditoria funcional |
| Trilha com autor, data e hora | `audit()` em todas as transições |

**Ressalva de maturidade** (incluir só se o formulário perguntar): trata-se de
protótipo funcional com dados sintéticos. Não há backend autenticado; envios,
notificações e sincronização são simulados e rotulados como tal na interface.
Verificado por 99 testes automatizados, 37 capturas em navegador real e 16
checagens funcionais de ponta a ponta.
