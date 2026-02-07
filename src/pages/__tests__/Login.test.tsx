import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

// ============================================================
// MOCKS
// ============================================================

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getSession: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'login.emailLabel': 'Email',
        'login.emailPlaceholder': 'seu@email.com',
        'login.passwordLabel': 'Senha',
        'login.passwordPlaceholder': '••••••••',
        'login.confirmPasswordLabel': 'Confirmar Senha',
        'login.confirmPasswordPlaceholder': '••••••••',
        'login.nameLabel': 'Nome',
        'login.namePlaceholder': 'Seu nome',
        'login.whatsappLabel': 'WhatsApp',
        'login.whatsappPlaceholder': '(00) 00000-0000',
        'login.backToHome': 'Voltar para Home',
        'login.loginButton': 'Entrar',
        'login.registerButton': 'Cadastrar',
        'login.loginTab': 'Login',
        'login.registerTab': 'Cadastro',
        'login.welcomeBack': 'Bem-vindo de volta',
        'login.loginDescription': 'Entre com suas credenciais',
        'login.createAccount': 'Criar conta',
        'login.registerDescription': 'Preencha os dados abaixo',
        'login.subtitle': 'Plataforma de quizzes',
        'login.forgotPassword': 'Esqueceu a senha?',
        'login.invalidCredentials': 'Email ou senha incorretos',
        'login.loginError': 'Erro ao fazer login',
        'login.loginSuccess': 'Login realizado com sucesso',
        'login.passwordMismatch': 'As senhas não coincidem',
        'login.passwordMinLength': 'A senha deve ter no mínimo 6 caracteres',
        'login.emailAlreadyRegistered': 'Este email já está cadastrado',
        'login.registerError': 'Erro ao cadastrar',
        'login.registerSuccess': 'Cadastro realizado com sucesso',
        'login.loggingIn': 'Entrando...',
        'login.passwordStrength': 'Força da senha',
        'login.passwordWeak': 'Fraca',
        'login.passwordMedium': 'Média',
        'login.passwordStrong': 'Forte',
        'login.passwordsDoNotMatch': 'As senhas não coincidem',
        'login.resetPasswordTitle': 'Recuperar Senha',
        'login.resetPasswordDesc': 'Digite seu email para recuperar',
        'login.resetSuccess': 'Email enviado',
        'login.resetError': 'Erro ao enviar email',
        'login.showPassword': 'Mostrar senha',
        'login.hidePassword': 'Ocultar senha',
        'common.loading': 'Carregando',
      };
      return translations[key] || fallback || key;
    },
    i18n: { language: 'pt' },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auditLogger', () => ({
  logAuthAction: vi.fn(),
}));

vi.mock('@/hooks/useRateLimit', () => ({
  useRateLimit: () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  }),
}));

vi.mock('@/lib/ipCache', () => ({
  fetchIPWithCache: vi.fn().mockResolvedValue('127.0.0.1'),
}));

