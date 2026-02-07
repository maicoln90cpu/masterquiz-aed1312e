import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, handleError, showErrorToast, showSuccessToast } from '../errorHandler';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock console.error to avoid test output pollution
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// AppError CLASS
// ============================================================
describe('AppError', () => {
  it('cria erro com mensagem', () => {
    const error = new AppError('Erro de teste');
    expect(error.message).toBe('Erro de teste');
    expect(error.name).toBe('AppError');
  });

  it('cria erro com código', () => {
    const error = new AppError('Erro de teste', 'ERR_001');
    expect(error.code).toBe('ERR_001');
  });

  it('cria erro com detalhes', () => {
    const error = new AppError('Erro de teste', 'ERR_001', 'Detalhes adicionais');
    expect(error.details).toBe('Detalhes adicionais');
  });

  it('é instância de Error', () => {
    const error = new AppError('Teste');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });
});

// ============================================================
// handleError FUNCTION
// ============================================================
describe('handleError', () => {
  describe('Logging', () => {
    it('faz log do erro no console', () => {
      handleError(new Error('Test'), 'TestContext', 'Fallback');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('[TestContext]');
    });

    it('inclui timestamp no log', () => {
      handleError(new Error('Test'), 'TestContext', 'Fallback');
      const logCall = consoleSpy.mock.calls[0][1];
      expect(logCall.timestamp).toBeDefined();
    });
  });

  describe('AppError handling', () => {
    it('extrai informações do AppError', () => {
      const appError = new AppError('Mensagem customizada', 'CUSTOM_CODE', 'Detalhes');
      const result = handleError(appError, 'Test', 'Fallback');
      
      expect(result.message).toBe('Mensagem customizada');
      expect(result.code).toBe('CUSTOM_CODE');
      expect(result.details).toBe('Detalhes');
    });
  });

  describe('Supabase error mapping', () => {
    it('mapeia código 23505 (duplicado)', () => {
      const error = { code: '23505', message: 'duplicate key value' };
      const result = handleError(error, 'Test', 'Fallback');
      expect(result.message).toBe('Este item já existe no sistema');
      expect(result.code).toBe('23505');
    });

    it('mapeia código 23503 (foreign key)', () => {
      const error = { code: '23503', message: 'foreign key violation' };
      const result = handleError(error, 'Test', 'Fallback');
      expect(result.message).toBe('Não é possível realizar esta ação devido a dependências');
    });

    it('mapeia código PGRST116 (não encontrado)', () => {
      const error = { code: 'PGRST116', message: 'The result contains 0 rows' };
      const result = handleError(error, 'Test', 'Fallback');
      expect(result.message).toBe('Item não encontrado');
    });

    it('mapeia código 42501 (permissão negada)', () => {
      const error = { code: '42501', message: 'permission denied' };
      const result = handleError(error, 'Test', 'Fallback');
      expect(result.message).toBe('Você não tem permissão para realizar esta ação');
    });

    it('usa mensagem original para códigos desconhecidos', () => {
      const error = { code: '99999', message: 'Erro específico' };
      const result = handleError(error, 'Test', 'Fallback');
      expect(result.message).toBe('Erro específico');
    });

    it('usa fallback quando não há mensagem', () => {
      const error = { code: '99999' };
      const result = handleError(error, 'Test', 'Mensagem fallback');
      expect(result.message).toBe('Mensagem fallback');
    });

    it('extrai hint como details', () => {
      const error = { code: '23505', message: 'error', hint: 'Tente outro valor' };
      const result = handleError(error, 'Test', 'Fallback');
      expect(result.details).toBe('Tente outro valor');
    });

    it('extrai details do erro', () => {
      const error = { code: '23505', message: 'error', details: 'Campo: email' };
      const result = handleError(error, 'Test', 'Fallback');
      expect(result.details).toBe('Campo: email');
    });
  });

  describe('Error object handling', () => {
    it('extrai mensagem de Error padrão', () => {
      const error = new Error('Erro padrão');
      const result = handleError(error, 'Test', 'Fallback');
      expect(result.message).toBe('Erro padrão');
    });

    it('extrai mensagem de objeto simples', () => {
      const error = { message: 'Mensagem do objeto' };
      const result = handleError(error, 'Test', 'Fallback');
      expect(result.message).toBe('Mensagem do objeto');
    });
  });

  describe('String error handling', () => {
    it('usa string diretamente como mensagem', () => {
      const result = handleError('Erro como string', 'Test', 'Fallback');
      expect(result.message).toBe('Erro como string');
    });
  });

  describe('Unknown error handling', () => {
    it('usa fallback para null', () => {
      const result = handleError(null, 'Test', 'Mensagem fallback');
      expect(result.message).toBe('Mensagem fallback');
    });

    it('usa fallback para undefined', () => {
      const result = handleError(undefined, 'Test', 'Mensagem fallback');
      expect(result.message).toBe('Mensagem fallback');
    });

    it('usa fallback para objeto vazio', () => {
      const result = handleError({}, 'Test', 'Mensagem fallback');
      expect(result.message).toBe('Mensagem fallback');
    });

    it('usa fallback para número', () => {
      const result = handleError(42, 'Test', 'Mensagem fallback');
      expect(result.message).toBe('Mensagem fallback');
    });
  });
});

