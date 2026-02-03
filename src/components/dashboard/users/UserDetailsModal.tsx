
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/types/user";

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailsModal = ({ user, isOpen, onClose }: UserDetailsModalProps) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome Completo</Label>
              <p className="text-sm">{user.name}</p>
            </div>
            <div>
              <Label>Nome de Usuário</Label>
              <p className="text-sm">@{user.username}</p>
            </div>
            <div>
              <Label>E-mail</Label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <Label>CPF</Label>
              <p className="text-sm">{user.cpf || 'Não informado'}</p>
            </div>
            <div>
              <Label>Telefone</Label>
              <p className="text-sm">{user.phone || 'Não informado'}</p>
            </div>
            <div>
              <Label>Tipo</Label>
              <Badge variant={user.role === 'suporte' ? 'default' : 'secondary'}>
                {user.role === 'suporte' ? 'Suporte' : 'Assinante'}
              </Badge>
            </div>
            <div>
              <Label>Plano</Label>
              <p className="text-sm">{user.plan}</p>
            </div>
            <div>
              <Label>Saldo</Label>
              <p className="text-sm">R$ {user.balance.toFixed(2)}</p>
            </div>
          </div>
          {user.notes && (
            <div>
              <Label>Observações</Label>
              <p className="text-sm bg-gray-50 p-2 rounded">{user.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
