import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Smartphone, RefreshCw, CheckCircle, XCircle, QrCode, Wifi, WifiOff, RotateCcw, Send, MessageSquare, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EvolutionWebhookDiagnostics } from "./EvolutionWebhookDiagnostics";

interface ConnectionStatus {
  id?: string;
  is_connected: boolean;
  connection_status: string;
  instance_name: string;
  qr_code_base64: string | null;
  last_connection_check: string | null;
  evolution_api_url: string | null;
  forward_to_phone: string | null;
}

interface EvolutionPayload {
  qrCode?: string | null;
  state?: string;
  instance?: string;
  exists?: boolean;
  connected?: boolean;
  success?: boolean;
  regenerated?: boolean;
}

// 🔒 P11: edge function evolution-connect retorna envelope { ok, data, traceId }.
// Sempre desempacotar antes de ler campos de domínio.
type EnvelopeResp<T> =
  | { ok: true; data: T; traceId: string }
  | { ok: false; error: { code: string; message: string }; traceId: string };

function unwrapEnvelope<T>(resp: unknown): { payload: T | null; errorMessage: string | null } {
  const r = resp as EnvelopeResp<T> | null | undefined;
  if (!r) return { payload: null, errorMessage: null };
  if (r.ok === true) return { payload: r.data, errorMessage: null };
  return { payload: null, errorMessage: r.error?.message ?? 'Erro desconhecido' };
}

interface RecoveryTemplate {
  id: string;
  name: string;
  is_active: boolean;
}

const DEFAULT_EVOLUTION_API_URL = "https://api.vpspostcontrol.com";
const POLLING_INTERVAL = 10000; // 10 segundos para detectar conexão

