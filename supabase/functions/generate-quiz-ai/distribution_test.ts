// Testes de regressão para a distribuição de perguntas do gerador IA.
// Garantem invariantes críticos:
//   1. Soma das fases SEMPRE = total solicitado
//   2. Nunca há contagem negativa
//   3. Modo commercial SEMPRE tem fase de conclusão (≥1) para total ≥ 5
//   4. Quizzes curtos (3-4) ainda funcionam
//
// Rodar: deno test supabase/functions/generate-quiz-ai/distribution_test.ts

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateQuestionDistribution, type FunnelMode } from "./distribution.ts";

const MODES: FunnelMode[] = ['commercial', 'educational', 'traffic'];
const TOTALS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30];

Deno.test("soma das fases bate com o total (todos os modos, 3-30 perguntas)", () => {
  for (const mode of MODES) {
    for (const total of TOTALS) {
      const dist = calculateQuestionDistribution(total, mode);
      const sum = dist.phases.reduce((a, p) => a + p.count, 0);
      assertEquals(sum, total, `mode=${mode} total=${total} -> soma=${sum}`);
    }
  }
});

Deno.test("nenhuma fase tem contagem negativa", () => {
  for (const mode of MODES) {
    for (const total of TOTALS) {
      const dist = calculateQuestionDistribution(total, mode);
      for (const p of dist.phases) {
        assert(p.count >= 0, `mode=${mode} total=${total} fase=${p.name} count=${p.count}`);
      }
    }
  }
});

Deno.test("modo commercial: fase de conclusão SEMPRE presente para total >= 5", () => {
  for (const total of [5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 25]) {
    const dist = calculateQuestionDistribution(total, 'commercial');
    const conclusao = dist.phases.find(p => p.name === 'conclusao');
    assert(conclusao !== undefined, `fase conclusao ausente em total=${total}`);
    assert(conclusao!.count >= 1, `commercial total=${total} sem conclusão (count=${conclusao!.count})`);
  }
});

Deno.test("modo traffic: fase qualificacao SEMPRE presente para total >= 5", () => {
  for (const total of [5, 6, 8, 10, 15, 20]) {
    const dist = calculateQuestionDistribution(total, 'traffic');
    const qual = dist.phases.find(p => p.name === 'qualificacao');
    assert(qual !== undefined && qual.count >= 1, `traffic total=${total} sem qualificacao`);
  }
});

Deno.test("quizzes mínimos (3-4 perguntas) não quebram", () => {
  for (const mode of MODES) {
    for (const total of [3, 4]) {
      const dist = calculateQuestionDistribution(total, mode);
      const sum = dist.phases.reduce((a, p) => a + p.count, 0);
      assertEquals(sum, total);
      assert(dist.phases.length > 0);
    }
  }
});

Deno.test("totais fora dos limites são clampados (mínimo 3)", () => {
  for (const mode of MODES) {
    const dist = calculateQuestionDistribution(1, mode);
    const sum = dist.phases.reduce((a, p) => a + p.count, 0);
    assertEquals(sum, 3, `mode=${mode} total=1 deveria virar 3`);
  }
});
