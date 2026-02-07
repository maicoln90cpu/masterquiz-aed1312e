import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../AuthContext';

// ============================================================
// MOCKS
// ============================================================

// Mock session data
const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { full_name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
};

// Mock Supabase auth
const mockSubscription = { unsubscribe: vi.fn() };
let authStateChangeCallback: ((event: string, session: any) => void) | null = null;

const mockSupabaseAuth = {
  getSession: vi.fn(),
  onAuthStateChange: vi.fn((callback) => {
    authStateChangeCallback = callback;
    return { data: { subscription: mockSubscription } };
  }),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

// Helper component to test useAuth hook
const TestConsumer = () => {
  const { user, session, loading } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="session">{session ? 'has-session' : 'no-session'}</div>
    </div>
  );
};

const renderWithProvider = (ui: ReactNode) => {
  return render(<AuthProvider>{ui}</AuthProvider>);
};

// ============================================================
// TESTS
// ============================================================

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateChangeCallback = null;
    // Default: no session
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Estado inicial (loading)', () => {
    it('inicia com loading=true', () => {
      // Don't resolve getSession yet
      mockSupabaseAuth.getSession.mockReturnValue(new Promise(() => {}));
      
      renderWithProvider(<TestConsumer />);
      
      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    it('inicia com user=null', () => {
      mockSupabaseAuth.getSession.mockReturnValue(new Promise(() => {}));
      
      renderWithProvider(<TestConsumer />);
      
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('inicia com session=null', () => {
      mockSupabaseAuth.getSession.mockReturnValue(new Promise(() => {}));
      
      renderWithProvider(<TestConsumer />);
      
      expect(screen.getByTestId('session').textContent).toBe('no-session');
    });
  });

  describe('Carregamento de sessão existente', () => {
    it('carrega sessão do getSession', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });
      
      renderWithProvider(<TestConsumer />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      expect(screen.getByTestId('session').textContent).toBe('has-session');
    });

    it('define loading=false após carregar sessão', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });
      
      renderWithProvider(<TestConsumer />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('define loading=false mesmo sem sessão', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      });
      
      renderWithProvider(<TestConsumer />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  describe('Listener de mudança de estado (onAuthStateChange)', () => {
    it('configura listener ao montar', () => {
      mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      
      renderWithProvider(<TestConsumer />);
      
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalledTimes(1);
      expect(authStateChangeCallback).not.toBeNull();
    });

    it('atualiza estado quando recebe evento SIGNED_IN', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      
      renderWithProvider(<TestConsumer />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      
      // Simulate login event
      authStateChangeCallback?.('SIGNED_IN', mockSession);
      
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      });
    });

    it('atualiza estado quando recebe evento SIGNED_OUT', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });
      
      renderWithProvider(<TestConsumer />);
      
      // Wait for initial load with session
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      });
      
      // Simulate logout event
      authStateChangeCallback?.('SIGNED_OUT', null);
      
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(screen.getByTestId('session').textContent).toBe('no-session');
      });
    });

    it('atualiza estado quando recebe evento TOKEN_REFRESHED', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      
      renderWithProvider(<TestConsumer />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      
      // Simulate token refresh with new session
      const newSession = {
        ...mockSession,
        access_token: 'new-access-token',
        user: { ...mockSession.user, email: 'updated@example.com' },
      };
      
      authStateChangeCallback?.('TOKEN_REFRESHED', newSession);
      
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('updated@example.com');
      });
    });
  });

  describe('Cleanup', () => {
    it('cancela subscription ao desmontar', () => {
      mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      
      const { unmount } = renderWithProvider(<TestConsumer />);
      
      unmount();
      
      expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});

// ============================================================
// useAuth HOOK TESTS
// ============================================================

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('retorna contexto dentro do provider', () => {
    renderWithProvider(<TestConsumer />);
    
    // Should render without throwing
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByTestId('user')).toBeInTheDocument();
    expect(screen.getByTestId('session')).toBeInTheDocument();
  });

  it('lança erro fora do provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });
});

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe('AuthContext Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fluxo completo: sem sessão → login → logout', async () => {
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    
    renderWithProvider(<TestConsumer />);
    
    // 1. Initial state: no session
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
    
    // 2. User logs in
    authStateChangeCallback?.('SIGNED_IN', mockSession);
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      expect(screen.getByTestId('session').textContent).toBe('has-session');
    });
    
    // 3. User logs out
    authStateChangeCallback?.('SIGNED_OUT', null);
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('session').textContent).toBe('no-session');
    });
  });

  it('persiste sessão após refresh da página (simulado)', async () => {
    // Simulate page refresh with existing session
    mockSupabaseAuth.getSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    });
    
    renderWithProvider(<TestConsumer />);
    
    // Should restore session from storage
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      expect(screen.getByTestId('session').textContent).toBe('has-session');
    });
  });
});
