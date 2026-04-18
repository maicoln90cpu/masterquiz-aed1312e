import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regressão P6: eventos `quiz_first_published` / `quiz_first_publishedB` /
 * `quiz_real_published` NUNCA podem disparar duas vezes para o mesmo usuário.
 *
 * Mecanismo de dedup: RPC `has_user_fired_event(_user_id, _event_name)` consulta
 * `gtm_event_logs` e retorna true se o evento já foi disparado.
 *
 * Histórico do bug: ao mexer em `useQuizPersistence.ts`, é fácil esquecer de
 * envolver o `pushGTMEvent` no `if (!alreadyFired)`. Este teste protege.
 *
 * Estratégia: lemos o código-fonte do hook e validamos via regex que TODOS os 3
 * eventos têm o gate de dedup acima da chamada `pushGTMEvent`.
 *
 * Veja: mem://tracking/quiz-publish-events
 */

const sourceFiles = import.meta.glob('/src/hooks/useQuizPersistence.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const PERSISTENCE_FILE = '/src/hooks/useQuizPersistence.ts';
const PROTECTED_EVENTS = [
  'quiz_first_published',
  'quiz_first_publishedB',
  'quiz_real_published',
];

describe('Regression: Bug publish dedup — eventos não duplicam', () => {
  let source: string;

  beforeEach(() => {
    source = sourceFiles[PERSISTENCE_FILE];
    expect(source, `${PERSISTENCE_FILE} não foi carregado`).toBeTruthy();
  });

  for (const eventName of PROTECTED_EVENTS) {
    it(`evento "${eventName}" tem gate has_user_fired_event antes do pushGTMEvent`, () => {
      // Encontra todas as chamadas pushGTMEvent('<eventName>'...) ou pushGTMEvent(varName,...)
      // onde varName é uma variável que termina com o eventName.
      const literalCalls = new RegExp(
        `pushGTMEvent\\(\\s*['"\`]${eventName}['"\`]`,
        'g'
      );
      const matches = source.match(literalCalls) || [];

      // Para cada match literal, garantir que o trecho 200 chars antes contenha
      // chamada has_user_fired_event com o nome do evento OU com a variável publishEventName
      // (caso especial dos eventos quiz_first_published* que usam variável).
      let idx = 0;
      while (idx < source.length) {
        const found = source.indexOf(`'${eventName}'`, idx);
        if (found === -1) break;

        // Confere se está dentro de um pushGTMEvent
        const before = source.slice(Math.max(0, found - 100), found);
        if (!/pushGTMEvent\(\s*$/.test(before)) {
          idx = found + 1;
          continue;
        }

        // Olhar 500 chars antes para encontrar dedup gate
        const window = source.slice(Math.max(0, found - 500), found);
        const hasGate =
          /has_user_fired_event/.test(window) ||
          /alreadyFired/.test(window) ||
          /Fired/.test(window);

        expect(
          hasGate,
          `🚨 Evento "${eventName}" disparado SEM gate de dedup (has_user_fired_event) acima!\n` +
            `Risco: dispara várias vezes por usuário, infla métricas pagas (FB Pixel/GA).\n` +
            `Veja mem://tracking/quiz-publish-events.`
        ).toBe(true);

        idx = found + 1;
      }

      // Também verifica eventos passados via variável (publishEventName)
      // Para esse caso, conferimos que TODA chamada pushGTMEvent(publishEventName)
      // tem has_user_fired_event nos 500 chars anteriores.
      if (eventName === 'quiz_first_published' || eventName === 'quiz_first_publishedB') {
        const variableCalls = /pushGTMEvent\(\s*publishEventName/g;
        let m;
        while ((m = variableCalls.exec(source)) !== null) {
          const window = source.slice(Math.max(0, m.index - 500), m.index);
          expect(
            /has_user_fired_event/.test(window) || /alreadyFired/.test(window),
            `🚨 pushGTMEvent(publishEventName) sem gate has_user_fired_event acima.`
          ).toBe(true);
        }
      }

      // Ao menos 1 ocorrência deve existir (sanity check do teste)
      const totalRefs = (source.match(new RegExp(eventName, 'g')) || []).length;
      expect(totalRefs, `Evento "${eventName}" não aparece em useQuizPersistence`).toBeGreaterThan(0);
    });
  }

  it('useQuizPersistence importa pushGTMEvent (não usa dataLayer.push direto)', () => {
    expect(source).toMatch(/from\s+["']@\/lib\/gtmLogger["']/);
    expect(source).toMatch(/pushGTMEvent/);
  });
});
