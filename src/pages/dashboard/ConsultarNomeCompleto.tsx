import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, AlertCircle, CheckCircle, Copy, MapPin, Calendar, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import ElegantPriceCard from '@/components/consultas/ElegantPriceCard';
import SimpleTitleBar from '@/components/dashboard/SimpleTitleBar';
import ScrollToTop from '@/components/ui/scroll-to-top';
import { consultaNomeService, ConsultaNomeResult } from '@/services/consultaNomeService';
import { consultasCpfService } from '@/services/consultasCpfService';
import { cookieUtils } from '@/utils/cookieUtils';
import { getModulePriceById } from '@/services/moduleService';

const ConsultarNomeCompleto: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { balance, isLoading: balanceLoading, loadBalance } = useWalletBalance();
  const { subscription, discountPercentage, isLoading: subscriptionLoading, calculateDiscountedPrice } = useUserSubscription();
  
  const [nome, setNome] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [resultados, setResultados] = useState<ConsultaNomeResult[]>([]);
  const [totalEncontrados, setTotalEncontrados] = useState(0);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [nomeConsultado, setNomeConsultado] = useState('');
  const [modulePrice, setModulePrice] = useState<number>(2.00);
  const [logs, setLogs] = useState<string[]>([]);

  // Carregar preço do módulo
  useEffect(() => {
    const loadPrice = async () => {
      try {
        const price = await getModulePriceById(4); // ID do módulo de busca por nome
        if (price) {
          setModulePrice(price);
        }
      } catch (error) {
        console.error('Erro ao carregar preço:', error);
      }
    };
    loadPrice();
  }, []);

  // Calcular desconto e preço final
  const priceInfo = calculateDiscountedPrice(modulePrice);
  const finalPrice = priceInfo.discountedPrice;
  const hasDiscount = priceInfo.hasDiscount;
  const totalBalance = balance?.total || 0;
  const hasEnoughBalance = totalBalance >= finalPrice;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const formatNome = (value: string) => {
    return value.toUpperCase();
  };

  const handleSearch = async () => {
    if (!nome || nome.trim().length < 5) {
      toast.error('Digite um nome com pelo menos 5 caracteres');
      return;
    }

    if (!hasEnoughBalance) {
      toast.error('Saldo insuficiente para realizar a consulta');
      return;
    }

    setIsSearching(true);
    setSearchProgress(0);
    setResultados([]);
    setTotalEncontrados(0);
    setSearchPerformed(false);
    setLogs(['Iniciando consulta...']);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setSearchProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Realizar consulta
      const response = await consultaNomeService.consultarNome(nome);
      
      clearInterval(progressInterval);
      setSearchProgress(100);

      if (response.log) {
        setLogs(response.log);
      }

      if (response.status && response.resultados) {
        setResultados(response.resultados);
        setTotalEncontrados(response.total_encontrados || 0);
        setNomeConsultado(response.nome_consultado || nome);
        setSearchPerformed(true);
        
        // Registrar consulta no histórico
        try {
          const sessionToken = cookieUtils.get('session_token') || cookieUtils.get('api_session_token');
          if (sessionToken && user?.id) {
            await consultasCpfService.create({
              user_id: parseInt(user.id.toString()),
              module_type: 'nome',
              document: nome,
              cost: finalPrice,
              status: 'completed',
              result_data: response.resultados,
              ip_address: window.location.hostname,
              user_agent: navigator.userAgent,
              metadata: {
                source: 'consultar-nome-completo',
                page_route: window.location.pathname,
                module_title: 'Consulta Nome Completo',
                discount: discountPercentage,
                original_price: modulePrice,
                discounted_price: finalPrice,
                final_price: finalPrice,
                total_encontrados: response.total_encontrados,
                timestamp: new Date().toISOString()
              }
            } as any);
          }
        } catch (regError) {
          console.error('Erro ao registrar consulta:', regError);
        }

        // Atualizar saldo
        loadBalance();
        
        if (response.total_encontrados && response.total_encontrados > 0) {
          toast.success(`Encontrados ${response.total_encontrados} registro(s)!`);
        } else {
          toast.info('Nenhum resultado encontrado para este nome');
        }
      } else {
        setSearchPerformed(true);
        toast.error(response.erro || 'Erro ao consultar nome');
      }
    } catch (error) {
      console.error('Erro na consulta:', error);
      toast.error('Erro ao realizar consulta. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching && nome.trim().length >= 5) {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SimpleTitleBar 
        title="Consulta por Nome Completo"
        subtitle="Busque informações por nome completo"
        onBack={() => navigate('/dashboard')}
      />

      <div className={`p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 ${isMobile ? 'pb-24' : ''}`}>
        {/* Card de Preço */}
        <ElegantPriceCard
          originalPrice={modulePrice}
          finalPrice={finalPrice}
          hasDiscount={hasDiscount}
          discountPercentage={discountPercentage}
          planType={subscription?.plan_name}
          loading={balanceLoading || subscriptionLoading}
        />

        {/* Card de Busca */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Buscar por Nome
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Digite o nome completo para buscar (mínimo 5 caracteres)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm">Nome Completo</Label>
              <div className="flex gap-2">
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: JOÃO DA SILVA"
                  value={nome}
                  onChange={(e) => setNome(formatNome(e.target.value))}
                  onKeyPress={handleKeyPress}
                  className="flex-1 uppercase text-sm sm:text-base"
                  disabled={isSearching}
                  minLength={5}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !hasEnoughBalance || nome.trim().length < 5}
                  className="shrink-0"
                  size={isMobile ? "default" : "default"}
                >
                  {isSearching ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span className="hidden sm:inline">Buscando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <span className="hidden sm:inline">Consultar</span>
                    </div>
                  )}
                </Button>
              </div>
              {nome.length > 0 && nome.length < 5 && (
                <p className="text-xs text-muted-foreground">
                  Faltam {5 - nome.length} caracteres
                </p>
              )}
            </div>

            {isSearching && (
              <div className="space-y-2">
                <Progress value={searchProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Consultando... {searchProgress}%
                </p>
              </div>
            )}

            {!hasEnoughBalance && !balanceLoading && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-xs sm:text-sm text-destructive">
                  Saldo insuficiente. Adicione R$ {(finalPrice - totalBalance).toFixed(2)} para consultar.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        {searchPerformed && (
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  {totalEncontrados > 0 ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  )}
                  Resultados da Consulta
                </CardTitle>
                <Badge variant={totalEncontrados > 0 ? "default" : "secondary"}>
                  {totalEncontrados} registro(s) encontrado(s)
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Nome consultado: <strong>{nomeConsultado}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalEncontrados > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  {/* Tabela para Desktop */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Nome</TableHead>
                          <TableHead className="min-w-[120px]">CPF</TableHead>
                          <TableHead className="min-w-[100px]">Nascimento</TableHead>
                          <TableHead className="min-w-[60px]">Sexo</TableHead>
                          <TableHead className="min-w-[200px]">Endereços</TableHead>
                          <TableHead className="min-w-[120px]">Cidades</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultados.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{result.nome || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-sm">{result.cpf || '—'}</span>
                                {result.cpf && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(result.cpf, 'CPF')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{result.nascimento || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{result.sexo || '—'}</Badge>
                            </TableCell>
                            <TableCell className="whitespace-pre-line text-xs">
                              {result.enderecos || '—'}
                            </TableCell>
                            <TableCell>{result.cidades || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Cards para Mobile */}
                  <div className="sm:hidden space-y-3 px-4">
                    {resultados.map((result, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardContent className="p-3 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{result.nome || '—'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {result.cpf || '—'}
                                </span>
                                {result.cpf && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => copyToClipboard(result.cpf, 'CPF')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {result.sexo || '—'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{result.nascimento || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{result.cidades || '—'}</span>
                            </div>
                          </div>

                          {result.enderecos && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground whitespace-pre-line">
                                {result.enderecos}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum resultado encontrado para este nome.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente buscar com variações do nome ou verifique a grafia.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Log de Debug (opcional - pode ser removido em produção) */}
        {logs.length > 0 && searchPerformed && (
          <Card className="bg-muted/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-muted-foreground">Log da Consulta</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {logs.join('\n')}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      <ScrollToTop />
    </div>
  );
};

export default ConsultarNomeCompleto;
