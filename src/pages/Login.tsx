import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { logAuthAction } from "@/lib/auditLogger";
import { useRateLimit } from "@/hooks/useRateLimit";
import { fetchIPWithCache } from "@/lib/ipCache";
import { Eye, EyeOff, ArrowLeft, Loader2, XCircle } from "lucide-react";
import { PhoneInput, isValidPhoneForCountry } from "@/components/ui/phone-input";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { checkRateLimit } = useRateLimit();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [migrateEmail, setMigrateEmail] = useState('');
  const [migratePassword, setMigratePassword] = useState('');
  const [migrateConfirmPassword, setMigrateConfirmPassword] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [showMigratePassword, setShowMigratePassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    whatsapp: ''
  });


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  // ✅ FASE 3: Usar cache de IP para evitar chamadas repetidas
  const getIpAddress = async (): Promise<string> => {
    return await fetchIPWithCache(3000) || 'unknown';
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { email, password } = formData;
    const ipAddress = await getIpAddress();
    
    const rateLimitCheck = await checkRateLimit('auth:login', ipAddress);
    if (!rateLimitCheck.allowed) {
      setIsLoading(false);
      return;
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      logAuthAction("auth:login_failed", email, { reason: error.message });
      
      if (error.message.includes('Invalid login credentials')) {
        // Check if this is an imported user (orphan profile)
        try {
          const { data } = await supabase.functions.invoke('check-imported-user', {
            body: { email },
          });
          if (data?.exists) {
            setMigrateEmail(email);
            setShowMigrateModal(true);
            setIsLoading(false);
            return;
          }
        } catch (checkErr) {
          console.error('[CHECK-IMPORTED] Error:', checkErr);
        }
        toast.error(t('login.invalidCredentials'));
      } else {
        toast.error(t('login.loginError'));
      }
      setIsLoading(false);
      return;
    }
    
    logAuthAction("auth:login_success", email);
    toast.success(t('login.loginSuccess'));
    navigate('/dashboard');
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { email, password, name, whatsapp } = formData;
    
    if (password.length < 6) {
      toast.error(t('login.passwordMinLength'));
      setIsLoading(false);
      return;
    }

    // Validar WhatsApp se preenchido
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/\D/g, '');
      // Tentar detectar país pelo DDI para validar tamanho mínimo
      const countries = [
        { ddi: '598', code: 'UY', min: 8 },
        { ddi: '351', code: 'PT', min: 9 },
        { ddi: '55', code: 'BR', min: 10 },
        { ddi: '54', code: 'AR', min: 10 },
        { ddi: '57', code: 'CO', min: 10 },
        { ddi: '56', code: 'CL', min: 9 },
        { ddi: '52', code: 'MX', min: 10 },
        { ddi: '51', code: 'PE', min: 9 },
        { ddi: '34', code: 'ES', min: 9 },
        { ddi: '1', code: 'US', min: 10 },
      ];
      const sorted = [...countries].sort((a, b) => b.ddi.length - a.ddi.length);
      let localLen = cleanNumber.length;
      for (const c of sorted) {
        if (cleanNumber.startsWith(c.ddi)) {
          localLen = cleanNumber.length - c.ddi.length;
          if (localLen < c.min) {
            toast.error(`Número de telefone incompleto. Digite o DDD + número completo.`);
            setIsLoading(false);
            return;
          }
          break;
        }
      }
    }
    
    const ipAddress = await getIpAddress();
    const rateLimitCheck = await checkRateLimit('auth:register', ipAddress);
    if (!rateLimitCheck.allowed) {
      setIsLoading(false);
      return;
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: name,
          whatsapp: whatsapp
        }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error(t('login.emailAlreadyRegistered'));
      } else {
        toast.error(t('login.registerError'));
      }
      setIsLoading(false);
      return;
    }
    
    logAuthAction("auth:signup", email, { name, hasWhatsapp: !!whatsapp });
    toast.success(t('login.registerSuccess'));
     
     // Flag para disparar evento GTM account_created no Dashboard
     localStorage.setItem('mq_just_registered', 'true');
     
    // Novos usuários vão para /start (fast-path para criar primeiro quiz)
    navigate('/start');
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error(t('login.enterEmail', 'Digite seu email'));
      return;
    }
    
    setIsResetting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/login?reset=true`,
    });
    
    if (error) {
      toast.error(t('login.resetError', 'Erro ao enviar email de recuperação'));
    } else {
      toast.success(t('login.resetSuccess', 'Email de recuperação enviado! Verifique sua caixa de entrada.'));
      setShowResetModal(false);
      setResetEmail('');
    }
    
    setIsResetting(false);
  };

  const handleMigrateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (migratePassword.length < 6) {
      toast.error(t('login.passwordMinLength'));
      return;
    }
    if (migratePassword !== migrateConfirmPassword) {
      toast.error(t('login.passwordMismatch'));
      return;
    }
    setIsMigrating(true);
    
    try {
      // Use server-side migration (creates auth user with auto-confirm + merges data)
      const { data, error: fnError } = await supabase.functions.invoke('migrate-imported-user', {
        body: { email: migrateEmail, password: migratePassword },
      });
      
      if (fnError || data?.error) {
        const msg = data?.error || fnError?.message || 'Erro ao migrar conta';
        if (data?.already_exists) {
          // Account exists and was confirmed, just sign in
        } else {
          toast.error(msg);
          setIsMigrating(false);
          return;
        }
      }
      
      // Now sign in with the new credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: migrateEmail,
        password: migratePassword,
      });
      
      if (signInError) {
        toast.error(signInError.message);
        setIsMigrating(false);
        return;
      }
      
      logAuthAction("auth:signup", migrateEmail);
      toast.success(t('login.accountMigrated', 'Conta recuperada com sucesso! Seus dados foram restaurados.'));
      setShowMigrateModal(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('[MIGRATE] Error:', err);
      toast.error('Erro inesperado ao migrar conta');
    }
    setIsMigrating(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('login.backToHome', 'Voltar para Home')}
          </Link>
        </Button>
      </div>
      
      <div className="absolute top-4 right-4">
        <LanguageSwitch />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-4xl">🎯</div>
            <h1 className="text-4xl font-bold text-foreground">MasterQuiz</h1>
          </div>
          <p className="text-muted-foreground">{t('login.subtitle')}</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('login.loginTab')}</TabsTrigger>
            <TabsTrigger value="register">{t('login.registerTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t('login.welcomeBack')}</CardTitle>
                <CardDescription>{t('login.loginDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('login.emailLabel')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t('login.emailPlaceholder')}
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      aria-label={t('login.emailLabel')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('login.passwordPlaceholder')}
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        aria-label={t('login.passwordLabel')}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('login.hidePassword', 'Ocultar senha') : t('login.showPassword', 'Mostrar senha')}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm p-0 h-auto"
                      onClick={() => setShowResetModal(true)}
                    >
                      {t('login.forgotPassword', 'Esqueceu a senha?')}
                    </Button>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('login.loggingIn')}
                      </>
                    ) : (
                      t('login.loginButton')
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>{t('login.createAccount')}</CardTitle>
                <CardDescription>{t('login.registerDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">{t('login.nameLabel')}</Label>
                    <Input
                      id="register-name"
                      name="name"
                      type="text"
                      placeholder={t('login.namePlaceholder')}
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      aria-label={t('login.nameLabel')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-whatsapp">{t('login.whatsappLabel')}</Label>
                    <PhoneInput
                      id="register-whatsapp"
                      value={formData.whatsapp}
                      onChange={(val: string) => setFormData(prev => ({ ...prev, whatsapp: val }))}
                      required
                      aria-label={t('login.whatsappLabel')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('login.whatsappHint', 'Selecione o país e digite apenas o número')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">{t('login.emailLabel')}</Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder={t('login.emailPlaceholder')}
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      aria-label={t('login.emailLabel')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">{t('login.passwordLabel')}</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('login.passwordPlaceholder')}
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        aria-label={t('login.passwordLabel')}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('login.passwordHint', 'Mínimo 6 caracteres')}</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}...
                      </>
                    ) : (
                      t('login.registerButton')
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Reset Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('login.resetPasswordTitle', 'Recuperar Senha')}</DialogTitle>
            <DialogDescription>
              {t('login.resetPasswordDesc', 'Digite seu email para receber o link de recuperação de senha.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t('login.emailLabel')}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                aria-label={t('login.emailLabel')}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowResetModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isResetting}>
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('login.sending', 'Enviando...')}
                  </>
                ) : (
                  t('login.sendResetLink', 'Enviar Link')
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Migration Modal */}
      <Dialog open={showMigrateModal} onOpenChange={setShowMigrateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('login.migrateTitle', 'Encontramos sua conta!')}</DialogTitle>
            <DialogDescription>
              {t('login.migrateDesc', 'Seu email já possui dados cadastrados. Defina uma nova senha para recuperar sua conta e todos os seus dados serão restaurados automaticamente.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMigrateAccount} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('login.emailLabel')}</Label>
              <Input value={migrateEmail} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="migrate-password">{t('login.newPassword', 'Nova Senha')}</Label>
              <div className="relative">
                <Input
                  id="migrate-password"
                  type={showMigratePassword ? 'text' : 'password'}
                  placeholder={t('login.passwordPlaceholder')}
                  value={migratePassword}
                  onChange={(e) => setMigratePassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowMigratePassword(!showMigratePassword)}
                >
                  {showMigratePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="migrate-confirm">{t('login.confirmPasswordLabel')}</Label>
              <Input
                id="migrate-confirm"
                type="password"
                placeholder={t('login.confirmPasswordPlaceholder')}
                value={migrateConfirmPassword}
                onChange={(e) => setMigrateConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              {migrateConfirmPassword && migratePassword !== migrateConfirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {t('login.passwordsDoNotMatch', 'As senhas não coincidem')}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowMigrateModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isMigrating}>
                {isMigrating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('login.migrating', 'Recuperando...')}
                  </>
                ) : (
                  t('login.migrateButton', 'Recuperar Conta')
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Login;
