// Serviço para consulta de nome completo via API Painel Atito
export interface ConsultaNomeResult {
  nome: string;
  cpf: string;
  nascimento: string;
  idade?: string;
  sexo: string;
  enderecos: string;
  cidades: string;
}

export interface ConsultaNomeResponse {
  status: boolean;
  nome_consultado?: string;
  resultados?: ConsultaNomeResult[];
  total_encontrados?: number;
  erro?: string;
  log?: string[];
}

export const consultaNomeService = {
  async consultarNome(nome: string): Promise<ConsultaNomeResponse> {
    try {
      console.log('🔍 [CONSULTA_NOME] Consultando nome:', nome);
      
      if (!nome || nome.trim().length < 5) {
        return {
          status: false,
          erro: 'Nome muito curto ou inválido. Informe pelo menos 5 caracteres.'
        };
      }

      const response = await fetch('https://apipainel.atito.com.br/busca-apipainel.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({ nome: nome.trim() })
      });

      if (!response.ok) {
        console.error('❌ [CONSULTA_NOME] Erro HTTP:', response.status);
        return {
          status: false,
          erro: `Erro na comunicação com a API: ${response.status}`
        };
      }

      const data: ConsultaNomeResponse = await response.json();
      
      console.log('📥 [CONSULTA_NOME] Resposta:', {
        status: data.status,
        total: data.total_encontrados,
        hasResults: !!data.resultados?.length
      });

      return data;
    } catch (error) {
      console.error('❌ [CONSULTA_NOME] Erro:', error);
      return {
        status: false,
        erro: error instanceof Error ? error.message : 'Erro ao consultar nome'
      };
    }
  }
};
