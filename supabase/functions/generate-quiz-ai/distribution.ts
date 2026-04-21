// Distribuição proporcional de perguntas por fase do funil
// Garante que a soma das fases seja sempre igual ao total solicitado.

export type FunnelMode = 'commercial' | 'educational' | 'traffic';

export interface PhaseDistribution {
  phases: { name: string; label: string; count: number; description: string }[];
  total: number;
  mode: FunnelMode;
}

function distribute(
  total: number,
  base: number[],
  labels: { name: string; label: string; description: string }[],
  protectLastMin = 0,
): PhaseDistribution['phases'] {
  // Última fase absorve sobra; se base exceder o total, retira de trás pra frente,
  // MAS preserva `protectLastMin` na última fase (ex: conclusão nunca pode zerar).
  const counts = [...base];
  const currentSum = counts.reduce((a, b) => a + b, 0);
  if (currentSum < total) {
    counts[counts.length - 1] += (total - currentSum);
  } else if (currentSum > total) {
    let excess = currentSum - total;
    const lastIdx = counts.length - 1;
    const removableFromLast = Math.max(0, counts[lastIdx] - protectLastMin);
    const takeFromLast = Math.min(removableFromLast, excess);
    counts[lastIdx] -= takeFromLast;
    excess -= takeFromLast;
    for (let i = lastIdx - 1; i >= 0 && excess > 0; i--) {
      const take = Math.min(counts[i], excess);
      counts[i] -= take;
      excess -= take;
    }
    if (excess > 0) {
      const take = Math.min(counts[lastIdx], excess);
      counts[lastIdx] -= take;
    }
  }
  return labels.map((l, i) => ({ ...l, count: counts[i] }));
}

export function calculateQuestionDistribution(total: number, mode: FunnelMode): PhaseDistribution {
  const t = Math.max(3, Math.min(total, 999));

  if (mode === 'educational') {
    const labels = [
      { name: 'conceito', label: 'CONCEITUAL', description: 'definições e conceitos fundamentais' },
      { name: 'aplicacao', label: 'APLICAÇÃO', description: 'uso prático do conhecimento' },
      { name: 'analise', label: 'ANÁLISE', description: 'interpretação e raciocínio' },
      { name: 'sintese', label: 'SÍNTESE', description: 'conexão entre conceitos' },
    ];
    let base: number[];
    if (t <= 4) base = [2, 1, 1, 0];
    else if (t <= 6) base = [2, 2, 1, 1];
    else if (t <= 10) base = [3, 3, 2, 1];
    else if (t <= 15) base = [4, 4, 3, 2];
    else base = [5, 5, 4, 3];
    return { total: t, mode, phases: distribute(t, base, labels) };
  }

  if (mode === 'traffic') {
    const labels = [
      { name: 'demografia', label: 'SEGMENTAÇÃO DEMOGRÁFICA', description: 'perfil básico do respondente' },
      { name: 'dor', label: 'IDENTIFICAÇÃO DE DOR/NECESSIDADE', description: 'qual problema mais incomoda' },
      { name: 'consciencia', label: 'NÍVEL DE CONSCIÊNCIA', description: 'quanto já sabe sobre soluções' },
      { name: 'intencao', label: 'INTENÇÃO DE COMPRA', description: 'prontidão para agir' },
      { name: 'qualificacao', label: 'QUALIFICAÇÃO FINAL', description: 'perfil ideal para a oferta' },
    ];
    let base: number[];
    if (t <= 4) base = [1, 1, 1, 1, 0];
    else if (t === 5) base = [1, 1, 1, 1, 1];
    else if (t <= 10) base = [2, 2, 2, 2, 1];
    else if (t <= 15) base = [2, 3, 3, 3, 2];
    else base = [3, 4, 4, 3, 2];
    return { total: t, mode, phases: distribute(t, base, labels) };
  }

  // commercial (form / pdf infoprodutor) — funil de auto-convencimento
  const labels = [
    { name: 'espelhamento', label: 'ESPELHAMENTO', description: 'faixa etária, perfil, rotina, momento de vida (identificação pessoal)' },
    { name: 'dor', label: 'AMPLIFICAÇÃO DA DOR', description: 'o problema ganha peso e clareza' },
    { name: 'consequencia', label: 'CONSEQUÊNCIA', description: 'o custo de não agir fica evidente' },
    { name: 'contraste', label: 'CONTRASTE', description: 'estado atual vs estado desejado' },
    { name: 'conclusao', label: 'CONCLUSÃO GUIADA', description: 'a solução passa a fazer sentido (CTA implícito)' },
  ];
  let base: number[];
  // IMPORTANTE: a partir de 5 perguntas SEMPRE deve haver ≥1 pergunta de
  // CONCLUSÃO GUIADA (a última fase, que prepara o CTA).
  // Sem isso, o quiz termina no ar — sem a pergunta de fechamento.
  if (t <= 4) base = [2, 1, 1, 0, 0];
  else if (t === 5) base = [2, 1, 1, 0, 1];
  else if (t <= 7) base = [2, 2, 1, 1, 1];
  else if (t <= 10) base = [2, 2, 2, 2, 1];
  else if (t <= 13) base = [3, 3, 2, 2, 1];
  else if (t <= 17) base = [3, 3, 3, 3, 2];
  else base = [3, 4, 4, 4, 2];
  return { total: t, mode, phases: distribute(t, base, labels) };
}

/** Gera um bloco de texto pronto para injetar no prompt do usuário. */
export function formatDistributionForPrompt(dist: PhaseDistribution): string {
  const lines: string[] = [];
  lines.push(`\n=== DISTRIBUIÇÃO OBRIGATÓRIA DAS ${dist.total} PERGUNTAS ===`);
  let cursor = 1;
  for (const phase of dist.phases) {
    if (phase.count <= 0) continue;
    const start = cursor;
    const end = cursor + phase.count - 1;
    const range = phase.count === 1 ? `Pergunta ${start}` : `Perguntas ${start} a ${end}`;
    lines.push(`- ${range}: ${phase.label} (${phase.description}) → ${phase.count} pergunta${phase.count > 1 ? 's' : ''}`);
    cursor = end + 1;
  }
  lines.push(`\nVocê DEVE retornar EXATAMENTE ${dist.total} perguntas seguindo essa ordem e quantidade por fase. Não repita perguntas dentro da mesma fase — varie ângulo e abordagem.`);
  return lines.join('\n');
}
