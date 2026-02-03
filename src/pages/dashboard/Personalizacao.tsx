
import React from 'react';
import PersonalizationSettings from '@/components/configuracoes/PersonalizationSettings';
import { ModuleTemplateProvider } from '@/contexts/ModuleTemplateContext';

const Personalizacao = () => {
  return (
    <ModuleTemplateProvider>
      <div className="space-y-6">
        {/* Conteúdo Principal */}
        <PersonalizationSettings />
      </div>
    </ModuleTemplateProvider>
  );
};

export default Personalizacao;