// ============================================================
// TESTS
// ============================================================

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Renderização inicial', () => {
    it('renderiza formulário de login por padrão', () => {
      render(<Login />);
      
      expect(screen.getByText('MasterQuiz')).toBeInTheDocument();
      expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
    });

    it('renderiza campos de email e senha', () => {
      render(<Login />);
      
      expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('renderiza botão voltar para home', () => {
      render(<Login />);
      
      expect(screen.getByText('Voltar para Home')).toBeInTheDocument();
    });

    it('renderiza tabs de Login e Cadastro', () => {
      render(<Login />);
      
      expect(screen.getByRole('tab', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Cadastro' })).toBeInTheDocument();
    });

    it('renderiza link de esqueceu a senha', () => {
      render(<Login />);
      
      expect(screen.getByText('Esqueceu a senha?')).toBeInTheDocument();
    });
  });

  describe('Alternância Login/Signup', () => {
    it('alterna para formulário de cadastro ao clicar na tab', async () => {
      const user = userEvent.setup();
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      expect(screen.getByText('Criar conta')).toBeInTheDocument();
    });

    it('mostra campos adicionais no formulário de cadastro', async () => {
      const user = userEvent.setup();
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      // Campos de nome e whatsapp só aparecem no cadastro
      expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('(00) 00000-0000')).toBeInTheDocument();
    });

    it('volta para login ao clicar na tab', async () => {
      const user = userEvent.setup();
      render(<Login />);
      
      // Vai para cadastro
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      expect(screen.getByText('Criar conta')).toBeInTheDocument();
      
      // Volta para login
      await user.click(screen.getByRole('tab', { name: 'Login' }));
      expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
    });
  });

  describe('Visibilidade da senha', () => {
    it('alterna visibilidade da senha', async () => {
      const user = userEvent.setup();
      render(<Login />);
      
      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      const toggleButton = screen.getByRole('button', { name: /mostrar senha/i });
      await user.click(toggleButton);
      
      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Submissão do Login', () => {
    it('envia formulário de login com credenciais válidas', async () => {
      const user = userEvent.setup();
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
      
      render(<Login />);
      
      await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Entrar' }));
      
      await waitFor(() => {
        expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('redireciona para dashboard após login bem-sucedido', async () => {
      const user = userEvent.setup();
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
      
      render(<Login />);
      
      await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Entrar' }));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('mostra toast de sucesso após login', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
      
      render(<Login />);
      
      await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Entrar' }));
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Login realizado com sucesso');
      });
    });
  });

  describe('Erros de Login', () => {
    it('mostra erro para credenciais inválidas', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({ 
        data: {}, 
        error: { message: 'Invalid login credentials' } 
      });
      
      render(<Login />);
      
      await user.type(screen.getByPlaceholderText('seu@email.com'), 'wrong@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'Entrar' }));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email ou senha incorretos');
      }, { timeout: 5000 });
    });

    it('mostra erro genérico para outros erros', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({ 
        data: {}, 
        error: { message: 'Network error' } 
      });
      
      render(<Login />);
      
      await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Entrar' }));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao fazer login');
      }, { timeout: 5000 });
    });
  });

  describe('Validação de Cadastro', () => {
    it('mostra erro quando senhas não coincidem', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      await user.type(screen.getByPlaceholderText('Seu nome'), 'Test User');
      await user.type(screen.getByPlaceholderText('(00) 00000-0000'), '11999999999');
      
      // Preencher email no cadastro
      const emailInputs = screen.getAllByPlaceholderText('seu@email.com');
      await user.type(emailInputs[1], 'test@example.com');
      
      // Preencher senhas diferentes
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[1], 'password123');
      await user.type(passwordInputs[2], 'differentpassword');
      
      await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('As senhas não coincidem');
      });
    });

    it('mostra erro quando senha é muito curta', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      await user.type(screen.getByPlaceholderText('Seu nome'), 'Test User');
      await user.type(screen.getByPlaceholderText('(00) 00000-0000'), '11999999999');
      
      const emailInputs = screen.getAllByPlaceholderText('seu@email.com');
      await user.type(emailInputs[1], 'test@example.com');
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[1], '12345');
      await user.type(passwordInputs[2], '12345');
      
      await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('A senha deve ter no mínimo 6 caracteres');
      });
    });

    it('mostra indicador de senhas não coincidem em tempo real', async () => {
      const user = userEvent.setup();
      
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[1], 'password123');
      await user.type(passwordInputs[2], 'different');
      
      expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
    });
  });

  describe('Indicador de força da senha', () => {
    it('mostra força "Fraca" para senha curta', async () => {
      const user = userEvent.setup();
      
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[1], '123');
      
      expect(screen.getByText(/Fraca/i)).toBeInTheDocument();
    });

    it('mostra força "Média" para senha razoável', async () => {
      const user = userEvent.setup();
      
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[1], 'senha123');
      
      expect(screen.getByText(/Média/i)).toBeInTheDocument();
    });

    it('mostra força "Forte" para senha complexa', async () => {
      const user = userEvent.setup();
      
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[1], 'Senha@123');
      
      expect(screen.getByText(/Forte/i)).toBeInTheDocument();
    });
  });

  describe('Cadastro bem-sucedido', () => {
    it('redireciona para dashboard após cadastro', async () => {
      const user = userEvent.setup();
      mockSupabaseAuth.signUp.mockResolvedValue({ data: {}, error: null });
      
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      await user.type(screen.getByPlaceholderText('Seu nome'), 'Test User');
      await user.type(screen.getByPlaceholderText('(00) 00000-0000'), '11999999999');
      
      const emailInputs = screen.getAllByPlaceholderText('seu@email.com');
      await user.type(emailInputs[1], 'test@example.com');
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[1], 'password123');
      await user.type(passwordInputs[2], 'password123');
      
      await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Erro de email já cadastrado', () => {
    it('mostra mensagem apropriada para email duplicado', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      mockSupabaseAuth.signUp.mockResolvedValue({ 
        data: {}, 
        error: { message: 'User already registered' } 
      });
      
      render(<Login />);
      
      await user.click(screen.getByRole('tab', { name: 'Cadastro' }));
      
      await user.type(screen.getByPlaceholderText('Seu nome'), 'Test User');
      await user.type(screen.getByPlaceholderText('(00) 00000-0000'), '11999999999');
      
      const emailInputs = screen.getAllByPlaceholderText('seu@email.com');
      await user.type(emailInputs[1], 'existing@example.com');
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[1], 'password123');
      await user.type(passwordInputs[2], 'password123');
      
      await user.click(screen.getByRole('button', { name: 'Cadastrar' }));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Este email já está cadastrado');
      });
    });
  });

  describe('Redirecionamento se já logado', () => {
    it('redireciona para dashboard se usuário já está logado', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: '123' } } }, 
        error: null 
      });
      
      render(<Login />);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Recuperação de senha', () => {
    it('abre modal de recuperação ao clicar em "Esqueceu a senha?"', async () => {
      const user = userEvent.setup();
      render(<Login />);
      
      await user.click(screen.getByText('Esqueceu a senha?'));
      
      expect(screen.getByText('Recuperar Senha')).toBeInTheDocument();
    });
  });
});
