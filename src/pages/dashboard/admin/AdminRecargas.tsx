import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiDashboardAdmin } from '@/hooks/useApiDashboardAdmin';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatDate } from '@/utils/historicoUtils';

const AdminRecargas = () => {
  const navigate = useNavigate();
  const { transactions, loadTransactions, isLoading, stats } = useApiDashboardAdmin();
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    loadTransactions(100);
  }, []);

  const recargaTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes('recarga') || 
    t.description?.toLowerCase().includes('depósito') ||
    t.type === 'recharge'
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
            <h1 className="text-2xl font-bold">Total em Recargas</h1>
            <p className="text-muted-foreground">Histórico completo de recargas de saldo</p>
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
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats?.total_recharges || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Recargas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recargaTransactions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recarga Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(recargaTransactions.length ? (stats?.total_recharges || 0) / recargaTransactions.length : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Recargas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Recargas</CardTitle>
            <Badge variant="secondary">
              {recargaTransactions.length} recargas
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando recargas...</p>
            </div>
          ) : recargaTransactions.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Saldo Anterior</TableHead>
                    <TableHead>Saldo Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recargaTransactions.slice(0, displayLimit).map((transaction, index) => (
                    <TableRow key={transaction.id || index}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        {transaction.user_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-600">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.payment_method || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          Concluído
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(transaction.balance_before || 0)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(transaction.balance_after || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {recargaTransactions.length > displayLimit && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                  >
                    Carregar mais ({recargaTransactions.length - displayLimit} restantes)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma recarga registrada
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRecargas;