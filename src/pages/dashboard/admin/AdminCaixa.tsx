import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Download, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiDashboardAdmin } from '@/hooks/useApiDashboardAdmin';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatDate } from '@/utils/historicoUtils';

const AdminCaixa = () => {
  const navigate = useNavigate();
  const { transactions, loadTransactions, isLoading } = useApiDashboardAdmin();
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    loadTransactions(100); // Carregar mais dados para a página detalhada
  }, []);

  // Filtrar apenas entradas de pagamento externas (PIX, Cartão, Cripto)
  const filteredTransactions = transactions.filter((transaction) => {
    // Remover as transações duplicadas específicas
    const isDuplicate = 
      transaction.description?.includes('Comissão por indicação - usuario Leonardo Castro') ||
      transaction.description?.includes('Bônus de indicação por APIPainel') ||
      (transaction.user_name === 'APIPainel' && transaction.description?.includes('Comissão'));

    const method = (transaction.payment_method || '').toLowerCase().trim();
    const allowedMethods = ['pix', 'credit', 'cartao', 'card', 'paypal', 'crypto', 'criptomoeda', 'cripto'];
    const isAllowedMethod = allowedMethods.some((m) => method.includes(m));

    const isCredit = transaction.type === 'credit' || transaction.amount > 0;

    return !isDuplicate && isCredit && isAllowedMethod;
  });

  const totalCaixa = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

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
            <h1 className="text-2xl font-bold">Saldo em Caixa</h1>
            <p className="text-muted-foreground">Detalhamento completo do caixa central</p>
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
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCaixa)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTransactions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Transação</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredTransactions.length ? totalCaixa / filteredTransactions.length : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Transações do Caixa</CardTitle>
            <Badge variant="secondary">
              {filteredTransactions.length} registros
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando transações...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.slice(0, displayLimit).map((transaction, index) => (
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
                        <Badge 
                          variant={transaction.type === 'credit' ? 'default' : 'destructive'}
                        >
                          {transaction.type === 'credit' ? 'Crédito' : 'Débito'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.payment_method || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredTransactions.length > displayLimit && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                  >
                    Carregar mais ({filteredTransactions.length - displayLimit} restantes)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCaixa;