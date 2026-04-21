// Espelho TS da lógica em supabase/functions/generate-quiz-ai/distribution.ts
// Usado APENAS para preview no painel admin. Mantenha em sincronia com a edge function.

export type FunnelMode = 'commercial' | 'educational' | 'traffic';

export interface PhasePreview {
  name: string;
  label: string;
  description: string;
  count: number;
  range: string; // ex: "Perguntas 1 a 3"
}

export interface DistributionPreview {
  total: number;
  mode: FunnelMode;
  phases: PhasePreview[];
}

function distribute(total: number, base: number[], labels: { name: string; label: string; description: string }[]): { name: string; label: string; description: string; count: number }[] {
  const counts = [...base];
  let currentSum = counts.reduce((a, b) => a + b, 0);
  if (currentSum < total) {
    counts[counts.length - 1] += (total - currentSum);
  } else if (currentSum > total) {
    let excess = currentSum - total;
    for (let i = counts.length - 1; i >= 0 && excess > 0; i--) {
      const take = Math.min(counts[i], excess);
      counts[i] -= take;
      excess -= take;
    }
  }
  return labels.map((l, i) => ({ ...l, count: counts[i] }));
}

export function calculatePreview(total: number, mode: FunnelMode): DistributionPreview {
  const t = Math.max(3, Math.min(total, 999));

  let labels: { name: string; label: string; description: string }[];
  let base: number[];

  if (mode === 'educational') {
    labels = [
      { name: 'conceito', label: 'CONCEITUAL', description: 'definições e conceitos fundamentais' },
      { name: 'aplicacao', label: 'APLICAÇÃO', description: 'uso prático do conhecimento' },
      { name: 'analise', label: 'ANÁLISE', description: 'interpretação e raciocínio' },
      { name: 'sintese', label: 'SÍNTESE', description: 'conexão entre conceitos' },
    ];
    if (t <= 4) base = [2, 1, 1, 0];
    else if (t <= 6) base = [2, 2, 1, 1];
    else if (t <= 10) base = [3, 3, 2, 1];
    else if (t <= 15) base = [4, 4, 3, 2];
    else base = [5, 5, 4, 3];
  } else if (mode === 'traffic') {
    labels = [
      { name: 'demografia', label: 'SEGMENTAÇÃO DEMOGRÁFICA', description: 'perfil básico do respondente' },
      { name: 'dor', label: 'IDENTIFICAÇÃO DE DOR/NECESSIDADE', description: 'qual problema mais incomoda' },
      { name: 'consciencia', label: 'NÍVEL DE CONSCIÊNCIA', description: 'quanto já sabe sobre soluções' },
      { name: 'intencao', label: 'INTENÇÃO DE COMPRA', description: 'prontidão para agir' },
      { name: 'qualificacao', label: 'QUALIFICAÇÃO FINAL', description: 'perfil ideal para a oferta' },
    ];
    if (t <= 4) base = [1, 1, 1, 1, 0];
    else if (t === 5) base = [1, 1, 1, 1, 1];
    else if (t <= 10) base = [2, 2, 2, 2, 1];
    else if (t <= 15) base = [2, 3, 3, 3, 2];
    else base = [3, 4, 4, 3, 2];
  } else {
    // commercial
    labels = [
      { name: 'espelhamento', label: 'ESPELHAMENTO', description: 'identificação pessoal (idade, perfil, rotina)' },
      { name: 'dor', label: 'AMPLIFICAÇÃO DA DOR', description: 'o problema ganha peso e clareza' },
      { name: 'consequencia', label: 'CONSEQUÊNCIA', description: 'o custo de não agir fica evidente' },
      { name: 'contraste', label: 'CONTRASTE', description: 'estado atual vs estado desejado' },
      { name: 'conclusao', label: 'CONCLUSÃO GUIADA', description: 'a solução faz sentido (CTA implícito)' },
    ];
    if (t <= 4) base = [2, 1, 1, 0, 0];
    else if (t === 5) base = [2, 1, 1, 0, 1];
    else if (t <= 7) base = [2, 2, 1, 1, 1];
    else if (t <= 10) base = [2, 2, 2, 2, 1];
    else if (t <= 13) base = [3, 3, 2, 2, 1];
    else if (t <= 17) base = [3, 3, 3, 3, 2];
    else base = [3, 4, 4, 4, 2];
  }

  const distributed = distribute(t, base, labels);

  let cursor = 1;
  const phases: PhasePreview[] = distributed.map((p) => {
    if (p.count <= 0) {
      return { ...p, range: '—' };
    }
    const start = cursor;
    const end = cursor + p.count - 1;
    const range = p.count === 1 ? `Pergunta ${start}` : `Perguntas ${start} a ${end}`;
    cursor = end + 1;
    return { ...p, range };
  });

  return { total: t, mode, phases };
}