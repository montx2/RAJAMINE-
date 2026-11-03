/*
  Motor de padronização de textos de campo (pt-BR).

  IMPORTANTE — integridade:
  · Motor LOCAL e determinístico baseado em regras (demonstrativo). Não é um LLM
    e NÃO envia dados a serviços externos. Em produção, pode ser substituído por
    um LLM com as mesmas garantias de contrato (ver docs/05-ia-ocr.md).
  · Transforma apenas o que foi escrito: NUNCA inventa acontecimentos, horários,
    locais ou equipamentos. Toda mudança é registrada e comparável lado a lado.
  · O texto original é sempre preservado no histórico de versões.
*/

export interface TextChange {
  tipo: 'pessoa' | 'gramatica' | 'estilo';
  de: string;
  para: string;
  motivo: string;
}

export interface TextAlert {
  nivel: 'info' | 'atencao' | 'erro';
  mensagem: string;
}

export interface PadronizacaoResult {
  sugerido: string;
  mudancas: TextChange[];
  alertas: TextAlert[];
}

export interface ReportContext {
  colaboradorNome?: string;
  origem?: string;
  destino?: string;
  dataViagem?: string;
  kmInicio?: number;
  kmFim?: number;
  placaCaminhao?: string;
  frotaCaminhao?: string;
  equipamentosConfirmados?: string[];
}

/* 1ª pessoa do singular → 3ª pessoa (pretérito perfeito, presente e futuro comuns) */
const VERBOS_1S: Record<string, string> = {
  cheguei: 'chegou', instalei: 'instalou', realizei: 'realizou', verifiquei: 'verificou',
  fiz: 'fez', fui: 'foi', encontrei: 'encontrou', testei: 'testou', configurei: 'configurou',
  validei: 'validou', orientei: 'orientou', acompanhei: 'acompanhou', registrei: 'registrou',
  fotografei: 'fotografou', coletei: 'coletou', preenchi: 'preencheu', saí: 'saiu',
  retornei: 'retornou', iniciei: 'iniciou', finalizei: 'finalizou', concluí: 'concluiu',
  constatei: 'constatou', identifiquei: 'identificou', substituí: 'substituiu', ajustei: 'ajustou',
  calibrei: 'calibrou', medi: 'mediu', anotei: 'anotou', observei: 'observou', notei: 'notou',
  percebi: 'percebeu', solicitei: 'solicitou', informei: 'informou', comuniquei: 'comunicou',
  entreguei: 'entregou', recebi: 'recebeu', aguardei: 'aguardou', prossegui: 'prosseguiu',
  dirigi: 'dirigiu', desloquei: 'deslocou', apresentei: 'apresentou', fixei: 'fixou',
  conectei: 'conectou', tirei: 'tirou', limpei: 'limpou', atualizei: 'atualizou',
  troquei: 'trocou', conferi: 'conferiu', conferi2: 'conferiu', liberei: 'liberou',
  assinei: 'assinou', revisei: 'revisou', montei: 'montou', desmontei: 'desmontou',
  apertei: 'apertou', isolei: 'isolou', etiquetei: 'etiquetou', parametrizei: 'parametrizou',
  reiniciei: 'reiniciou', religuei: 'religou', desliguei: 'desligou', liguei: 'ligou',
  // presente
  instalo: 'instala', verifico: 'verifica', realizo: 'realiza', faço: 'faz', testo: 'testa',
  configuro: 'configura', valido: 'valida', registro: 'registra', confiro: 'confere',
  // futuro
  instalarei: 'instalará', realizarei: 'realizará', verificarei: 'verificará', retornarei: 'retornará',
};

/* 1ª pessoa do plural → 3ª pessoa (a equipe) */
const VERBOS_1P: Record<string, string> = {
  chegamos: 'chegou', instalamos: 'instalou', realizamos: 'realizou', verificamos: 'verificou',
  fizemos: 'fez', fomos: 'foi', testamos: 'testou', configuramos: 'configurou',
  validamos: 'validou', finalizamos: 'finalizou', concluímos: 'concluiu', saímos: 'saiu',
  retornamos: 'retornou', iniciamos: 'iniciou', entregamos: 'entregou', registramos: 'registrou',
  substituímos: 'substituiu', ajustamos: 'ajustou', identificamos: 'identificou',
  constatamos: 'constatou', solicitamos: 'solicitou', comunicamos: 'comunicou',
};

