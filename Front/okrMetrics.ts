import { ActionData, getAllActions } from "./notion";

export interface MetricasGerais {
  total_acoes: number;
  total_objetivos: number;
  total_concluidas: number;
  total_em_andamento: number;
  total_em_risco: number;
  total_nao_iniciadas: number;
  taxa_atingimento_geral: number;
}

export interface MetricasPorObjetivo {
  [objetivo: string]: {
    percentual: number;
    total: number;
    concluidas: number;
    em_andamento: number;
    nao_iniciadas: number;
    em_risco: number;
  };
}

export interface MetricasPorOwner {
  [owner: string]: {
    total: number;
    concluidas: number;
    em_andamento: number;
    nao_iniciadas: number;
    em_risco: number;
  };
}

export interface MetricasPorKeyResult {
  [keyResultId: string]: {
    nome: string;
    objetivo: string;
    percentual: number;
    total: number;
    concluidas: number;
    em_andamento: number;
    nao_iniciadas: number;
    em_risco: number;
  };
}

export interface DashboardMetrics {
  metricas_gerais: MetricasGerais;
  por_objetivo: MetricasPorObjetivo;
  por_owner: MetricasPorOwner;
  por_key_result: MetricasPorKeyResult;
}

function getStatusCategory(status: string, date: string | null): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes("done") || statusLower.includes("complete")) {
    return "concluida";
  }
  
  // Se for "On Track" e tiver data passada, considerar concluída
  if (statusLower.includes("on track")) {
    if (date) {
      const actionDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetar horas para comparação apenas de data
      
      if (actionDate < today) {
        return "concluida";
      }
    }
    return "em_andamento";
  }
  
  if (statusLower.includes("in progress")) {
    return "em_andamento";
  }
  if (statusLower.includes("at risk")) {
    return "em_risco";
  }
  return "nao_iniciada";
}

function calculatePercentual(concluidas: number, em_andamento: number, total: number): number {
  if (total === 0) return 0;
  // Considera concluídas como 100% e em andamento como 50%
  const pontos = concluidas + (em_andamento * 0.5);
  return Math.round((pontos / total) * 1000) / 10; // Arredonda para 1 casa decimal
}

export async function calculateDashboardMetrics(): Promise<DashboardMetrics> {
  const actions = await getAllActions();
  
  // Métricas gerais
  const metricas_gerais: MetricasGerais = {
    total_acoes: actions.length,
    total_objetivos: 0,
    total_concluidas: 0,
    total_em_andamento: 0,
    total_em_risco: 0,
    total_nao_iniciadas: 0,
    taxa_atingimento_geral: 0,
  };
  
  // Métricas por objetivo
  const por_objetivo: MetricasPorObjetivo = {};
  
  // Métricas por owner
  const por_owner: MetricasPorOwner = {};
  
  // Métricas por Key Result
  const por_key_result: MetricasPorKeyResult = {};
  
  // Processar cada ação
  for (const action of actions) {
    const statusCategory = getStatusCategory(action.status, action.date);
    
    // Atualizar métricas gerais
    if (statusCategory === "concluida") metricas_gerais.total_concluidas++;
    if (statusCategory === "em_andamento") metricas_gerais.total_em_andamento++;
    if (statusCategory === "em_risco") metricas_gerais.total_em_risco++;
    if (statusCategory === "nao_iniciada") metricas_gerais.total_nao_iniciadas++;
    
    // Atualizar métricas por objetivo (usando o título da ação como proxy)
    // Em produção, você deveria buscar o objetivo real via API do Notion
    const objetivo = action.companyObjective || "Sem objetivo";
    if (!por_objetivo[objetivo]) {
      por_objetivo[objetivo] = {
        percentual: 0,
        total: 0,
        concluidas: 0,
        em_andamento: 0,
        nao_iniciadas: 0,
        em_risco: 0,
      };
    }
    por_objetivo[objetivo].total++;
    if (statusCategory === "concluida") por_objetivo[objetivo].concluidas++;
    if (statusCategory === "em_andamento") por_objetivo[objetivo].em_andamento++;
    if (statusCategory === "nao_iniciada") por_objetivo[objetivo].nao_iniciadas++;
    if (statusCategory === "em_risco") por_objetivo[objetivo].em_risco++;
    
    // Atualizar métricas por owner
    const owner = action.owner || "Sem owner";
    if (!por_owner[owner]) {
      por_owner[owner] = {
        total: 0,
        concluidas: 0,
        em_andamento: 0,
        nao_iniciadas: 0,
        em_risco: 0,
      };
    }
    por_owner[owner].total++;
    if (statusCategory === "concluida") por_owner[owner].concluidas++;
    if (statusCategory === "em_andamento") por_owner[owner].em_andamento++;
    if (statusCategory === "nao_iniciada") por_owner[owner].nao_iniciadas++;
    if (statusCategory === "em_risco") por_owner[owner].em_risco++;
    
    // Atualizar métricas por Key Result
    if (action.keyResultId) {
      const krId = action.keyResultId;
      if (!por_key_result[krId]) {
        por_key_result[krId] = {
          nome: "Carregando...",
          objetivo: action.companyObjective || "Sem objetivo",
          percentual: 0,
          total: 0,
          concluidas: 0,
          em_andamento: 0,
          nao_iniciadas: 0,
          em_risco: 0,
        };
      }
      por_key_result[krId].total++;
      if (statusCategory === "concluida") por_key_result[krId].concluidas++;
      if (statusCategory === "em_andamento") por_key_result[krId].em_andamento++;
      if (statusCategory === "nao_iniciada") por_key_result[krId].nao_iniciadas++;
      if (statusCategory === "em_risco") por_key_result[krId].em_risco++;
    }
  }
  
  // Calcular percentuais por objetivo
  for (const objetivo in por_objetivo) {
    const metrics = por_objetivo[objetivo];
    metrics.percentual = calculatePercentual(
      metrics.concluidas,
      metrics.em_andamento,
      metrics.total
    );
  }
  
  // Calcular taxa de atingimento geral
  metricas_gerais.taxa_atingimento_geral = calculatePercentual(
    metricas_gerais.total_concluidas,
    metricas_gerais.total_em_andamento,
    metricas_gerais.total_acoes
  );
  
  // Contar objetivos únicos
  metricas_gerais.total_objetivos = Object.keys(por_objetivo).length;
  
  // Calcular percentuais por Key Result e buscar nomes
  const { getKeyResultName } = await import("./notion");
  for (const krId in por_key_result) {
    const metrics = por_key_result[krId];
    metrics.percentual = calculatePercentual(
      metrics.concluidas,
      metrics.em_andamento,
      metrics.total
    );
    // Buscar nome do KR
    try {
      const krName = await getKeyResultName(krId);
      metrics.nome = krName;
    } catch (error) {
      console.error(`Erro ao buscar nome do KR ${krId}:`, error);
      metrics.nome = "Key Result";
    }
  }
  
  return {
    metricas_gerais,
    por_objetivo,
    por_owner,
    por_key_result,
  };
}
