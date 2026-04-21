// Distribuição proporcional de perguntas por fase do funil
// Garante que a soma das fases seja sempre igual ao total solicitado.

export type FunnelMode = 'commercial' | 'educational' | 'traffic';

export interface PhaseDistribution {
  phases: { name: string; label: string; count: number; description: string }[];
  total: number;
  mode: FunnelMode;
}

function distribute(total: number, base: number[], labels: { name: string; label: string; description: string }[]): PhaseDistribution['phases'] {
  // Última fase absorve o resto para garantir soma exata
  const counts = [...base];
  const sumExceptLast = counts.slice(0, -1).reduce((a, b) => a + b, 0);
  counts[counts.length - 1] = Math.max(0, total - sumExceptLast);
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
    if (t <= 5) base = [2, 2, 1, 0];
    else if (t <= 10) base = [3, 3, 2, 0];
    else if (t <= 15) base = [4, 4, 3, 0];
    else base = [5, 5, 5, 0];
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
    if (t <= 5) base = [1, 1, 1, 1, 0];
    else if (t <= 10) base = [2, 2, 2, 2, 0];
    else if (t <= 15) base = [2, 3, 3, 3, 0];
    else base = [3, 4, 4, 4, 0];
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
  if (t <= 5) base = [2, 1, 1, 0, 0];
  else if (t <= 7) base = [2, 2, 1, 1, 0];
  else if (t <= 10) base = [2, 2, 2, 2, 0];
  else if (t <= 13) base = [3, 3, 2, 2, 0];
  else if (t <= 17) base = [3, 3, 3, 3, 0];
  else base = [3, 4, 4, 4, 0];
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