const GRAMATICA: Array<[RegExp, string, string]> = [
  [/\bas\s+(\d{1,2}(?:h|:\d{2})\b)/gi, 'às $1', 'Crase antes de horas ("as 8h" → "às 8h")'],
  [/\b(\d{1,2})\s*(?:hs|hrs)\b/gi, '$1h', 'Abreviação padronizada de horas ("8hs" → "8h")'],
  [/\b(\d+)\s*km\b/gi, '$1 km', 'Espaçamento entre valor e unidade'],
  [/\bnumero\b/gi, 'número', 'Acentuação de "número"'],
  [/\bangulo\b/gi, 'ângulo', 'Acentuação de "ângulo"'],
  [/\bserie\b/gi, 'série', 'Acentuação de "série" (contexto de número de série)'],
  [/\bem baixo\b/gi, 'embaixo', 'Grafia de "embaixo"'],
  [/\bconcerto\b(?=[^.]*\b(equipamento|sensor|câmera|camera|rastreador|telemetria)\b)/gi, 'conserto', '"Conserto" (reparo) em vez de "concerto" (musical)'],
];

const ESTILO: Array<[RegExp, string, string]> = [
  [/\bpra\b/gi, 'para', 'Registro formal ("pra" → "para")'],
  [/\bpro\b/gi, 'para o', 'Registro formal ("pro" → "para o")'],
  [/\bpros\b/gi, 'para os', 'Registro formal ("pros" → "para os")'],
  [/\btava\b/gi, 'estava', 'Registro formal ("tava" → "estava")'],
  [/\btá\b/gi, 'está', 'Registro formal ("tá" → "está")'],
  [/\bhj\b/gi, 'hoje', 'Abreviação informal expandida'],
  [/\btb\b/gi, 'também', 'Abreviação informal expandida'],
  [/\bpq\b/gi, 'porque', 'Abreviação informal expandida'],
  [/\bvc\b/gi, 'você', 'Abreviação informal expandida'],
  [/,\s*(?:mas\s+)?tava\s+suja/gi, ', mas estava suja', 'Registro formal'],
  [/\brespondeu ok\b/gi, 'respondeu em conformidade', 'Linguagem profissional de relatório'],
  [/\bficou ok\b/gi, 'ficou em conformidade', 'Linguagem profissional de relatório'],
  [/\btudo certo\b/gi, 'tudo em conformidade', 'Linguagem profissional de relatório'],
  [/\bdeu tudo certo\b/gi, 'foi concluído em conformidade', 'Linguagem profissional de relatório'],
  [/(?:^|(?<=\s))né(?=[\s,.!?]|$)/gi, '', 'Remoção de marcador de oralidade ("né")'],
];

