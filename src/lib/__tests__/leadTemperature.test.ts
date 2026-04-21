import { describe, it, expect } from 'vitest';
import { getLeadTemperature } from '@/lib/leadTemperature';

describe('leadTemperature', () => {
  it('retorna hot quando 3 campos preenchidos', () => {
    expect(
      getLeadTemperature({
        respondent_name: 'João',
        respondent_email: 'a@b.com',
        respondent_whatsapp: '+5511999999999',
      })
    ).toBe('hot');
  });

  it('retorna warm com 2 campos', () => {
    expect(
      getLeadTemperature({
        respondent_name: 'João',
        respondent_email: 'a@b.com',
      })
    ).toBe('warm');
  });

  it('retorna cold com 1 campo', () => {
    expect(getLeadTemperature({ respondent_email: 'a@b.com' })).toBe('cold');
  });

  it('retorna cold sem campos', () => {
    expect(getLeadTemperature({})).toBe('cold');
  });

  it('ignora placeholder "Sem nome"', () => {
    expect(
      getLeadTemperature({
        respondent_name: 'Sem nome',
        respondent_email: 'a@b.com',
        respondent_whatsapp: '+55119',
      })
    ).toBe('warm');
  });

  it('ignora strings em branco', () => {
    expect(
      getLeadTemperature({
        respondent_name: '   ',
        respondent_email: 'a@b.com',
      })
    ).toBe('cold');
  });

  it('ignora null/undefined', () => {
    expect(
      getLeadTemperature({
        respondent_name: null,
        respondent_email: undefined,
        respondent_whatsapp: '+55119',
      })
    ).toBe('cold');
  });
});