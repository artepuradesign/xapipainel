import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Ticket, 
  Plus, 
  RefreshCw, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar,
  Users,
  TrendingUp,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { cupomApiService, Cupom } from '@/services/cupomApiService';
import CupomFormModal from '@/components/cupons/admin/CupomFormModal';
import DeleteConfirmDialog from '@/components/cupons/admin/DeleteConfirmDialog';

interface HistoricoCupom {
  id: number;
  cupom_id: number;
  user_id: number;
  user_email?: string;
  codigo: string;
  descricao: string;
  tipo: string;
  valor_original: number;
  valor_desconto: number;
  used_at: string;
  created_at: string;
}

const AdminCupons = () => {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [filteredCupons, setFilteredCupons] = useState<Cupom[]>([]);
  const [historico, setHistorico] = useState<HistoricoCupom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inativo'>('all');
  
  // Modais
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCupom, setSelectedCupom] = useState<Cupom | null>(null);

  const formatBrazilianCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadCupons = async () => {
    setIsLoading(true);
    try {
      const response = await cupomApiService.getAllCupons();
      
      if (response.success && response.data) {
        const cuponsNormalizados = response.data.map(cupom => ({
          ...cupom,
          valor: typeof cupom.valor === 'string' ? parseFloat(cupom.valor) : cupom.valor,
          uso_atual: typeof cupom.uso_atual === 'string' ? parseInt(cupom.uso_atual) : cupom.uso_atual,
          uso_limite: cupom.uso_limite && typeof cupom.uso_limite === 'string' ? parseInt(cupom.uso_limite) : cupom.uso_limite
        }));
        
        setCupons(cuponsNormalizados);
        setFilteredCupons(cuponsNormalizados);
      } else {
        toast.error(response.error || 'Erro ao carregar cupons');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistorico = async () => {
    try {
      const response = await cupomApiService.getCupomHistoryAdmin();
      
      if (response.success && response.data) {
        setHistorico(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  useEffect(() => {
    loadCupons();
    loadHistorico();
  }, []);

  useEffect(() => {
    let filtered = cupons;

    if (searchTerm) {
      filtered = filtered.filter(cupom =>
        cupom.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cupom.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(cupom => cupom.status === filterStatus);
    }

    setFilteredCupons(filtered);
  }, [cupons, searchTerm, filterStatus]);

  const handleCreateCupom = () => {
    setSelectedCupom(null);
    setShowFormModal(true);
  };

  const handleEditCupom = (cupom: Cupom) => {
    setSelectedCupom(cupom);
    setShowFormModal(true);
  };

  const handleDeleteCupom = (cupom: Cupom) => {
    setSelectedCupom(cupom);
    setShowDeleteDialog(true);
  };

  const handleToggleStatus = async (cupom: Cupom) => {
    try {
      const newStatus = cupom.status === 'ativo' ? 'inativo' : 'ativo';
      const response = await cupomApiService.updateCupom({
        ...cupom,
        status: newStatus
      });

      if (response.success) {
        toast.success(`Cupom ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`);
        loadCupons();
      } else {
        toast.error(response.error || 'Erro ao alterar status do cupom');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const confirmDelete = async () => {
    if (!selectedCupom) return;

    try {
      const response = await cupomApiService.deleteCupom(selectedCupom.id);
      
      if (response.success) {
        toast.success('Cupom deletado com sucesso');
        loadCupons();
      } else {
        toast.error(response.error || 'Erro ao deletar cupom');
      }
    } finally {
      setShowDeleteDialog(false);
      setSelectedCupom(null);
    }
  };

  const handleFormSave = () => {
    setShowFormModal(false);
    const wasEditing = !!selectedCupom;
    setSelectedCupom(null);
    toast.success(wasEditing ? 'Cupom atualizado com sucesso' : 'Cupom criado com sucesso');
    loadCupons();
  };

  const getStatusBadge = (cupom: Cupom) => {
    if (cupom.status === 'inativo') {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    if (cupom.valido_ate && new Date(cupom.valido_ate) < new Date()) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (cupom.uso_limite && cupom.uso_atual >= cupom.uso_limite) {
      return <Badge variant="destructive">Esgotado</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  const calculateStats = () => {
    const total = cupons.length;
    const ativos = cupons.filter(c => c.status === 'ativo').length;
    const expirados = cupons.filter(c => 
      c.valido_ate && new Date(c.valido_ate) < new Date()
    ).length;
    const totalUsos = cupons.reduce((acc, c) => acc + c.uso_atual, 0);

    return { total, ativos, expirados, totalUsos };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Total Cupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cupons Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expirados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expirados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Usos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gerenciamento de Cupons */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Gerenciamento de Cupons
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Crie e gerencie cupons de desconto e bônus
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCupons}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button onClick={handleCreateCupom} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cupom
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca e Filtros */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Todos ({cupons.length})
              </Button>
              <Button
                variant={filterStatus === 'ativo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('ativo')}
              >
                Ativos ({cupons.filter(c => c.status === 'ativo').length})
              </Button>
              <Button
                variant={filterStatus === 'inativo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('inativo')}
              >
                Inativos ({cupons.filter(c => c.status === 'inativo').length})
              </Button>
            </div>
          </div>

          {/* Lista de Cupons */}
          {filteredCupons.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCupons.map((cupom) => (
                    <TableRow key={cupom.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="font-mono">
                          {cupom.codigo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cupom.descricao || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cupom.tipo === 'fixo' ? 'default' : 'secondary'}>
                          {cupom.tipo === 'fixo' ? 'Fixo' : '%'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {cupom.tipo === 'fixo' 
                          ? formatBrazilianCurrency(cupom.valor)
                          : `${cupom.valor}%`
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(cupom)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {cupom.uso_atual}
                          {cupom.uso_limite && `/${cupom.uso_limite}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cupom.valido_ate ? formatDate(cupom.valido_ate) : 'Sem limite'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCupom(cupom)}
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(cupom)}
                            className="h-8 w-8 p-0"
                            title={cupom.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCupom(cupom)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum cupom encontrado</p>
              <p className="text-sm mt-2">
                {searchTerm || filterStatus !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie seu primeiro cupom clicando no botão acima'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Uso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Uso de Cupons
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimos cupons utilizados pelos usuários
          </p>
        </CardHeader>
        <CardContent>
          {historico.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead>Data de Uso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="font-mono">
                          {item.codigo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.user_email || `Usuário #${item.user_id}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.tipo === 'fixo' ? 'default' : 'secondary'}>
                          {item.tipo === 'fixo' ? 'Fixo' : '%'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatBrazilianCurrency(item.valor_desconto)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(item.used_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum cupom foi usado ainda</p>
              <p className="text-sm mt-2">
                O histórico aparecerá aqui quando os usuários começarem a usar cupons
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <CupomFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedCupom(null);
        }}
        onSave={handleFormSave}
        cupom={selectedCupom}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedCupom(null);
        }}
        onConfirm={confirmDelete}
        cupomCodigo={selectedCupom?.codigo || ''}
      />
    </div>
  );
};

export default AdminCupons;