function preserveCase(original: string, replacement: string): string {
  if (original[0] === original[0]?.toUpperCase() && original[0] !== original[0]?.toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

interface ApplyResult { text: string; changes: TextChange[] }

function applyRules(text: string, rules: Array<[RegExp, string, string]>, tipo: TextChange['tipo']): ApplyResult {
  const changes: TextChange[] = [];
  let out = text;
  for (const [re, para, motivo] of rules) {
    out = out.replace(re, (...args) => {
      const match = args[0] as string;
      let replacement = para;
      // Suporta grupos $1, $2…
      for (let g = 1; g < args.length - 2; g++) {
        replacement = replacement.replace(`$${g}`, (args[g] as string) ?? '');
      }
      if (replacement !== match) {
        changes.push({ tipo, de: match, para: replacement, motivo });
      }
      return replacement;
    });
  }
  return { text: out, changes };
}

/** Converte verbos em 1ª pessoa para 3ª, registrando cada mudança. */
function convertVerbs(text: string, dict: Record<string, string>, rotulo: string): ApplyResult {
  const changes: TextChange[] = [];
  const out = text.replace(/\b([a-záéíóúâêôãõç]+)\b/gi, (word) => {
    const key = word.toLowerCase();
    const target = dict[key];
    if (!target) return word;
    const replacement = preserveCase(word, target);
    changes.push({ tipo: 'pessoa', de: word, para: replacement, motivo: rotulo });
    return replacement;
  });
  return { text: out, changes };
}

export function padronizar(texto: string, ctx: ReportContext = {}): PadronizacaoResult {
  const mudancas: TextChange[] = [];
  const alertas: TextAlert[] = [];
  let t = texto.replace(/\s+/g, ' ').trim();
  const original = t;

  if (!t) {
    return { sugerido: '', mudancas: [], alertas: [{ nivel: 'erro', mensagem: 'A descrição das atividades está vazia. O colaborador precisa relatar o que foi realizado.' }] };
  }

  // 1. Expressões reflexivas e pronomes compostos (antes dos verbos isolados)
  const compostos = applyRules(t, [
    [/\bme desloquei\b/gi, 'deslocou-se', '1ª → 3ª pessoa (verbo pronominal)'],
    [/\bme apresentei\b/gi, 'apresentou-se', '1ª → 3ª pessoa (verbo pronominal)'],
    [/\bme dirigi\b/gi, 'dirigiu-se', '1ª → 3ª pessoa (verbo pronominal)'],
    [/\beu mesmo\b/gi, 'o próprio técnico', '1ª → 3ª pessoa'],
  ], 'pessoa');
  t = compostos.text; mudancas.push(...compostos.changes);

  // 2. "nós" → a equipe (antes da 1ª do singular)
  const nos = t.replace(/\bnós\s+/gi, () => {
    mudancas.push({ tipo: 'pessoa', de: 'nós', para: 'a equipe', motivo: '1ª pessoa do plural → 3ª pessoa (a equipe)' });
    return 'a equipe ';
  });
  t = nos;
  const vp = convertVerbs(t, VERBOS_1P, '1ª pessoa do plural → 3ª pessoa (a equipe)');
  t = vp.text; mudancas.push(...vp.changes);

  // 3. "eu" + verbo → sujeito explícito na 3ª pessoa
  const eu = t.replace(/\beu\s+/gi, () => {
    mudancas.push({ tipo: 'pessoa', de: 'eu', para: 'o técnico', motivo: '1ª → 3ª pessoa (sujeito explícito)' });
    return 'o técnico ';
  });
  t = eu;
  const vs = convertVerbs(t, VERBOS_1S, '1ª → 3ª pessoa do singular');
  t = vs.text; mudancas.push(...vs.changes);

  // 4. Possessivos de 1ª pessoa
  const poss = applyRules(t, [
    [/\bmeu\b/gi, 'seu', 'Possessivo de 1ª → 3ª pessoa'],
    [/\bminha\b/gi, 'sua', 'Possessivo de 1ª → 3ª pessoa'],
    [/\bmeus\b/gi, 'seus', 'Possessivo de 1ª → 3ª pessoa'],
    [/\bminhas\b/gi, 'suas', 'Possessivo de 1ª → 3ª pessoa'],
    [/\bcomigo\b/gi, 'consigo', 'Pronome de 1ª → 3ª pessoa'],
  ], 'pessoa');
  t = poss.text; mudancas.push(...poss.changes);

  // 5. Correções gramaticais
  const gram = applyRules(t, GRAMATICA, 'gramatica');
  t = gram.text; mudancas.push(...gram.changes);

  // 6. Estilo profissional
  const est = applyRules(t, ESTILO, 'estilo');
  t = est.text; mudancas.push(...est.changes);

  // 7. Sujeito elíptico no início: se a frase começa com verbo convertido, explicitar "O técnico"
  const convertedVerbs = new Set(Object.values(VERBOS_1S).concat(Object.values(VERBOS_1P)));
  const sentences = t.split(/(?<=[.!?])\s+/);
  let firstFixed = false;
  t = sentences.map((s, idx) => {
    const first = s.split(/\s+/)[0]?.toLowerCase().replace(/[,:]/g, '') ?? '';
    const wasConverted = mudancas.some((m) => m.tipo === 'pessoa' && m.para.toLowerCase() === first);
    if (idx === 0 && wasConverted && convertedVerbs.has(first) && !/^o técnico/i.test(s)) {
      firstFixed = true;
      mudancas.push({ tipo: 'pessoa', de: s.split(/\s+/)[0], para: `O técnico ${s.split(/\s+/)[0].toLowerCase()}`, motivo: 'Sujeito explícito na abertura do relato' });
      return `O técnico ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
    }
    return s;
  }).join(' ');
  void firstFixed;

  // 8. Capitalização e pontuação final
  t = t.replace(/(^|[.!?]\s+)([a-záéíóúâêôãõç])/g, (_m, p1, p2) => p1 + p2.toUpperCase());
  t = t.replace(/\s+([,.;:!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  if (!/[.!?]$/.test(t)) {
    t += '.';
    mudancas.push({ tipo: 'gramatica', de: '(sem pontuação final)', para: '.', motivo: 'Pontuação final de frase' });
  }

  // ── Alertas de completude e inconsistência (nunca inventa dados) ──
  if (!ctx.origem?.trim()) alertas.push({ nivel: 'erro', mensagem: 'Origem da viagem não informada.' });
  if (!ctx.destino?.trim()) alertas.push({ nivel: 'erro', mensagem: 'Destino da viagem não informado.' });
  if (!ctx.dataViagem) alertas.push({ nivel: 'erro', mensagem: 'Data da viagem não informada.' });
  else if (ctx.dataViagem > new Date().toISOString().slice(0, 10)) alertas.push({ nivel: 'atencao', mensagem: 'A data da viagem está no futuro — verificar lançamento.' });
  if (ctx.origem && ctx.destino && ctx.origem.trim().toLowerCase() === ctx.destino.trim().toLowerCase()) {
    alertas.push({ nivel: 'atencao', mensagem: 'Origem e destino são idênticos — confirmar trajeto.' });
  }
  if (ctx.kmInicio != null && ctx.kmFim != null && ctx.kmFim <= ctx.kmInicio) {
    alertas.push({ nivel: 'erro', mensagem: 'KM final menor ou igual ao KM inicial — verificar hodômetro.' });
  }
  if (t.length < 90) {
    alertas.push({ nivel: 'atencao', mensagem: 'Descrição muito curta. Detalhar atividades, horários e testes realizados (sem inventar informações).' });
  }
  if (/\bequipamento|sensor|rastreador|telemetria|câmera\b/i.test(t) && !/EQ-\d{3,6}/i.test(t) && (ctx.equipamentosConfirmados?.length ?? 0) === 0) {
    alertas.push({ nivel: 'info', mensagem: 'O texto cita equipamento sem código de identificação. Confirmar o número via foto/OCR ou informar manualmente.' });
  }
  const placaMenos = ctx.placaCaminhao?.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const placasNoTexto = t.match(/\b[A-Z]{3}[- ]?\d[A-Z0-9]\d{2}\b/gi) ?? [];
  for (const p of placasNoTexto) {
    if (placaMenos && p.replace(/[^A-Z0-9]/gi, '').toUpperCase() !== placaMenos) {
      alertas.push({ nivel: 'atencao', mensagem: `O texto cita a placa ${p.toUpperCase()}, diferente do caminhão vinculado (${ctx.placaCaminhao}). Conferir.` });
    }
  }
  if (!/\b(test|valid|confer|verific)\w*/i.test(t)) {
    alertas.push({ nivel: 'info', mensagem: 'Não há menção a testes/validação. Se foram realizados, pedir ao colaborador que registre — o sistema não adiciona essa informação automaticamente.' });
  }
  if (/\b(eu|nós|meu|minha|comigo)\b/i.test(t)) {
    alertas.push({ nivel: 'info', mensagem: 'Ainda há marcas de 1ª pessoa não cobertas pelas regras. Revisar manualmente antes de aprovar.' });
  }
  if (original === t) {
    alertas.push({ nivel: 'info', mensagem: 'Nenhuma transformação necessária: o texto já está em 3ª pessoa e em registro profissional.' });
  }

  return { sugerido: t, mudancas, alertas };
}

/** Detecta marcas de 1ª pessoa (para badges na UI). */
export function temPrimeiraPessoa(texto: string): boolean {
  return /\b(eu|nós|meu|minha|meus|minhas|comigo|cheguei|instalei|realizei|verifiquei|fiz|fui|testei|configurei|validei|registrei|finalizei|concluí|entreguei|saí|retornei|fomos|chegamos|instalamos|realizamos|fizemos|testamos)\b/i.test(texto);
}
