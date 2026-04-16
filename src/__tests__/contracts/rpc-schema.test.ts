import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema: get_table_sizes()
const TableSizeSchema = z.object({
  table_name: z.string(),
  total_size: z.string(),
});

const TableSizesResponseSchema = z.array(TableSizeSchema);

// Schema: get_global_settings_batch
const GlobalSettingSchema = z.object({
  key: z.string(),
  value: z.string().nullable(),
});

const GlobalSettingsBatchSchema = z.array(GlobalSettingSchema);

describe('RPC Schema Contracts', () => {
  describe('get_table_sizes', () => {
    it('aceita resposta válida', () => {
      const mockResponse = [
        { table_name: 'quizzes', total_size: '2048 kB' },
        { table_name: 'profiles', total_size: '512 kB' },
        { table_name: 'quiz_responses', total_size: '8192 kB' },
      ];
      const result = TableSizesResponseSchema.safeParse(mockResponse);
      expect(result.success).toBe(true);
    });

    it('rejeita resposta com campo faltando', () => {
      const invalid = [{ table_name: 'quizzes' }]; // sem total_size
      const result = TableSizesResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejeita tipo errado em total_size', () => {
      const invalid = [{ table_name: 'quizzes', total_size: 2048 }];
      const result = TableSizesResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('aceita array vazio', () => {
      const result = TableSizesResponseSchema.safeParse([]);
      expect(result.success).toBe(true);
    });
  });

  describe('get_global_settings_batch', () => {
    it('aceita resposta válida com valores', () => {
      const mockResponse = [
        { key: 'site_mode', value: 'A' },
        { key: 'maintenance_mode', value: 'false' },
      ];
      const result = GlobalSettingsBatchSchema.safeParse(mockResponse);
      expect(result.success).toBe(true);
    });

    it('aceita valores null', () => {
      const mockResponse = [{ key: 'feature_flag', value: null }];
      const result = GlobalSettingsBatchSchema.safeParse(mockResponse);
      expect(result.success).toBe(true);
    });

    it('rejeita sem key', () => {
      const invalid = [{ value: 'test' }];
      const result = GlobalSettingsBatchSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
