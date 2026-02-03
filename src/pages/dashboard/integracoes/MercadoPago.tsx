import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, QrCode, CheckCircle, AlertCircle, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserDataApi } from "@/hooks/useUserDataApi";
import { useNavigate } from "react-router-dom";

interface PixPaymentData {
  payerFirstName: string;
  payerLastName: string;
  email: string;
  identificationType: string;
  identificationNumber: string;
  transactionAmount: string;
  description: string;
}

interface PixResponse {
  success: boolean;
  order_id?: string;
  status?: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  payment_id?: string;
  message?: string;
}

const MercadoPago: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userData, isLoading: loadingUserData } = useUserDataApi();
  const [loading, setLoading] = useState(false);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<Array<{id: string, name: string}>>([]);
  const [pixResponse, setPixResponse] = useState<PixResponse | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  const [formData, setFormData] = useState<PixPaymentData>({
    payerFirstName: '',
    payerLastName: '',
    email: '',
    identificationType: 'CPF',
    identificationNumber: '',
    transactionAmount: '100.00',
    description: 'Recarga PIX'
  });

  // Auto-preencher dados do usuário
  useEffect(() => {
    if (userData) {
      const fullName = userData.full_name || '';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        payerFirstName: firstName.toUpperCase(),
        payerLastName: lastName.toUpperCase(),
        email: userData.email?.toLowerCase() || '', // Email em minúsculas
        identificationType: userData.cpf ? 'CPF' : 'CPF',
        identificationNumber: userData.cpf ? userData.cpf.replace(/\D/g, '') : ''
      }));
    }
  }, [userData]);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!pixResponse?.payment_id || pixResponse?.status === 'approved') {
      console.log('🔄 [POLLING] Polling desabilitado:', {
        hasPaymentId: !!pixResponse?.payment_id,
        status: pixResponse?.status
      });
      return;
    }

    console.log('🔄 [POLLING] Iniciando polling para payment_id:', pixResponse.payment_id);

    const checkPaymentStatus = async () => {
      try {
        console.log('🔄 [POLLING] Verificando status do pagamento...');
        console.log('🔄 [POLLING] Timestamp:', new Date().toLocaleTimeString());
        
        // Usar endpoint que consulta API do MP ao vivo
        const response = await fetch(
          `${API_BASE_URL}/mercadopago/check-payment-status-live.php?payment_id=${pixResponse.payment_id}`
        );

        console.log('🔄 [POLLING] Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('🔄 [POLLING] Response data:', data);
          
          if (data.success && data.data) {
            const newStatus = data.data.status;
            const wasUpdated = data.data.db_updated;
            
            console.log('🔄 [POLLING] Status recebido:', newStatus);
            console.log('🔄 [POLLING] Banco atualizado?', wasUpdated);
            console.log('🔄 [POLLING] Status atual local:', pixResponse.status);
            
            if (newStatus === 'approved' && pixResponse.status !== 'approved') {
              console.log('🔄 [POLLING] 🎉 PAGAMENTO APROVADO!');
              
              setPixResponse(prev => prev ? { ...prev, status: 'approved' } : null);
              
              // Notificação de sucesso
              toast.success('🎉 Pagamento Aprovado!', {
                description: 'Seu saldo foi creditado com sucesso.',
                duration: 3000,
              });
              
              // Redirecionar para dashboard após 2 segundos
              setTimeout(() => {
                console.log('🔄 [POLLING] Redirecionando para dashboard...');
                window.location.href = '/dashboard';
              }, 2000);
            } else if (newStatus !== pixResponse.status) {
              console.log('🔄 [POLLING] Status mudou de', pixResponse.status, 'para', newStatus);
              
              setPixResponse(prev => prev ? { ...prev, status: newStatus } : null);
              
              // Notificar sobre mudanças de status
              if (newStatus === 'rejected') {
                toast.error('Pagamento rejeitado', {
                  description: 'O pagamento não foi aprovado.'
                });
              } else if (newStatus === 'cancelled') {
                toast.warning('Pagamento cancelado');
              }
            } else {
              console.log('🔄 [POLLING] Status não mudou, continua:', newStatus);
            }
          }
        } else {
          console.error('🔄 [POLLING] Erro na resposta:', response.status);
        }
      } catch (error) {
        console.error('🔄 [POLLING] ❌ Erro ao verificar status:', error);
      }
    };

    // Verificar a cada 3 segundos
    const interval = setInterval(checkPaymentStatus, 3000);
    
    // Primeira verificação imediata
    checkPaymentStatus();

    return () => {
      console.log('🔄 [POLLING] Limpando intervalo de polling');
      clearInterval(interval);
    };
  }, [pixResponse?.payment_id, pixResponse?.status]);

  // URL da API externa
  const API_BASE_URL = 'https://api.artepuradesign.com.br';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Email sempre em minúsculas, nomes em maiúsculas
    if (name === 'email') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toLowerCase()
      }));
    } else if (name === 'identificationNumber') {
      // Permitir apenas números e limitar tamanho
      const numericValue = value.replace(/\D/g, '');
      const maxLength = formData.identificationType === 'CPF' ? 11 : 14;
      setFormData(prev => ({
        ...prev,
        [name]: numericValue.substring(0, maxLength)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      identificationType: value
    }));
  };

  const loadDocumentTypes = async () => {
    setLoadingDocTypes(true);
    try {
      const response = await fetch(`${API_BASE_URL}/mercadopago/document-types.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar tipos de documento');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setDocumentTypes(data.data);
        toast.success('Tipos de documento carregados!');
      } else {
        // Fallback para tipos padrão
        setDocumentTypes([
          { id: 'CPF', name: 'CPF' },
          { id: 'CNPJ', name: 'CNPJ' }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de documento:', error);
      toast.error('Erro ao carregar tipos de documento');
      // Fallback para tipos padrão
      setDocumentTypes([
        { id: 'CPF', name: 'CPF' },
        { id: 'CNPJ', name: 'CNPJ' }
      ]);
    } finally {
      setLoadingDocTypes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPixResponse(null);

    try {
      // Validações básicas
      if (!formData.payerFirstName || !formData.payerLastName || !formData.email) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      console.log('🔥 Iniciando requisição para Mercado Pago');
      console.log('🔥 URL:', `${API_BASE_URL}/mercadopago/create-pix-payment.php`);
      console.log('🔥 Dados:', formData);

      // Adicionar user_id aos dados se disponível (do contexto de autenticação)
      // Juntar nome e sobrenome para enviar como nome completo
      const fullName = `${formData.payerFirstName} ${formData.payerLastName}`.trim();
      
      const paymentData = {
        ...formData,
        payer_name: fullName, // Nome completo do pagador
        user_id: user?.id || null
      };

      console.log('🔥 Dados completos com user_id:', paymentData);

      // Chamar API externa do servidor PHP
      const response = await fetch(`${API_BASE_URL}/mercadopago/create-pix-payment.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      console.log('🔥 Response status:', response.status);
      console.log('🔥 Response ok:', response.ok);

      const responseData = await response.json();
      console.log('🔥 Response data:', responseData);

      if (!response.ok) {
        // Mostrar erro específico se o endpoint não foi encontrado
        if (response.status === 404) {
          toast.error('Endpoint não configurado no servidor', {
            description: 'O arquivo create-pix-payment.php não está disponível'
          });
        } else {
          toast.error(responseData.message || 'Erro ao processar pagamento');
        }
        return;
      }

      if (responseData.success && responseData.data) {
        // A resposta vem em responseData.data
        console.log('📦 [MERCADOPAGO] ===== RESPOSTA COMPLETA DA API =====');
        console.log('📦 [MERCADOPAGO] Payment ID:', responseData.data.payment_id);
        console.log('📦 [MERCADOPAGO] Payment ID (tipo):', typeof responseData.data.payment_id);
        console.log('📦 [MERCADOPAGO] Order ID:', responseData.data.order_id);
        console.log('📦 [MERCADOPAGO] Status:', responseData.data.status);
        console.log('📦 [MERCADOPAGO] Ticket URL:', responseData.data.ticket_url);
        console.log('📦 [MERCADOPAGO] QR Code (primeiros 50 chars):', responseData.data.qr_code?.substring(0, 50));
        console.log('📦 [MERCADOPAGO] QR Code Base64 (primeiros 50 chars):', responseData.data.qr_code_base64?.substring(0, 50));
        console.log('📦 [MERCADOPAGO] Dados completos:', responseData.data);
        console.log('📦 [MERCADOPAGO] =====================================');
        
        // ✅ SEMPRE extrair payment_id da URL do ticket (prioridade)
        let finalPaymentId = responseData.data.payment_id;
        
        if (responseData.data.ticket_url) {
          const match = responseData.data.ticket_url.match(/\/payments\/(\d+)\//);
          if (match) {
            finalPaymentId = match[1];
            console.log('📦 [MERCADOPAGO] ✅ Payment ID extraído da URL do ticket:', finalPaymentId);
            console.log('📦 [MERCADOPAGO] Payment ID original da API:', responseData.data.payment_id);
          }
        }
        
        // Usar o ID extraído da URL como principal
        const finalResponse = {
          ...responseData.data,
          payment_id: finalPaymentId
        };
        
        setPixResponse(finalResponse as PixResponse);
        toast.success('QR Code PIX gerado com sucesso!', {
          description: 'Escaneie o código ou use o PIX Copia e Cola para realizar o pagamento.',
          duration: 5000,
        });
      } else {
        toast.error(responseData.message || 'Erro ao gerar pagamento PIX');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar pagamento:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/mercadopago/test-credentials.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao testar credenciais');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Credenciais válidas! ✓', {
          description: `Ambiente: ${data.environment || 'N/A'}`
        });
      } else {
        toast.error('Credenciais inválidas', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Erro ao testar credenciais:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Integração Mercado Pago
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Teste a integração PIX com Mercado Pago via API externa
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Formulário de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Pagamento</CardTitle>
            <CardDescription>
              Preencha os dados para gerar um pagamento PIX de teste
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payerFirstName">Nome *</Label>
                  <Input
                    id="payerFirstName"
                    name="payerFirstName"
                    value={formData.payerFirstName}
                    onChange={handleInputChange}
                    placeholder="JOÃO"
                    required
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payerLastName">Sobrenome *</Label>
                  <Input
                    id="payerLastName"
                    name="payerLastName"
                    value={formData.payerLastName}
                    onChange={handleInputChange}
                    placeholder="SILVA"
                    required
                    className="uppercase"
                  />
                </div>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="teste@email.com"
                    required
                    className="lowercase"
                  />
                </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identificationType">Tipo de Documento</Label>
                  <Select 
                    value={formData.identificationType} 
                    onValueChange={handleSelectChange}
                    disabled={!!userData?.cpf}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.length > 0 ? (
                        documentTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="CPF">CPF</SelectItem>
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {userData?.cpf && (
                    <p className="text-xs text-muted-foreground">CPF já cadastrado</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identificationNumber">
                    Número do Documento ({formData.identificationType === 'CPF' ? '11 dígitos' : '14 dígitos'})
                  </Label>
                  <Input
                    id="identificationNumber"
                    name="identificationNumber"
                    value={formData.identificationNumber}
                    onChange={handleInputChange}
                    placeholder={formData.identificationType === 'CPF' ? '00000000000 (11 dígitos)' : '00000000000000 (14 dígitos)'}
                    disabled={!!userData?.cpf}
                    maxLength={formData.identificationType === 'CPF' ? 11 : 14}
                    className="uppercase"
                  />
                  {userData?.cpf ? (
                    <p className="text-xs text-muted-foreground">Bloqueado (cadastrado)</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {formData.identificationType === 'CPF' ? '11 dígitos para CPF' : '14 dígitos para CNPJ'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionAmount">Valor (R$) *</Label>
                  <Input
                    id="transactionAmount"
                    name="transactionAmount"
                    type="number"
                    step="0.01"
                    value={formData.transactionAmount}
                    onChange={handleInputChange}
                    placeholder="100.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="DESCRIÇÃO DO PAGAMENTO"
                    className="uppercase"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Gerar Pagamento PIX
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/dashboard/pagamentos/historico-pix')}
                  className="w-full"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Ver Histórico de Pagamentos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resposta do PIX */}
        <Card>
          <CardHeader className="px-4 md:px-6">
            <CardTitle className="text-base md:text-lg">Resposta do Pagamento</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              QR Code e informações do pagamento gerado
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            {!pixResponse ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                <QrCode className="w-16 h-16 mb-4 opacity-20" />
                <p>Preencha o formulário e clique em "Gerar Pagamento PIX"</p>
                <p className="text-sm mt-2">O QR Code será exibido aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Status do Pagamento</p>
                    <p className="text-xs text-muted-foreground mt-1">Order ID: {pixResponse.order_id}</p>
                    {pixResponse.payment_id && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-mono font-semibold mt-1">
                        Payment ID: {pixResponse.payment_id}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      pixResponse.status === 'approved' ? 'default' : 
                      pixResponse.status === 'pending' ? 'secondary' :
                      pixResponse.status === 'action_required' ? 'default' : 
                      pixResponse.status === 'rejected' ? 'destructive' :
                      pixResponse.status === 'cancelled' ? 'outline' :
                      'secondary'
                    }
                    className={
                      pixResponse.status === 'approved' 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : pixResponse.status === 'pending'
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : pixResponse.status === 'action_required'
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : pixResponse.status === 'in_process'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : ''
                    }
                  >
                    {pixResponse.status === 'approved' ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aprovado ✓
                      </>
                    ) : pixResponse.status === 'pending' ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Aguardando
                      </>
                    ) : pixResponse.status === 'action_required' ? (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Ação Necessária
                      </>
                    ) : pixResponse.status === 'rejected' ? (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Rejeitado
                      </>
                    ) : pixResponse.status === 'cancelled' ? (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Cancelado
                      </>
                    ) : pixResponse.status === 'in_process' ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Processando
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {pixResponse.status || 'Pendente'}
                      </>
                    )}
                  </Badge>
                </div>
                
                {/* Botão para verificar status manualmente */}
                {pixResponse.status !== 'approved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={checkingPayment}
                    onClick={async () => {
                      setCheckingPayment(true);
                      console.log('🔍 [MANUAL-CHECK] Verificando status manualmente...');
                      
                      try {
                        const response = await fetch(
                          `${API_BASE_URL}/mercadopago/check-payment-status-live.php?payment_id=${pixResponse.payment_id}`
                        );
                        
                        if (response.ok) {
                          const data = await response.json();
                          console.log('🔍 [MANUAL-CHECK] Response:', data);
                          
                          if (data.success && data.data) {
                            const newStatus = data.data.status;
                            
                            if (newStatus !== pixResponse.status) {
                              setPixResponse(prev => prev ? { ...prev, status: newStatus } : null);
                              
                              if (newStatus === 'approved') {
                                toast.success('🎉 Pagamento Aprovado!', {
                                  description: 'Seu saldo foi creditado com sucesso.',
                                });
                                
                                setTimeout(() => {
                                  window.location.href = '/dashboard';
                                }, 2000);
                              } else {
                                toast.info('Status atualizado', {
                                  description: `Novo status: ${newStatus}`
                                });
                              }
                            } else {
                              toast.info('Status verificado', {
                                description: `Continua: ${newStatus}`
                              });
                            }
                          }
                        }
                      } catch (error) {
                        console.error('🔍 [MANUAL-CHECK] Erro:', error);
                        toast.error('Erro ao verificar status');
                      } finally {
                        setCheckingPayment(false);
                      }
                    }}
                  >
                    {checkingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verificar Status Agora
                      </>
                    )}
                  </Button>
                )}
                
                {/* Indicador de verificação automática */}
                {pixResponse.status !== 'approved' && (
                  <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Aguardando confirmação do pagamento
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      A página irá atualizar automaticamente quando o pagamento for confirmado.
                      Você será redirecionado para o dashboard após a aprovação.
                    </p>
                  </div>
                )}

                {/* QR Code Base64 */}
                {pixResponse.qr_code_base64 && (
                  <div className="flex flex-col items-center p-4 bg-white rounded-lg border">
                    <img 
                      src={`data:image/png;base64,${pixResponse.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-64 h-64"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Escaneie o QR Code para pagar
                    </p>
                  </div>
                )}

                {/* PIX Copia e Cola */}
                {pixResponse.qr_code && (
                  <div className="space-y-2">
                    <Label>Código PIX (Copia e Cola)</Label>
                    <div className="relative">
                      <Input
                        value={pixResponse.qr_code}
                        readOnly
                        className="pr-20 font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute right-1 top-1"
                        onClick={() => {
                          navigator.clipboard.writeText(pixResponse.qr_code!);
                          toast.success('Código copiado!');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Ticket URL */}
                {pixResponse.ticket_url && (
                  <div className="space-y-2">
                    <Label>Link do Pagamento</Label>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(pixResponse.ticket_url, '_blank')}
                    >
                      Abrir Página de Pagamento
                    </Button>
                  </div>
                )}

                {/* Payment ID */}
                {pixResponse.payment_id && (
                  <div className="p-3 bg-muted rounded text-sm">
                    <span className="font-medium">ID do Pagamento:</span> {pixResponse.payment_id}
                  </div>
                )}
                
                {/* Botão Paguei - só aparece quando tem QR code */}
                <Button 
                  type="button" 
                  className="w-full"
                  onClick={() => window.location.href = '/dashboard/pagamentos/historico-pix'}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Paguei!
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção de Debug - Dados Técnicos */}
      {pixResponse && (
        <Card className="border-2 border-blue-500/20">
          <CardHeader className="px-4 md:px-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              🔍 Dados Técnicos (Debug)
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Informações completas retornadas pelo Mercado Pago
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="space-y-4">
              {/* Payment ID - DESTAQUE */}
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-500">
                <Label className="text-xs font-semibold text-green-700 dark:text-green-300">
                  ✅ PAYMENT ID (extraído da URL do ticket) - ID CORRETO PARA CONSULTAS
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={pixResponse.payment_id || 'N/A'}
                    readOnly
                    className="font-mono font-bold text-lg text-green-600 dark:text-green-400 bg-white dark:bg-gray-900"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(pixResponse.payment_id || '');
                      toast.success('Payment ID copiado!');
                    }}
                  >
                    Copiar
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                    ✅ ID numérico extraído da URL do ticket (ex: 128805835229)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Este ID é salvo no banco de dados e usado para todas as consultas de status do pagamento
                  </p>
                  
                  {/* Verificar se ID está na URL do ticket */}
                  {pixResponse.ticket_url && (() => {
                    const match = pixResponse.ticket_url.match(/\/payments\/(\d+)\//);
                    const urlPaymentId = match ? match[1] : null;
                    const idsMatch = urlPaymentId === String(pixResponse.payment_id);
                    
                    return urlPaymentId ? (
                      <div className="mt-2 p-2 rounded border bg-green-100 dark:bg-green-900 border-green-600">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                          {idsMatch 
                            ? '✅ ID confirmado: corresponde ao ID da URL do ticket' 
                            : '⚠️ Aviso: ID não corresponde à URL (não deveria acontecer)'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ID na URL do ticket: <span className="font-mono font-bold">{urlPaymentId}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID salvo no banco: <span className="font-mono font-bold">{pixResponse.payment_id}</span>
                        </p>
                        {!idsMatch && (
                          <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-2">
                            ⚠️ ATENÇÃO: O ID da URL do ticket ({urlPaymentId}) é o correto para consultas!
                          </p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Order ID */}
              <div className="p-3 bg-muted rounded-lg border">
                <Label className="text-xs font-semibold">Order ID (responseData.id) - Referência do Pedido</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={pixResponse.order_id || 'N/A'}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(pixResponse.order_id || '');
                      toast.success('Order ID copiado!');
                    }}
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Este é um identificador do pedido/order (geralmente alfanumérico). Diferente do Payment ID.
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Status do Pagamento</Label>
                <Input
                  value={pixResponse.status || 'N/A'}
                  readOnly
                  className="font-mono"
                />
              </div>

              {/* QR Code String (primeiros 100 caracteres) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">QR Code (String PIX Copia e Cola)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={pixResponse.qr_code ? `${pixResponse.qr_code.substring(0, 80)}...` : 'N/A'}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(pixResponse.qr_code || '');
                      toast.success('QR Code completo copiado!');
                    }}
                  >
                    Copiar Completo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tamanho completo: {pixResponse.qr_code?.length || 0} caracteres
                </p>
              </div>

              {/* QR Code Base64 (primeiros 100 caracteres) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">QR Code Base64 (Imagem)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={pixResponse.qr_code_base64 ? `${pixResponse.qr_code_base64.substring(0, 80)}...` : 'N/A'}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(pixResponse.qr_code_base64 || '');
                      toast.success('Base64 completo copiado!');
                    }}
                  >
                    Copiar Completo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tamanho completo: {pixResponse.qr_code_base64?.length || 0} caracteres
                </p>
              </div>

              {/* Ticket URL */}
              {pixResponse.ticket_url && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Ticket URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={pixResponse.ticket_url}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(pixResponse.ticket_url || '');
                        toast.success('URL copiada!');
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                  
                  {/* Destacar o Payment ID na URL */}
                  {(() => {
                    const match = pixResponse.ticket_url.match(/\/payments\/(\d+)\//);
                    if (match) {
                      const urlPaymentId = match[1];
                      const parts = pixResponse.ticket_url.split(urlPaymentId);
                      return (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-500">
                          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
                            🔍 Payment ID na URL do ticket:
                          </p>
                          <p className="font-mono text-xs break-all">
                            <span className="text-muted-foreground">{parts[0]}</span>
                            <span className="bg-yellow-300 dark:bg-yellow-700 text-black dark:text-white px-1 py-0.5 rounded font-bold">
                              {urlPaymentId}
                            </span>
                            <span className="text-muted-foreground">{parts[1]}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Este número ({urlPaymentId}) é o Payment ID que deve estar no banco de dados
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Botão para ver JSON completo no console */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  console.log('📦 [DEBUG] ===== RESPOSTA COMPLETA DO MERCADO PAGO =====');
                  console.log('📦 [DEBUG] Objeto completo:', pixResponse);
                  console.log('📦 [DEBUG] JSON formatado:', JSON.stringify(pixResponse, null, 2));
                  console.log('📦 [DEBUG] =================================================');
                  toast.info('Dados completos enviados para o console (F12)');
                }}
              >
                Ver Dados Completos no Console (F12)
              </Button>

              {/* JSON formatado colapsável */}
              <details className="p-4 bg-muted rounded-lg border">
                <summary className="cursor-pointer font-semibold text-sm hover:text-primary transition-colors">
                  📋 Ver JSON Completo (clique para expandir) ▼
                </summary>
                <pre className="mt-4 p-4 bg-black dark:bg-gray-900 text-green-400 rounded overflow-x-auto text-xs max-h-96 overflow-y-auto">
                  {JSON.stringify(pixResponse, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MercadoPago;
