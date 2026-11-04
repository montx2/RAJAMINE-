export interface DiffSegment {
  type: 'same' | 'add' | 'del';
  text: string;
}

/**
 * Diff palavra a palavra via LCS (programação dinâmica).
 * Textos de relatório são curtos (< 5k palavras), então O(n·m) é aceitável.
 */
export function diffWords(a: string, b: string): DiffSegment[] {
  const ta = a.split(/(\s+)/).filter((t) => t.length > 0);
  const tb = b.split(/(\s+)/).filter((t) => t.length > 0);
  const n = ta.length;
  const m = tb.length;

  // Tabela LCS
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = ta[i] === tb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const raw: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ta[i] === tb[j]) {
      raw.push({ type: 'same', text: ta[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ type: 'del', text: ta[i] });
      i++;
    } else {
      raw.push({ type: 'add', text: tb[j] });
      j++;
    }
  }
  while (i < n) raw.push({ type: 'del', text: ta[i++] });
  while (j < m) raw.push({ type: 'add', text: tb[j++] });

  // Funde segmentos consecutivos do mesmo tipo
  const out: DiffSegment[] = [];
  for (const seg of raw) {
    const last = out[out.length - 1];
    if (last && last.type === seg.type) last.text += seg.text;
    else out.push({ ...seg });
  }
  return out;
}
