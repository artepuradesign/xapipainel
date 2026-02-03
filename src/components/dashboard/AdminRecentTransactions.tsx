
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, BarChart3, Gift, TrendingDown, TrendingUp, Users, Settings } from 'lucide-react';
import { type DashboardTransaction } from '@/hooks/useApiDashboardAdmin';

interface AdminRecentTransactionsProps {
  recentTransactions: DashboardTransaction[];
}

const AdminRecentTransactions: React.FC<AdminRecentTransactionsProps> = ({ recentTransactions }) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Remove duplicatas baseadas na descrição e valor para evitar exibir transações similares
  const deduplicateTransactions = (transactions: DashboardTransaction[]) => {
    const seen = new Set();
    const seenBonusUsers = new Set();
    
    return transactions.filter(transaction => {
      // Para transações de bônus/comissão, verificar por usuário e valor
      if (transaction.description.toLowerCase().includes('bônus') || 
          transaction.description.toLowerCase().includes('comissão') ||
          transaction.description.toLowerCase().includes('indicação')) {
        
        // Extrair nome do usuário da descrição
        const userMatch = transaction.description.match(/(?:usuário|por|indicado por|Rodrigo)\s+(\w+)/i);
        const userName = userMatch ? userMatch[1] : transaction.user_name;
        const bonusKey = `${userName}-${transaction.amount}-bonus`;
        
        if (seenBonusUsers.has(bonusKey)) {
          return false;
        }
        seenBonusUsers.add(bonusKey);
        return true;
      }
      
      // Para outras transações, usar lógica anterior
      const dateKey = new Date(transaction.created_at).toISOString().slice(0, 16);
      const key = `${transaction.description}-${transaction.amount}-${dateKey}`;
      
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const uniqueTransactions = deduplicateTransactions(recentTransactions);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-xl">
          <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
          <span className="text-base md:text-xl font-semibold">Transações do Caixa Central</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
          {uniqueTransactions.length > 0 ? (
            uniqueTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className={`p-1.5 sm:p-2 rounded-full ${
                    transaction.type === 'recarga' ? 'bg-blue-100 dark:bg-blue-900' :
                    transaction.type === 'entrada' ? 'bg-green-100 dark:bg-green-900' :
                    transaction.type === 'consulta' ? 'bg-purple-100 dark:bg-purple-900' :
                    transaction.type === 'saque' ? 'bg-red-100 dark:bg-red-900' :
                    transaction.type === 'comissao' ? 'bg-yellow-100 dark:bg-yellow-900' :
                    transaction.type === 'indicacao' ? 'bg-orange-100 dark:bg-orange-900' :
                    'bg-gray-100 dark:bg-gray-900'
                  }`}>
                    {transaction.type === 'recarga' ? <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" /> :
                     transaction.type === 'entrada' ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> :
                     transaction.type === 'consulta' ? <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" /> :
                     transaction.type === 'saque' ? <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" /> :
                     transaction.type === 'comissao' ? <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" /> :
                     transaction.type === 'indicacao' ? <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" /> :
                     <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR')} {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {transaction.user_name && (
                        <>
                          <span className="text-gray-400 hidden sm:inline">•</span>
                          <span className="text-xs font-medium text-primary/80 truncate hidden sm:inline">{transaction.user_name}</span>
                        </>
                      )}
                    </div>
                    {transaction.user_name && (
                      <span className="text-xs font-medium text-primary/80 truncate block sm:hidden">{transaction.user_name}</span>
                    )}
                  </div>
                </div>
                <div className="ml-2 sm:ml-3 flex-shrink-0">
                  <Badge className={`text-xs font-semibold ${
                    ['recarga', 'entrada', 'plano', 'indicacao', 'comissao'].includes(transaction.type) 
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}>
                    {['recarga', 'entrada', 'plano', 'indicacao', 'comissao'].includes(transaction.type) ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
              <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">Nenhuma transação no caixa ainda</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminRecentTransactions;
