import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiDashboardAdmin } from '@/hooks/useApiDashboardAdmin';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatDate } from '@/utils/historicoUtils';

const AdminCompraPlanos = () => {
  const navigate = useNavigate();
  const { transactions, loadTransactions, isLoading, stats } = useApiDashboardAdmin();
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    loadTransactions(100);
  }, []);

  const planoTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes('plano') || 
    t.description?.toLowerCase().includes('assinatura') ||
    t.type === 'plan_purchase'
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
            <h1 className="text-2xl font-bold">Compra de Planos</h1>
            <p className="text-muted-foreground">Histórico completo de vendas de planos</p>
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
            <CardTitle className="text-sm font-medium">Total em Vendas</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats?.plan_sales || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {planoTransactions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(planoTransactions.length ? (stats?.plan_sales || 0) / planoTransactions.length : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Compra de Planos</CardTitle>
            <Badge variant="secondary">
              {planoTransactions.length} vendas
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando vendas...</p>
            </div>
          ) : planoTransactions.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planoTransactions.slice(0, displayLimit).map((transaction, index) => (
                    <TableRow key={transaction.id || index}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        {transaction.user_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-purple-600">
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {planoTransactions.length > displayLimit && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                  >
                    Carregar mais ({planoTransactions.length - displayLimit} restantes)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma venda de plano registrada
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCompraPlanos;