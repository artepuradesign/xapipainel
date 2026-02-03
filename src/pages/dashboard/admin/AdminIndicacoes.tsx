import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiDashboardAdmin } from '@/hooks/useApiDashboardAdmin';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatDate } from '@/utils/historicoUtils';

const AdminIndicacoes = () => {
  const navigate = useNavigate();
  const { transactions, loadTransactions, isLoading, stats } = useApiDashboardAdmin();
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    loadTransactions(100);
  }, []);

  const indicacaoTransactions = transactions.filter(t => 
    (t.description?.toLowerCase().includes('indicação') || 
    t.description?.toLowerCase().includes('comissão') ||
    t.description?.toLowerCase().includes('referral') ||
    t.type === 'commission' ||
    t.type === 'indicacao') &&
    t.source === 'central_cash' // Filtrar apenas registros do central_cash para evitar duplicatas
  );

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/admin')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Total de Indicações</h1>
            <p className="text-muted-foreground">Histórico completo de comissões pagas</p>
          </div>
        </div>
        <Button
          onClick={() => loadTransactions(100)}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <Gift className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats?.total_commissions || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
            <Gift className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_referrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão Média</CardTitle>
            <Gift className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.total_referrals ? (stats?.total_commissions || 0) / stats?.total_referrals : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Indicações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Comissões</CardTitle>
            <Badge variant="secondary">
              {indicacaoTransactions.length} comissões
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando comissões...</p>
            </div>
          ) : indicacaoTransactions.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Indicador</TableHead>
                    <TableHead>Indicado</TableHead>
                    <TableHead>Valor da Comissão</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {indicacaoTransactions.slice(0, displayLimit).map((transaction, index) => {
                    // Extrair indicador e indicado da descrição
                    const descricao = transaction.description || '';
                    let indicador = transaction.user_name || 'N/A';
                    let indicado = 'N/A';
                    
                    // Padrão 1: "Comissão por indicação - usuário Leonardo Castro"
                    if (descricao.includes('usuário ')) {
                      const match = descricao.match(/usuário (.+?)$/);
                      if (match) {
                        indicado = match[1];
                        // O indicador está no user_name
                      }
                    }
                    // Padrão 2: "Bônus de indicação por APIPainel"
                    else if (descricao.includes('indicação por ')) {
                      const match = descricao.match(/indicação por (.+?)$/);
                      if (match) {
                        indicador = match[1];
                        // O indicado está no user_name
                        indicado = transaction.user_name || 'N/A';
                      }
                    }
                    
                    return (
                      <TableRow key={transaction.id || index}>
                        <TableCell className="font-mono text-xs">
                          #{transaction.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell>
                          {transaction.user_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {indicado}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-orange-600">
                            {formatCurrency(transaction.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            Pago
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {indicacaoTransactions.length > displayLimit && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                  >
                    Carregar mais ({indicacaoTransactions.length - displayLimit} restantes)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma comissão registrada
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminIndicacoes;