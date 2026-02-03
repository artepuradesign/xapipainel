
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Star, Plus, MessageSquare, Users, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import PageHeaderCard from '@/components/dashboard/PageHeaderCard';
import UserAvatar from '@/components/UserAvatar';
import CreateTestimonialForm from '@/components/CreateTestimonialForm';
import { useAdminTestimonials } from '@/hooks/useAdminTestimonials';

const AdminDepoimentos = () => {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  
  const {
    testimonials,
    loading,
    error,
    approveTestimonial,
    rejectTestimonial,
    deleteTestimonial,
    createTestimonial,
    pendingCount,
    approvedCount,
    rejectedCount
  } = useAdminTestimonials();

  const handleApprove = async (id: number) => {
    await approveTestimonial(id);
  };
  
  const handleReject = async (id: number) => {
    await rejectTestimonial(id);
  };

  const handleDelete = async (id: number) => {
    const success = await deleteTestimonial(id);
    if (success) {
      toast.success('Depoimento excluído com sucesso!');
    } else {
      toast.error('Erro ao excluir depoimento. Tente novamente.');
    }
  };

  const handleCreateTestimonial = async (newTestimonial: any) => {
    const success = await createTestimonial({
      name: newTestimonial.name,
      message: newTestimonial.content,
      rating: newTestimonial.stars,
      position: newTestimonial.position,
      company: newTestimonial.company,
      status: 'pendente'
    });
    
    if (success) {
      toast.success('Depoimento criado com sucesso!');
      setIsCreateFormOpen(false);
    } else {
      toast.error('Erro ao criar depoimento. Tente novamente.');
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
      case 'ativo':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Aprovado</Badge>;
      case 'inativo':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejeitado</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeaderCard 
          title="Gerenciamento de Depoimentos" 
          subtitle="Gerencie os depoimentos enviados pelos clientes"
        />
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-gray-500">Carregando depoimentos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeaderCard 
          title="Gerenciamento de Depoimentos" 
          subtitle="Gerencie os depoimentos enviados pelos clientes"
        />
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Erro ao carregar depoimentos</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeaderCard 
        title="Gerenciamento de Depoimentos" 
        subtitle="Gerencie os depoimentos enviados pelos clientes"
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100">{testimonials.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Pendentes</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-900 dark:text-yellow-100">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Aprovados</p>
                <p className="text-2xl md:text-3xl font-bold text-green-900 dark:text-green-100">{approvedCount}</p>
              </div>
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">Rejeitados</p>
                <p className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100">{rejectedCount}</p>
              </div>
              <X className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card para Criar Depoimento */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar Novo Depoimento
              </CardTitle>
              <CardDescription>
                Crie um depoimento como suporte para adicionar à lista de pendentes
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
              className="bg-gradient-to-r from-brand-purple to-purple-600 hover:from-brand-darkPurple hover:to-purple-700 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreateFormOpen ? 'Fechar Formulário' : 'Novo Depoimento'}
            </Button>
          </div>
        </CardHeader>
        {isCreateFormOpen && (
          <CardContent>
            <CreateTestimonialForm 
              onCreateTestimonial={handleCreateTestimonial}
            />
          </CardContent>
        )}
      </Card>

      {/* Lista de Depoimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Todos os Depoimentos
          </CardTitle>
          <CardDescription>
            Gerencie todos os depoimentos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testimonials.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Nenhum depoimento encontrado.
              </div>
            ) : (
              testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={testimonial.avatar || undefined} alt={testimonial.name} />
                          <AvatarFallback>
                            {testimonial.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg truncate">{testimonial.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {testimonial.position}
                            {testimonial.company && ` - ${testimonial.company}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex space-x-2 items-center">
                        {getStatusBadge(testimonial.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Avaliação por estrelas */}
                    <div className="flex items-center mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < testimonial.rating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'fill-gray-200 text-gray-200'
                          }`} 
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {testimonial.rating} estrelas
                      </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                      "{testimonial.message}"
                    </p>
                  </CardContent>
                  
                  {testimonial.status === 'pendente' && (
                    <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 bg-gray-50 dark:bg-gray-800">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30 w-full sm:w-auto"
                        onClick={() => handleReject(testimonial.id)}
                      >
                        <X size={16} className="mr-1" /> Rejeitar
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800 w-full sm:w-auto" 
                        onClick={() => handleApprove(testimonial.id)}
                      >
                        <Check size={16} className="mr-1" /> Aprovar
                      </Button>
                    </CardFooter>
                  )}

                  {(testimonial.status === 'ativo' || testimonial.status === 'inativo') && (
                    <CardFooter className="flex justify-end space-x-2 bg-gray-50 dark:bg-gray-800">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                        onClick={() => handleDelete(testimonial.id)}
                      >
                        <X size={16} className="mr-1" /> Excluir
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDepoimentos;
