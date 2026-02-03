
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, User, Crown, CheckSquare } from 'lucide-react';

interface UserStatsCardsProps {
  stats: {
    total: number;
    assinantes: number;
    suporte: number;
    admin?: number;
    ativos: number;
    assinaturasAtivas: number;
  };
}

const UserStatsCards = ({ stats }: UserStatsCardsProps) => {
  console.log('UserStatsCards rendering with stats:', stats);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Assinantes</p>
              <p className="text-2xl font-bold">{stats.assinantes}</p>
            </div>
            <User className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Suporte/Admin</p>
              <p className="text-2xl font-bold">{stats.suporte + (stats.admin || 0)}</p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
              <p className="text-2xl font-bold">{stats.assinaturasAtivas}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStatsCards;