// ============================================================
// showErrorToast FUNCTION
// ============================================================
describe('showErrorToast', () => {
  it('exibe toast de erro com mensagem', () => {
    const error = new Error('Teste de erro');
    showErrorToast(error, 'TestContext', 'Fallback');
    
    expect(toast.error).toHaveBeenCalledWith(
      'Teste de erro',
      expect.objectContaining({
        duration: 5000,
      })
    );
  });

  it('inclui description quando há details', () => {
    const error = { message: 'Erro', hint: 'Detalhes do erro' };
    showErrorToast(error, 'TestContext', 'Fallback');
    
    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: 'Detalhes do erro',
      })
    );
  });

  it('usa fallback quando erro não tem mensagem', () => {
    showErrorToast({}, 'TestContext', 'Mensagem padrão de erro');
    
    expect(toast.error).toHaveBeenCalledWith(
      'Mensagem padrão de erro',
      expect.any(Object)
    );
  });
});

// ============================================================
// showSuccessToast FUNCTION
// ============================================================
describe('showSuccessToast', () => {
  it('exibe toast de sucesso', () => {
    showSuccessToast('Operação concluída');
    
    expect(toast.success).toHaveBeenCalledWith(
      'Operação concluída',
      expect.objectContaining({
        duration: 3000,
      })
    );
  });

  it('inclui description quando fornecida', () => {
    showSuccessToast('Salvo com sucesso', 'Dados atualizados');
    
    expect(toast.success).toHaveBeenCalledWith(
      'Salvo com sucesso',
      expect.objectContaining({
        description: 'Dados atualizados',
      })
    );
  });

  it('funciona sem description', () => {
    showSuccessToast('Sucesso!');
    
    expect(toast.success).toHaveBeenCalledWith(
      'Sucesso!',
      expect.objectContaining({
        description: undefined,
      })
    );
  });
});

// ============================================================
// INTEGRATION TESTS
// ============================================================
describe('Integration: Error Handling Flow', () => {
  it('fluxo completo: erro Supabase → toast amigável', () => {
    const supabaseError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint',
      hint: 'Key (email)=(test@example.com) already exists.',
    };
    
    showErrorToast(supabaseError, 'CreateUser', 'Erro ao criar usuário');
    
    // Deve mostrar mensagem amigável, não a mensagem técnica
    expect(toast.error).toHaveBeenCalledWith(
      'Este item já existe no sistema',
      expect.objectContaining({
        description: expect.stringContaining('already exists'),
      })
    );
  });

  it('fluxo completo: AppError → toast detalhado', () => {
    const appError = new AppError(
      'Limite de quizzes atingido',
      'PLAN_LIMIT',
      'Faça upgrade para criar mais quizzes'
    );
    
    showErrorToast(appError, 'CreateQuiz', 'Erro ao criar quiz');
    
    expect(toast.error).toHaveBeenCalledWith(
      'Limite de quizzes atingido',
      expect.objectContaining({
        description: 'Faça upgrade para criar mais quizzes',
      })
    );
  });
});