/**
 * Normaliza URL adicionando protocolo se necessário
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

export function WhatsAppConnection() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [localQrCode, setLocalQrCode] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [instanceExists, setInstanceExists] = useState<boolean | null>(null);
  
  // Test message state
  const [templates, setTemplates] = useState<RecoveryTemplate[]>([]);
  const [testPhone, setTestPhone] = useState("");
  const [testTemplateId, setTestTemplateId] = useState<string>("");
  const [sendingTest, setSendingTest] = useState(false);

  // Forward phone state
  const [forwardPhone, setForwardPhone] = useState("");
  const [savingForward, setSavingForward] = useState(false);
  
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const loadConnectionStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('recovery_settings')
        .select('id, is_connected, connection_status, instance_name, qr_code_base64, last_connection_check, evolution_api_url, forward_to_phone')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStatus(data as ConnectionStatus);
        setSettingsId(data.id);
        setForwardPhone(data.forward_to_phone || '');
        // Não usar QR do banco - sempre buscar novo quando necessário
      } else {
        // Cria registro inicial se não existir
        const { data: newData, error: insertError } = await supabase
          .from('recovery_settings')
          .insert({
            is_connected: false,
            connection_status: 'disconnected',
            instance_name: 'masterquizz',
            evolution_api_url: DEFAULT_EVOLUTION_API_URL,
            is_active: true
          })
          .select()
          .single();

        if (insertError) {
          logger.error('Error creating initial settings:', insertError);
        } else if (newData) {
          setStatus(newData);
          setSettingsId(newData.id);
        }
      }
    } catch (error) {
      logger.error('Error loading connection status:', error);
      toast.error('Erro ao carregar status da conexão');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load templates for test message
  const loadTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('recovery_templates')
        .select('id, name, is_active')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      logger.error('Error loading templates:', error);
    }
  }, []);

  useEffect(() => {
    loadConnectionStatus();
    loadTemplates();
  }, [loadConnectionStatus, loadTemplates]);

  // Verificar status real da instância ao carregar
  useEffect(() => {
    if (!loading && status && !connecting && !checkingStatus) {
      checkRealStatus();
    }
  }, [loading, status?.id]);

  // Polling para detectar conexão quando há QR code ativo
  useEffect(() => {
    if (localQrCode && !status?.is_connected) {
      // Iniciar polling
      pollingRef.current = setInterval(() => {
        checkRealStatus(true);
      }, POLLING_INTERVAL);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    } else {
      // Parar polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [localQrCode, status?.is_connected]);

  /**
   * Verifica o status REAL da instância na Evolution API
   */
  const checkRealStatus = async (silent = false) => {
    if (!silent) setCheckingStatus(true);
    
    try {
      const apiUrl = normalizeUrl(status?.evolution_api_url || DEFAULT_EVOLUTION_API_URL);
      
      const { data: envelope, error } = await supabase.functions.invoke('evolution-connect', {
        body: { action: 'status', apiUrl }
      });

      if (error) throw error;

      const { payload: data, errorMessage } = unwrapEnvelope<EvolutionPayload>(envelope);
      if (errorMessage) {
        logger.warn('Status envelope error:', errorMessage);
        if (!silent) toast.error(errorMessage);
        return;
      }

      logger.log('Status check result:', data);

      // Instância não existe - limpar tudo
      if (data?.exists === false || data?.state === 'deleted') {
        logger.log('Instance deleted externally - clearing state');
        setInstanceExists(false);
        setLocalQrCode(null);
        
        if (settingsId) {
          await supabase
            .from('recovery_settings')
            .update({
              is_connected: false,
              connection_status: 'disconnected',
              qr_code_base64: null,
              last_connection_check: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', settingsId);
        }
        
        setStatus(prev => prev ? { 
          ...prev, 
          is_connected: false, 
          connection_status: 'disconnected',
          qr_code_base64: null 
        } : null);
        
        if (!silent) {
          toast.info('Instância WhatsApp não encontrada. Clique em "Gerar QR Code" para criar.');
        }
        return;
      }

      setInstanceExists(true);
      const isConnected = data?.connected === true || data?.state === 'connected' || data?.state === 'open';
      
      // Atualiza no banco
      if (settingsId) {
        await supabase
          .from('recovery_settings')
          .update({
            is_connected: isConnected,
            connection_status: isConnected ? 'connected' : 'disconnected',
            qr_code_base64: isConnected ? null : localQrCode,
            last_connection_check: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', settingsId);
      }

      if (isConnected) {
        setLocalQrCode(null);
        setStatus(prev => prev ? { 
          ...prev, 
          is_connected: true, 
          connection_status: 'connected',
          qr_code_base64: null 
        } : null);
        
        if (!silent) {
          toast.success('WhatsApp conectado com sucesso!');
        } else if (!status?.is_connected) {
          // Detectou conexão via polling
          toast.success('WhatsApp conectado!');
        }
      } else {
        setStatus(prev => prev ? { 
          ...prev, 
          is_connected: false, 
          connection_status: 'disconnected'
        } : null);
        
        if (!silent) {
          toast.info('WhatsApp não está conectado');
        }
      }
    } catch (error) {
      logger.error('Error checking real status:', error);
      if (!silent) {
        toast.error('Erro ao verificar status');
      }
    } finally {
      if (!silent) setCheckingStatus(false);
    }
  };

  /**
   * Conectar e gerar NOVO QR Code
   */
  const handleConnect = async () => {
    setConnecting(true);
    setLocalQrCode(null);
    
    try {
      const apiUrl = normalizeUrl(status?.evolution_api_url || DEFAULT_EVOLUTION_API_URL);
      
      logger.log('Connecting with URL:', apiUrl);
      
      const { data, error } = await supabase.functions.invoke<EvolutionResponse>('evolution-connect', {
        body: { action: 'connect', apiUrl }
      });

      if (error) throw error;

      logger.log('Connect response:', data);

      // Já está conectado
      if (data?.state === 'connected') {
        setInstanceExists(true);
        setStatus(prev => prev ? { 
          ...prev, 
          is_connected: true, 
          connection_status: 'connected'
        } : null);
        toast.success('WhatsApp já está conectado!');
        return;
      }

      // Tem QR Code
      if (data?.qrCode) {
        setInstanceExists(true);
        setLocalQrCode(data.qrCode);
        
        // Atualiza no banco
        if (settingsId) {
          await supabase
            .from('recovery_settings')
            .update({
              qr_code_base64: data.qrCode,
              connection_status: 'waiting_qr',
              evolution_api_url: apiUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', settingsId);
        }
        
        toast.success(data.regenerated 
          ? 'Instância recriada! Escaneie o novo QR Code' 
          : 'QR Code gerado! Escaneie com o WhatsApp');
      } else {
        logger.warn('No QR code in response:', data);
        toast.error('QR Code não recebido. Verifique a configuração da API.');
      }
    } catch (error) {
      logger.error('Error connecting:', error);
      toast.error('Erro ao conectar. Verifique a URL da API.');
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Regenerar QR Code (força novo QR)
   */
  const handleRegenerateQR = async () => {
    setLocalQrCode(null);
    await handleConnect();
  };

  const handleDisconnect = async () => {
    try {
      const apiUrl = normalizeUrl(status?.evolution_api_url || DEFAULT_EVOLUTION_API_URL);
      
      const { error } = await supabase.functions.invoke('evolution-connect', {
        body: { action: 'disconnect', apiUrl }
      });

      if (error) throw error;

      // Atualiza no banco
      if (settingsId) {
        await supabase
          .from('recovery_settings')
          .update({
            is_connected: false,
            connection_status: 'disconnected',
            qr_code_base64: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', settingsId);
      }

      setLocalQrCode(null);
      setStatus(prev => prev ? { 
        ...prev, 
        is_connected: false, 
        connection_status: 'disconnected',
        qr_code_base64: null 
      } : null);
      
      toast.success('WhatsApp desconectado');
    } catch (error) {
      logger.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar');
    }
  };

  /**
   * Enviar mensagem de teste
   */
  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      toast.error('Informe o número de telefone');
      return;
    }
    if (!testTemplateId) {
      toast.error('Selecione um template');
      return;
    }

    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-message', {
        body: { 
          templateId: testTemplateId,
          phoneNumber: testPhone.trim()
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success('Mensagem de teste enviada com sucesso!');
        setTestPhone("");
        setTestTemplateId("");
      }
    } catch (error) {
      logger.error('Error sending test:', error);
      toast.error('Erro ao enviar mensagem de teste');
    } finally {
      setSendingTest(false);
    }
  };

  const displayQrCode = localQrCode;

  if (loading && !status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Conexão WhatsApp
              </CardTitle>
              <CardDescription>
                Conecte sua instância WhatsApp via Evolution API para enviar mensagens de recuperação
              </CardDescription>
            </div>
            <Badge 
              variant={status?.is_connected ? "default" : "secondary"}
              className={status?.is_connected ? "bg-green-500" : ""}
            >
              {status?.is_connected ? (
                <><Wifi className="h-3 w-3 mr-1" /> Conectado</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Display */}
          {displayQrCode && !status?.is_connected && (
            <Card className="bg-muted/50 border-primary/20">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Escaneie o QR Code abaixo com o WhatsApp do número que será usado para enviar mensagens
                </p>
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <img 
                    src={displayQrCode.startsWith('data:') ? displayQrCode : `data:image/png;base64,${displayQrCode}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                    onError={(e) => {
                      logger.error('QR Code image failed to load');
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  O QR Code expira em 45 segundos. Verificação automática a cada 10s.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => checkRealStatus()}
                    disabled={checkingStatus}
                  >
                    {checkingStatus ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando...</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" /> Verificar Status</>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleRegenerateQR}
                    disabled={connecting}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Regenerar QR
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações quando não há QR code e não está conectado */}
          {!displayQrCode && !status?.is_connected && (
            <div className="flex flex-col items-center gap-4 py-8">
              {connecting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Gerando QR Code...</p>
                </div>
              ) : (
                <>
                  <QrCode className="h-16 w-16 text-muted-foreground/50" />
                  {instanceExists === false && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                      ⚠️ Instância não encontrada na Evolution API
                    </p>
                  )}
                  <p className="text-muted-foreground text-center">
                    Clique abaixo para gerar um novo QR Code
                  </p>
                  <Button onClick={handleConnect} size="lg">
                    <QrCode className="h-4 w-4 mr-2" /> Gerar QR Code
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Connection Info - Quando conectado */}
          {status?.is_connected && (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        WhatsApp conectado com sucesso!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Instância: {status.instance_name || 'masterquizz'}
                      </p>
                      {status.last_connection_check && (
                        <p className="text-xs text-muted-foreground">
                          Última verificação: {new Date(status.last_connection_check).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => checkRealStatus()}
                      disabled={checkingStatus}
                    >
                      <RefreshCw className={`h-4 w-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                      <XCircle className="h-4 w-4 mr-1" /> Desconectar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Forward Config - Só aparece quando conectado */}
      {status?.is_connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5" />
              Encaminhamento de Mensagens
            </CardTitle>
            <CardDescription>
              Receba no seu WhatsApp pessoal uma cópia de cada mensagem que chegar no número do MasterQuiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="5511999999999"
                value={forwardPhone}
                onChange={(e) => setForwardPhone(e.target.value)}
                className="max-w-xs"
              />
              <Button
                size="sm"
                disabled={savingForward}
                onClick={async () => {
                  if (!settingsId) return;
                  setSavingForward(true);
                  try {
                    const { error } = await supabase
                      .from('recovery_settings')
                      .update({ forward_to_phone: forwardPhone || null } as any)
                      .eq('id', settingsId);
                    if (error) throw error;
                    toast.success(forwardPhone ? 'Encaminhamento ativado!' : 'Encaminhamento desativado');
                  } catch (err) {
                    toast.error('Erro ao salvar');
                    logger.error(err);
                  } finally {
                    setSavingForward(false);
                  }
                }}
              >
                {savingForward ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {forwardPhone
                ? `✅ Mensagens serão encaminhadas para ${forwardPhone}`
                : 'Deixe vazio para desativar o encaminhamento'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Test Message Card - Só aparece quando conectado */}
      {status?.is_connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Enviar Mensagem de Teste
            </CardTitle>
            <CardDescription>
              Teste a conexão enviando uma mensagem para qualquer número usando um template existente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="test_phone">Número de Telefone</Label>
                <Input
                  id="test_phone"
                  type="tel"
                  placeholder="5511999999999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Com código do país (55 para Brasil) + DDD + número
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_template">Template</Label>
                <Select value={testTemplateId} onValueChange={setTestTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} {!template.is_active && "(inativo)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Variáveis serão substituídas por dados fictícios de teste
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSendTest} 
              disabled={sendingTest || !testPhone.trim() || !testTemplateId}
              className="w-full md:w-auto"
            >
              {sendingTest ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Enviar Mensagem de Teste</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Diagnóstico do Webhook (Etapa 2) */}
      <EvolutionWebhookDiagnostics />

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <h4 className="font-medium">Escaneie o QR Code</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-10">
                Use o WhatsApp do número que enviará as mensagens para escanear o código
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <h4 className="font-medium">Conexão Automática</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-10">
                O sistema detecta automaticamente quando você escaneia o QR Code
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </div>
                <h4 className="font-medium">Pronto!</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-10">
                O sistema está configurado para enviar mensagens automáticas de recuperação
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
