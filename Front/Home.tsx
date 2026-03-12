import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Target, ClipboardList, CheckCircle2, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: metrics, isLoading, error, refetch } = trpc.okr.metrics.useQuery();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedKR, setSelectedKR] = useState<{ id: string; name: string } | null>(null);

  // Query para buscar ações do KR selecionado
  const { data: krActions, isLoading: isLoadingActions } = trpc.okr.actionsByKR.useQuery(
    { keyResultId: selectedKR?.id || "" },
    { enabled: !!selectedKR }
  );

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="text-center text-white">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg">Erro ao carregar métricas</p>
          <p className="text-sm opacity-80 mt-2">{error?.message}</p>
        </div>
      </div>
    );
  }

  const { metricas_gerais, por_objetivo, por_owner, por_key_result } = metrics;
  
  // Preparar dados para o gráfico
  const objetivos = Object.entries(por_objetivo).map(([nome, dados]) => ({
    nome,
    percentual: dados.percentual,
    cor: dados.percentual > 70 ? '#10b981' : dados.percentual >= 40 ? '#f59e0b' : '#ef4444'
  }));

  // Agrupar status das ações
  const groupedActions = krActions ? {
    iniciadas: krActions.filter(a => a.status === 'On Track' || a.status === 'At Risk'),
    nao_iniciadas: krActions.filter(a => a.status === 'Not Started' || !a.status)
  } : { iniciadas: [], nao_iniciadas: [] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-5xl font-bold mb-2">📊 Dashboard OKRs</h1>
          <p className="text-lg opacity-90">Mikro Market | 1º Trimestre 2026</p>
        </div>

        {/* Seção 1: Cards de Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Target className="w-9 h-9 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Total de Objetivos
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-gray-900">{metricas_gerais.total_objetivos}</div>
              <p className="text-sm text-gray-500 mt-1">Objetivos estratégicos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-9 h-9 text-indigo-600" />
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Total de Ações
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-gray-900">{metricas_gerais.total_acoes}</div>
              <p className="text-sm text-gray-500 mt-1">Ações mapeadas</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Taxa de Atingimento
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-green-600">{metricas_gerais.taxa_atingimento_geral}%</div>
              <p className="text-sm text-gray-500 mt-1">{metricas_gerais.total_em_andamento} ações em progresso</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-9 h-9 text-red-600" />
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Ações em Risco
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-red-600">{metricas_gerais.total_em_risco}</div>
              <p className="text-sm text-gray-500 mt-1">Requer atenção imediata</p>
            </CardContent>
          </Card>
        </div>

        {/* Seção 2: Gráfico de Atingimento por Objetivo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-red-600" />
              Atingimento por Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {objetivos.map((obj, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{obj.nome}</span>
                    <span className="text-sm font-bold" style={{ color: obj.cor }}>{obj.percentual}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3 text-white text-sm font-semibold"
                      style={{ width: `${obj.percentual}%`, backgroundColor: obj.cor }}
                    >
                      {obj.percentual > 10 && `${obj.percentual}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Atingimento por Key Result */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-purple-600" />
              Atingimento por Key Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {(() => {
                // Agrupar KRs por objetivo
                const krsPorObjetivo: { [objetivo: string]: Array<{ id: string; kr: any }> } = {};
                Object.entries(por_key_result).forEach(([krId, kr]: [string, any]) => {
                  const objetivo = kr.objetivo || 'Sem objetivo';
                  if (!krsPorObjetivo[objetivo]) {
                    krsPorObjetivo[objetivo] = [];
                  }
                  krsPorObjetivo[objetivo].push({ id: krId, kr });
                });

                return Object.entries(krsPorObjetivo).map(([objetivo, krs]) => {
                  return (
                    <div key={objetivo} className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-800 border-b-2 border-purple-200 pb-2">
                        {objetivo}
                      </h3>
                      <div className="space-y-4">
                        {krs.map(({ id: krId, kr }) => {
                          const cor = kr.percentual > 70 ? '#10b981' : kr.percentual >= 40 ? '#f59e0b' : '#ef4444';
                          
                          return (
                            <div 
                              key={krId} 
                              className="space-y-2 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                              onClick={() => setSelectedKR({ id: krId, name: kr.nome })}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700 flex-1">
                                  {kr.nome}
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({kr.concluidas}/{kr.total} ações)
                                  </span>
                                </span>
                                <span className="font-bold text-sm" style={{ color: cor }}>{kr.percentual}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-white text-xs font-semibold"
                                  style={{ width: `${kr.percentual}%`, backgroundColor: cor }}
                                >
                                  {kr.percentual > 10 && `${kr.percentual}%`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Seção 4: Atingimento por Owner */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Users className="w-7 h-7 text-indigo-600" />
              Atingimento por Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(por_owner).map(([owner, dados]) => {
                const percentual = Math.round(((dados.concluidas + dados.em_andamento * 0.5) / dados.total) * 1000) / 10;
                const cor = percentual > 70 ? 'green' : percentual >= 40 ? 'yellow' : 'red';
                const corClasses = {
                  green: 'border-green-500 bg-green-50',
                  yellow: 'border-yellow-500 bg-yellow-50',
                  red: 'border-red-500 bg-red-50'
                };
                
                return (
                  <Card key={owner} className={`border-l-4 ${corClasses[cor]}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">{owner}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-gray-900">{percentual}%</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-semibold">{dados.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>✅ Concluídas:</span>
                            <span className="font-semibold text-green-600">{dados.concluidas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🔄 Em andamento:</span>
                            <span className="font-semibold text-blue-600">{dados.em_andamento}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>⚠️ Em risco:</span>
                            <span className="font-semibold text-red-600">{dados.em_risco}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>⏸️ Não iniciadas:</span>
                            <span className="font-semibold text-gray-500">{dados.nao_iniciadas}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-white text-sm opacity-80">
          <p>Dashboard gerado automaticamente | Atualização a cada 30 segundos</p>
        </div>
      </div>

      {/* Modal de Drill-down */}
      <Dialog open={!!selectedKR} onOpenChange={(open) => !open && setSelectedKR(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedKR?.name}</DialogTitle>
            <DialogDescription>
              Ações que compõem este Key Result
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingActions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ações Iniciadas/Finalizadas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  ✅ Iniciadas/Finalizadas ({groupedActions.iniciadas.length})
                </h3>
                {groupedActions.iniciadas.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Nenhuma ação iniciada</p>
                ) : (
                  <div className="space-y-2">
                    {groupedActions.iniciadas.map((action) => (
                      <div key={action.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 flex-1">{action.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            action.status === 'On Track' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {action.status}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-600">
                          <span>👤 {action.owner}</span>
                          {action.date && <span>📅 {new Date(action.date).toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ações Não Iniciadas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  ⏸️ Não Iniciadas ({groupedActions.nao_iniciadas.length})
                </h3>
(Content truncated due to size limit. Use line ranges to read remaining content)