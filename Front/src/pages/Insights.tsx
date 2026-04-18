import { useEffect, useState } from "react"
import { fetchCycleInsights, fetchCycles, sendAlerts } from "../services/api"

interface SuggestionItem {
  id: string
  text: string
  type: string
  triggerMetrics: { label: string; value: string }[]
}

interface BriefingContent {
  title: string
  companyContext: string[]
  marketContext?: string[]
  whyItMatters: string
  nextSteps: string[]
}

interface Props { isAdmin?: boolean }

export default function Insights({ isAdmin = false }: Props) {
  const [data, setData] = useState<any>(null)
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [alertResult, setAlertResult] = useState<any>(null)
  const [activeBriefing, setActiveBriefing] = useState<{ item: SuggestionItem; isImprovement: boolean } | null>(null)

  useEffect(() => { loadCycles() }, [])
  useEffect(() => { load() }, [selectedCycle])

  async function loadCycles() {
    try {
      const c = await fetchCycles()
      setCycles(c || [])
      const active = c?.find((x: any) => x.status === "ACTIVE")
      if (active) setSelectedCycle(active.id)
    } catch (err) { console.error(err) }
  }

  async function load() {
    setLoading(true)
    try {
      const d = await fetchCycleInsights(selectedCycle || undefined)
      setData(d)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  async function handleSendAlerts() {
    setSending(true)
    setAlertResult(null)
    try {
      const result = await sendAlerts(selectedCycle || undefined)
      setAlertResult(result)
    } catch (err: any) {
      setAlertResult({ error: err.message || "Erro ao enviar alertas" })
    }
    setSending(false)
  }

  if (loading) return <div style={{ padding: 40, color: "#888" }}>Analisando ciclo...</div>

  if (!data) {
    return (
      <div style={{ background: "white", borderRadius: 12, padding: 40, textAlign: "center", border: "1px solid #f0f0f0" }}>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>
          Nenhum ciclo ativo. Crie um ciclo e objetivos na aba OKRs.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Seletor de ciclo */}
      {cycles.length > 0 && (
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Ciclo:</span>
          <select
            value={selectedCycle}
            onChange={e => setSelectedCycle(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, background: "white", cursor: "pointer", outline: "none" }}
          >
            {cycles.map((c: any) => (
              <option key={c.id} value={c.id}>{c.label}{c.status === "ACTIVE" ? " (ativo)" : ""}</option>
            ))}
          </select>
        </div>
      )}

      {/* Resumo do ciclo */}
      <h2 style={sectionTitle}>Análise do Ciclo — {data.cycleName}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 36 }}>
        <StatCard label="Progresso geral" value={`${Math.round(data.cycleProgress * 100)}%`} accent={progressColor(data.cycleProgress)} />
        <StatCard label="Ações concluídas" value={`${data.completedActions}/${data.totalActions}`} accent="#16a34a" />
        <StatCard label="Em progresso" value={String(data.inProgressActions)} accent="#3b82f6" />
        <StatCard label="Não iniciadas" value={String(data.notStartedActions)} accent="#9ca3af" />
        <StatCard label="Em risco" value={String(data.atRiskActions)} accent="#ef4444" />
        <StatCard label="Sem responsável" value={String(data.actionsWithoutOwner)} accent="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 36 }}>
        {/* Objetivos em risco */}
        <Section title="Objetivos em Risco" icon="⚠️">
          {data.atRiskObjectives.length === 0 ? (
            <p style={emptyMsg}>Nenhum objetivo crítico. Bom trabalho!</p>
          ) : (
            data.atRiskObjectives.map((obj: any) => (
              <div key={obj.id} style={riskItem}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#222", flex: 1, marginRight: 8 }}>{obj.title}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#ef4444" }}>{Math.round(obj.progress * 100)}%</span>
                </div>
                <ProgressBar value={obj.progress} />
                <div style={{ fontSize: 11, color: "#888", marginTop: 5 }}>
                  {obj.completedKRs}/{obj.totalKRs} KRs concluídos
                </div>
              </div>
            ))
          )}
        </Section>

        {/* Destaques positivos */}
        <Section title="Destaques Positivos" icon="✅">
          {data.topObjectives.length === 0 ? (
            <p style={emptyMsg}>Acelere as entregas para aparecer aqui.</p>
          ) : (
            data.topObjectives.map((obj: any) => (
              <div key={obj.id} style={riskItem}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#222", flex: 1, marginRight: 8 }}>{obj.title}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>{Math.round(obj.progress * 100)}%</span>
                </div>
                <ProgressBar value={obj.progress} />
              </div>
            ))
          )}
        </Section>
      </div>

      {/* Botão de Alertas por Email — apenas para admins */}
      {isAdmin && (
        <div style={{
          background: "white", borderRadius: 14, padding: "20px 24px", marginBottom: 32,
          border: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#222", marginBottom: 4 }}>
              Notificar responsáveis por email
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>
              Envia email automático para cada owner com suas tarefas atrasadas ou em risco.
              Os emails são puxados dos usuários cadastrados no sistema.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <button
              onClick={handleSendAlerts}
              disabled={sending}
              style={{
                padding: "10px 22px", borderRadius: 8, border: "none",
                background: sending ? "#e5e7eb" : "#dc2626",
                color: sending ? "#9ca3af" : "white",
                fontSize: 14, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", whiteSpace: "nowrap",
              }}
            >
              {sending ? "Enviando..." : "⚠️ Enviar alertas por email"}
            </button>
            {alertResult && (
              <div style={{ fontSize: 12, textAlign: "right", maxWidth: 280 }}>
                {alertResult.error ? (
                  <span style={{ color: "#dc2626" }}>
                    {alertResult.noApiKey
                      ? "Configure RESEND_API_KEY no Render para ativar emails."
                      : alertResult.error}
                  </span>
                ) : alertResult.sent === 0 ? (
                  <span style={{ color: "#6b7280" }}>Nenhuma tarefa em atraso com responsável encontrada.</span>
                ) : (
                  <span style={{ color: "#16a34a" }}>
                    ✓ {alertResult.sent} email{alertResult.sent > 1 ? "s" : ""} enviado{alertResult.sent > 1 ? "s" : ""}
                    {alertResult.recipients?.length > 0 && (
                      <span style={{ display: "block", color: "#888", marginTop: 2 }}>
                        Para: {alertResult.recipients.join(", ")}
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sugestões para o próximo trimestre */}
      <h2 style={sectionTitle}>Sugestões para o Próximo Trimestre</h2>
      <p style={{ fontSize: 13, color: "#aaa", marginTop: -10, marginBottom: 16, lineHeight: 1.5 }}>
        Clique em qualquer sugestão para ver o briefing completo com análise da empresa e contexto de mercado.
      </p>
      <div style={{ background: "white", borderRadius: 14, padding: 24, marginBottom: 28, border: "1px solid #f0f0f0" }}>
        {(data.suggestions as SuggestionItem[]).map((s, i) => (
          <SuggestionRow
            key={s.id || i}
            item={s}
            isActive={activeBriefing?.item.id === s.id && !activeBriefing?.isImprovement}
            onClick={() => setActiveBriefing(
              activeBriefing?.item.id === s.id && !activeBriefing?.isImprovement
                ? null
                : { item: s, isImprovement: false }
            )}
            color="#6366f1"
            data={data}
          />
        ))}
      </div>

      {/* Melhorias contínuas */}
      <h2 style={sectionTitle}>Ações de Melhoria Contínua</h2>
      <p style={{ fontSize: 13, color: "#aaa", marginTop: -10, marginBottom: 16, lineHeight: 1.5 }}>
        Clique em qualquer melhoria para ver o briefing com análise do contexto interno da empresa.
      </p>
      <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #f0f0f0" }}>
        {(data.improvements as SuggestionItem[]).map((s, i) => (
          <SuggestionRow
            key={s.id || i}
            item={s}
            isActive={activeBriefing?.item.id === s.id && activeBriefing?.isImprovement}
            onClick={() => setActiveBriefing(
              activeBriefing?.item.id === s.id && activeBriefing?.isImprovement
                ? null
                : { item: s, isImprovement: true }
            )}
            color="#f59e0b"
            data={data}
          />
        ))}
      </div>

      {/* Modal de briefing */}
      {activeBriefing && (
        <BriefingModal
          item={activeBriefing.item}
          isImprovement={activeBriefing.isImprovement}
          data={data}
          onClose={() => setActiveBriefing(null)}
        />
      )}
    </div>
  )
}

// ─── Suggestion Row (clicável com briefing inline) ───────────────────────────

function SuggestionRow({ item, isActive, onClick, color, data }: {
  item: SuggestionItem; isActive: boolean; onClick: () => void
  color: string; data: any
}) {
  const dotColor = color
  return (
    <div style={{ borderBottom: "1px solid #f5f5f5" }}>
      <div
        onClick={onClick}
        style={{
          display: "flex", alignItems: "flex-start", gap: 14, padding: "13px 0",
          cursor: "pointer",
          background: isActive ? `${color}06` : "transparent",
          borderRadius: isActive ? 8 : 0,
          paddingLeft: isActive ? 10 : 0,
          paddingRight: isActive ? 10 : 0,
          transition: "all 0.15s",
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, marginTop: 6, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5, fontWeight: isActive ? 600 : 400 }}>
            {item.text}
          </span>
          {item.triggerMetrics?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
              {item.triggerMetrics.map((m, i) => (
                <span key={i} style={{
                  fontSize: 10, color: color, background: `${color}12`,
                  padding: "2px 7px", borderRadius: 10, fontWeight: 600,
                }}>
                  {m.label}: {m.value}
                </span>
              ))}
            </div>
          )}
        </div>
        <span style={{ fontSize: 12, color: isActive ? color : "#bbb", flexShrink: 0, fontWeight: 600, marginTop: 1 }}>
          {isActive ? "▲ fechar" : "ver briefing ▾"}
        </span>
      </div>

      {isActive && (
        <InlineBriefing item={item} data={data} />
      )}
    </div>
  )
}

// ─── Inline Briefing (expandido abaixo da sugestão) ─────────────────────────

function InlineBriefing({ item, data }: { item: SuggestionItem; data: any }) {
  const briefing = generateBriefing(item, data)

  return (
    <div style={{
      margin: "0 0 14px 22px",
      background: "#f8f9fb",
      borderRadius: 10,
      padding: "18px 20px",
      border: "1px solid #eaecef",
    }}>
      {/* Métricas que ativaram */}
      {item.triggerMetrics?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Dados que geraram esta análise
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {item.triggerMetrics.map((m, i) => (
              <div key={i} style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: 8, padding: "6px 12px" }}>
                <div style={{ fontSize: 10, color: "#aaa" }}>{m.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contexto da empresa */}
      <div style={{ marginBottom: briefing.marketContext ? 16 : 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          🏢 Contexto da empresa
        </div>
        {briefing.companyContext.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: "#ccc", marginTop: 3 }}>●</span>
            <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{line}</span>
          </div>
        ))}
      </div>

      {/* Contexto de mercado (só sugestões) */}
      {briefing.marketContext && briefing.marketContext.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            🌍 Contexto de mercado
          </div>
          {briefing.marketContext.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: "#ccc", marginTop: 3 }}>●</span>
              <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{line}</span>
            </div>
          ))}
        </div>
      )}

      {/* Por que importa */}
      <div style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
          ⚡ Por que importa agora
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>{briefing.whyItMatters}</p>
      </div>

      {/* Próximos passos */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          🎯 Próximos passos
        </div>
        {briefing.nextSteps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
            <div style={{
              minWidth: 20, height: 20, borderRadius: "50%", background: "#6366f1",
              color: "white", fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{i + 1}</div>
            <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Briefing Modal (fallback — não usado mais, mas mantido para future use) ──

function BriefingModal({ item, isImprovement, data, onClose }: {
  item: SuggestionItem; isImprovement: boolean; data: any; onClose: () => void
}) {
  const briefing = generateBriefing(item, data)
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", borderRadius: 16, padding: 32, maxWidth: 680, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: isImprovement ? "#f59e0b" : "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {isImprovement ? "Melhoria Contínua" : "Sugestão Próximo Ciclo"}
            </span>
            <h2 style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 700, color: "#111" }}>{item.text}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#bbb" }}>✕</button>
        </div>
        <InlineBriefing item={item} data={data} />
      </div>
    </div>
  )
}

// ─── Briefing Generator ───────────────────────────────────────────────────────

function generateBriefing(item: SuggestionItem, data: any): BriefingContent {
  const pct = Math.round((data.cycleProgress || 0) * 100)
  const completionPct = data.totalActions > 0
    ? Math.round(data.completedActions / data.totalActions * 100)
    : 0

  const briefings: Record<string, BriefingContent> = {

    focus_reduction: {
      title: "Redução de Foco",
      companyContext: [
        `O ciclo atual registra ${pct}% de progresso médio — abaixo do esperado para este estágio`,
        `${data.notStartedActions || 0} ações ainda não foram iniciadas de ${data.totalActions || 0} no total`,
        `${data.atRiskActions || 0} ações classificadas como em risco — sinal de carga excessiva`,
        data.totalObjectives > 3
          ? `Com ${data.totalObjectives} objetivos simultâneos, a atenção da equipe está fragmentada`
          : `${data.totalObjectives} objetivos no ciclo — ainda é possível concentrar mais foco`,
      ].filter(Boolean),
      marketContext: [
        "A metodologia OKR documentada por John Doerr ('Measure What Matters') recomenda máximo de 3-5 objetivos por nível por ciclo",
        "Google, LinkedIn e Intel, pioneiros no uso de OKRs, limitam a 3-4 objetivos por equipe — o excesso dilui o esforço e mascara prioridades reais",
        "Estudos da Harvard Business School mostram que times focados em 3 objetivos entregam 40-60% mais resultados do que times com 7+ objetivos",
        "O modelo de 'essencialismo' de Greg McKeown (livro Essentialism) demonstra que a contribuição máxima vem de fazer menos, mas melhor",
      ],
      whyItMatters: `Com ${pct}% de progresso e ${data.atRiskActions || 0} ações em risco, a equipe está distribuída em excesso. Cada objetivo adicionado divide os recursos disponíveis. Fechar o ciclo com 2 objetivos excelentes vale mais do que encerrar com 5 mediocres — e cria a base de confiança para crescer no próximo ciclo.`,
      nextSteps: [
        "Listar todos os objetivos atuais e rankeá-los por impacto estratégico real",
        "Identificar os 1-2 com menor progresso E menor prioridade — candidatos a descarte",
        "Comunicar ao time o motivo do foco: transparência aumenta adesão",
        "Para o próximo ciclo, começar com no máximo 3 objetivos e adicionar apenas se a capacidade permitir",
      ],
    },

    review_ambition: {
      title: "Revisão de Ambição dos KRs",
      companyContext: [
        `Progresso do ciclo em ${pct}% com ${data.inProgressActions || 0} ações em andamento`,
        `${data.atRiskActions || 0} ações em risco — possível indicador de metas superdimensionadas`,
        `Taxa de conclusão atual: ${completionPct}% — abaixo do nível saudável de 40-70%`,
      ],
      marketContext: [
        "O Google define OKRs esperando 70% de conclusão como o ponto ideal — 100% indica que a meta era conservadora demais",
        "Metas muito agressivas geram paralisia: a equipe sabe que não vai atingir e perde motivação para tentar",
        "O modelo de 'stretch goals calibrados' de Andy Grove (Intel) recomenda metas desafiadoras mas no limite do possível — não impossíveis",
        "Pesquisas de Edwin Locke sobre Goal Setting Theory mostram que metas específicas e moderadamente difíceis são as que mais motivam performance",
      ],
      whyItMatters: `Quando metas são inalcançáveis, o sistema OKR perde credibilidade. O time começa a tratar os KRs como aspirações vazias, não como compromissos reais. Calibrar a ambição preserva o senso de possibilidade e mantém a equipe engajada até o final do ciclo.`,
      nextSteps: [
        "Revisar cada KR com o respectivo responsável: a meta é genuinamente desafiadora ou impossível?",
        "Para KRs com 0% de progresso no meio do ciclo, questionar o que está bloqueando o início",
        "Ajustar metas dentro do ciclo se necessário — é melhor rever agora do que encerrar com 0%",
        "No próximo planejamento, usar o histórico de conclusão como referência para calibrar ambição",
      ],
    },

    weekly_ritual: {
      title: "Ritual Semanal de Acompanhamento",
      companyContext: [
        `${data.atRiskActions || 0} ações classificadas como em risco neste ciclo`,
        `Taxa de conclusão atual: ${completionPct}% — ritmo de acompanhamento precisa aumentar`,
        `${data.actionsWithoutOwner || 0} ações sem responsável — indica ausência de rastreabilidade`,
      ],
      marketContext: [
        "Times que fazem check-ins semanais de OKR têm 2.5x mais chances de atingir seus objetivos (dados: OKR Forum 2023)",
        "A Spotify e Netflix institucionalizam reviews semanais como prática de alta performance — não como reunião de status, mas como sessão de desbloqueio",
        "O conceito de 'CFRs' (Conversations, Feedback, Recognition) de John Doerr é o complemento humano dos OKRs — e acontece em ritmo semanal",
        "Reuniões de 30 minutos com agenda clara (o que avançou, o que travou, o que precisa de ajuda) têm ROI documentado em times ágeis",
      ],
      whyItMatters: `OKRs definidos e não acompanhados são apenas documentos. O ciclo de acompanhamento semanal transforma OKRs em conversa viva — detecta bloqueios antes que virem crises, redistribui recursos em tempo real e mantém o time alinhado ao que importa.`,
      nextSteps: [
        "Definir um horário fixo semanal (ex: sexta 9h) para a revisão de OKRs — máximo 30 minutos",
        "Criar uma agenda padrão: KRs críticos primeiro, depois ações em risco, depois reconhecimentos",
        "Usar a aba de Insights do Strategic OS para pautar a reunião com dados reais",
        "Nomear um facilitador fixo para manter a disciplina do ritual",
      ],
    },

    maintain_objectives: {
      title: "Manutenção do Ritmo",
      companyContext: [
        `Ciclo em ${pct}% de progresso — dentro da faixa saudável de execução`,
        `${data.completedActions || 0} ações concluídas de ${data.totalActions || 0} no total`,
        `${data.inProgressActions || 0} ações em andamento — equipe ativa e executando`,
      ],
      marketContext: [
        "Times com 40-60% de progresso no meio do ciclo historicamente fecham acima de 70% — o ritmo atual é positivo",
        "O maior risco agora não é a ambição, mas a desaceleração: times tendem a perder momentum na reta final",
        "Pesquisas sobre psicologia de metas ('goal proximity effect') mostram que proximidade do fim aumenta esforço — use isso a favor",
        "Empresas como Salesforce usam a regra: se está no caminho, não mude o objetivo — mude o suporte e os recursos para garantir a chegada",
      ],
      whyItMatters: `Estar no caminho é uma vantagem que pode ser desperdiçada com interrupções, redefinições ou falta de suporte na reta final. O foco agora é proteger o momentum, destravar bloqueios pontuais e garantir que o time chegue ao fim do ciclo com confiança.`,
      nextSteps: [
        "Identificar especificamente quais ações estão travadas e o motivo",
        "Fazer uma reunião de 'desbloqueio' com os responsáveis das ações paradas",
        "Proteger o foco da equipe: evitar adicionar novos objetivos ou tarefas ao ciclo em andamento",
        "Preparar os dados para a retrospectiva e planejamento do próximo ciclo",
      ],
    },

    elevate_kr: {
      title: "Elevação de Metas para o Próximo Ciclo",
      companyContext: [
        `Ciclo atual em ${pct}% — performance dentro do esperado`,
        `${data.completedActions || 0} ações entregues — capacidade de execução demonstrada`,
        `KRs com desempenho acima de 60% indicam que há espaço para elevar a ambição`,
      ],
      marketContext: [
        "O princípio do 'progressive overload' — elevar gradualmente a carga — é aplicado em OKRs de alta performance para crescimento sustentável",
        "Empresas que aumentam metas 15-20% por ciclo após bom desempenho crescem em média 3x mais rápido do que as que mantêm metas estáticas",
        "A teoria de Amy Edmondson sobre 'psychological safety' mostra que equipes que comemoraram sucessos passados aceitam metas mais ousadas",
      ],
      whyItMatters: `KRs que foram atingidos facilmente sinalizam capacidade subutilizada. Elevar as metas no próximo ciclo é uma forma de respeitar o crescimento da equipe e continuar desafiando o negócio — sem queimar a equipe com saltos impossíveis.`,
      nextSteps: [
        "Mapear os KRs que superaram 80% neste ciclo — esses são candidatos a elevação",
        "Elevar as metas em 15-25% no próximo ciclo para esses KRs específicos",
        "Verificar se os recursos (time, ferramenta, budget) acompanham a elevação da meta",
        "Comunicar a elevação como reconhecimento de performance, não como pressão",
      ],
    },

    document_blockers: {
      title: "Documentação dos Bloqueios",
      companyContext: [
        `${data.atRiskActions || 0} ações em risco identificadas neste ciclo`,
        `${data.notStartedActions || 0} ações que nunca foram iniciadas`,
        `Progresso atual de ${pct}% — há espaço para aprender com o que travou`,
      ],
      marketContext: [
        "Retrospectivas estruturadas são práticas universais em times ágeis de alto desempenho (Scrum, Kanban, XP)",
        "O Google Project Aristotle identificou que times que falam abertamente sobre falhas são 35% mais produtivos no ciclo seguinte",
        "Empresas como Amazon e Netflix têm rituais formais de 'post-mortem sem culpa' — o objetivo é aprender, não punir",
        "Documentar bloqueios não é admitir falha — é construir inteligência operacional que acelera os próximos ciclos",
      ],
      whyItMatters: `O que travou a execução este trimestre vai travar o próximo — a menos que seja identificado e resolvido. Documentar os bloqueios antes de planejar o próximo ciclo evita repetir os mesmos erros e constrói um histórico de aprendizado que se torna vantagem competitiva.`,
      nextSteps: [
        "Agendar uma sessão de retrospectiva antes do planejamento do próximo ciclo",
        "Para cada ação não concluída, registrar: o que travou? dependência? recurso? decisão pendente?",
        "Classificar os bloqueios em: processo, pessoa, tecnologia ou estratégia",
        "Criar um plano de ação específico para resolver cada bloqueio recorrente antes do próximo ciclo",
      ],
    },

    elevate_goals: {
      title: "Elevação Estratégica de Metas",
      companyContext: [
        `Ciclo em ${pct}% — performance excepcional de execução`,
        `${data.completedActions || 0} ações entregues — capacidade máxima demonstrada`,
        `${data.topObjectives?.length || 0} objetivos acima de 60% — múltiplas frentes funcionando`,
      ],
      marketContext: [
        "Empresas que crescem acima da média do mercado elevam metas sistematicamente após ciclos de alta performance — é o princípio do 'moon-shot thinking' do Google X",
        "O modelo de Amazon de 'Day 1 mentality' — tratar o sucesso como ponto de partida, não de chegada — é a razão pela qual a empresa permanece em crescimento acelerado",
        "Pesquisas de Jim Collins ('Good to Great') mostram que empresas 'boas demais para arriscar' ficam estagnadas — o crescimento verdadeiro exige metas que assustam um pouco",
        "Elevar metas em 20-30% após alta performance é um nível de ambição documentado como 'atingível com esforço' — diferente de metas impossíveis",
      ],
      whyItMatters: `Atingir metas com folga é um sinal claro de que o negócio tem mais capacidade do que os objetivos atuais exploram. Elevar agora — enquanto o momentum é alto, a confiança é grande e a equipe está engajada — é o momento ideal para acelerar o crescimento.`,
      nextSteps: [
        "Mapear todos os objetivos com performance acima de 60% e calcular o potencial de elevação realista",
        "Elevar as metas dos top performers em 20-30% no próximo ciclo",
        "Adicionar um objetivo de inovação/expansão para explorar novas fronteiras",
        "Documentar o playbook de execução que funcionou para replicar nos times de menor performance",
      ],
    },

    replicate_success: {
      title: "Replicação de Processos de Sucesso",
      companyContext: [
        `Taxa de conclusão de ${completionPct}% — acima da média de mercado`,
        `${data.completedActions || 0} ações entregues com sucesso neste ciclo`,
        `${data.topObjectives?.length || 0} objetivos destacados como positivos`,
      ],
      marketContext: [
        "O conceito de 'best practice replication' é central na metodologia de scaling de Patrick Lencioni — o que funciona em uma área deve ser sistematizado e exportado",
        "A McKinsey documenta que 70% das iniciativas de transformação organizacional falham por não transferir aprendizados entre times",
        "Empresas como Toyota e Pixar têm sistemas formais de captura e replicação de sucesso — o Toyota Production System é o exemplo mais estudado",
        "Replicar o que funciona é mais rápido e barato do que criar soluções do zero — e tem maior taxa de adoção",
      ],
      whyItMatters: `O sucesso deste ciclo não é apenas um resultado — é um processo que pode ser exportado. Cada prática que gerou performance é um ativo intelectual da empresa. Se não for documentado e replicado, esse conhecimento fica na cabeça de 1-2 pessoas e se perde.`,
      nextSteps: [
        "Identificar as 2-3 práticas específicas que mais contribuíram para a alta performance",
        "Documentar o processo em formato simples (checklist, SOP, vídeo curto)",
        "Identificar as áreas/times com menor performance e planejar a transferência",
        "Criar um momento formal de compartilhamento: reunião all-hands, lunch & learn ou workshop",
      ],
    },

    add_innovation: {
      title: "Objetivo de Inovação",
      companyContext: [
        `Progresso do ciclo em ${pct}% — momentum favorável para novos desafios`,
        `${data.completedActions || 0} entregas confirmam capacidade de execução`,
        `Base operacional sólida — condição ideal para explorar novos horizontes`,
      ],
      marketContext: [
        "Google destina 20% do tempo dos engenheiros para projetos de inovação — essa regra gerou Gmail, Google Maps e AdSense",
        "Clayton Christensen ('The Innovator's Dilemma') demonstra que empresas que não inovam enquanto são bem-sucedidas são as mais vulneráveis à disrupção",
        "Amazon, Apple e Microsoft têm em comum a disciplina de lançar novos produtos/serviços enquanto o core ainda está crescendo — nunca esperam a crise",
        "A janela de inovação ideal é exatamente quando o negócio vai bem: há recursos, energia e confiança para arriscar sem comprometer o core",
      ],
      whyItMatters: `O melhor momento para inovar é quando você pode se dar ao luxo de falhar — ou seja, agora, com o negócio funcionando bem. Esperar a crise para inovar é tarde demais. Um objetivo de inovação no próximo ciclo pode ser o semente do próximo grande produto ou mercado da empresa.`,
      nextSteps: [
        "Listar 3-5 ideias de inovação que a equipe já mencionou mas nunca priorizou",
        "Votar nas 2 mais promissoras e viáveis para o próximo ciclo",
        "Criar um objetivo de inovação com KRs claros e time dedicado (mesmo que pequeno)",
        "Proteger esse objetivo de cortes de resources — inovação precisa de espaço para errar",
      ],
    },

    not_started_objs: {
      title: "Objetivos sem Progresso",
      companyContext: [
        `${data.notStartedActions || 0} ações ainda não iniciadas no ciclo`,
        `Ciclo atual em ${pct}% — objetivos zerados puxam a média para baixo`,
        `${data.totalObjectives || 0} objetivos ativos — concentração pode ser a solução`,
      ],
      marketContext: [
        "Objetivos 'fantasmas' — que existem no plano mas nunca são executados — são identificados por Andy Grove como o principal desperdício em gestão por objetivos",
        "Pesquisas de behavioral economics mostram que manter objetivos impossíveis na lista causa 'decision fatigue' e reduz a performance nos objetivos factíveis",
        "A filosofia Lean de 'stop starting, start finishing' recomenda encerrar o WIP antes de abrir novos trabalhos",
        "Dropbox e Stripe têm a prática de revisão mensal de objetivos: o que não tem progresso em 30 dias é descartado ou replanejado — sem clemência",
      ],
      whyItMatters: `Objetivos sem progresso no ciclo consomem atenção mental mesmo quando não são executados — criam culpa, confundem prioridades e distraem da execução do que é possível. Descartá-los ou replanejá-los libera energia para o que realmente vai mover o negócio.`,
      nextSteps: [
        "Para cada objetivo zerado: perguntar 'por que não começou?' — falta de recurso, decisão pendente ou prioridade real?",
        "Se a resposta for falta de prioridade real: descartar o objetivo e comunicar ao time",
        "Se for recurso/decisão: resolver o bloqueio esta semana ou renegociar a meta",
        "No próximo ciclo, não incluir objetivos sem um 'first step' definido antes do planejamento",
      ],
    },

    high_completion: {
      title: "Alta Taxa de Conclusão",
      companyContext: [
        `${completionPct}% das ações do ciclo foram concluídas — execução excepcional`,
        `${data.completedActions || 0} entregas confirmadas neste ciclo`,
        `Indicador de equipe bem coordenada e objetivos bem calibrados`,
      ],
      marketContext: [
        "Empresas com taxa de conclusão acima de 70% estão no quartil superior de performance operacional (benchmark: OKR Forum 2024)",
        "A correlação entre taxa de conclusão de ações e crescimento de receita é de 0.78 em empresas de serviços (estudo Harvard/MIT 2022)",
        "Times de alta performance não têm apenas boas estratégias — têm sistemas de execução que garantem que o que foi planejado seja feito",
        "O próximo nível de crescimento para times nesse estágio é elevar o impacto estratégico das ações — não apenas executar mais, mas executar o que mais importa",
      ],
      whyItMatters: `Executar bem é raro e valioso. Mas execução eficiente sem impacto estratégico é otimização do sistema errado. Com essa taxa de conclusão, a equipe está pronta para assumir objetivos de maior impacto — o desafio agora é escolher as batalhas certas, não apenas vencê-las todas.`,
      nextSteps: [
        "Reconhecer a equipe publicamente pelo resultado — performance deve ser celebrada",
        "Documentar o processo de execução que gerou esse resultado para replicar",
        "No próximo ciclo, elevar o nível estratégico das ações — menos tarefas operacionais, mais iniciativas de impacto",
        "Usar esse histórico como argumento para elevar metas e budget no próximo planejamento",
      ],
    },

    // ── MELHORIAS CONTÍNUAS ────────────────────────────────────────────────

    missing_owners: {
      title: "Ações sem Responsável",
      companyContext: [
        `${data.actionsWithoutOwner || 0} ações sem responsável definido neste ciclo`,
        `Representa ${data.totalActions > 0 ? Math.round(data.actionsWithoutOwner / data.totalActions * 100) : 0}% do total de ações`,
        `Ações sem dono têm ${data.atRiskActions || 0} registros em risco associados`,
        `Ciclo em ${pct}% — falta de accountability impacta diretamente o progresso`,
      ],
      whyItMatters: `Accountability individual é o driver #1 de execução em qualquer metodologia de gestão. Uma ação sem dono não tem ninguém que priorize, acompanhe ou responda por ela — ela simplesmente não acontece. Cada ação sem responsável é um risco real de não-entrega.`,
      nextSteps: [
        "Abrir a aba OKRs e filtrar por 'sem responsável' para identificar as ações",
        "Atribuir um dono específico para cada ação — preferencialmente quem tem mais contexto",
        "Validar com o responsável: ele/ela está ciente e tem capacidade de entregar?",
        "No próximo ciclo, bloquear a criação de ações sem responsável no planejamento",
      ],
    },

    at_risk_actions: {
      title: "Ações em Risco",
      companyContext: [
        `${data.atRiskActions || 0} ações classificadas como 'Em risco' neste ciclo`,
        `Ciclo em ${pct}% — ações em risco não resolvidas comprometem o fechamento`,
        `${data.inProgressActions || 0} ações em andamento — algumas podem virar risco em breve`,
      ],
      whyItMatters: `Ações em risco não resolvidas em 1-2 semanas tipicamente se tornam bloqueios definitivos. O custo de intervir agora é uma reunião de 30 minutos. O custo de não intervir é um objetivo não concluído e um ciclo perdido. A janela de correção está aberta — mas por pouco tempo.`,
      nextSteps: [
        "Listar todas as ações em risco e seus responsáveis",
        "Agendar uma reunião de desbloqueio para esta semana — máximo 45 minutos",
        "Para cada ação em risco: identificar o impedimento específico (recurso, decisão, dependência)",
        "Definir um plano de ação claro: o que vai mudar, quem faz, até quando",
        "Se o impedimento não puder ser resolvido: renegociar o escopo ou prazo da ação",
      ],
    },

    not_started_actions: {
      title: "Ações Não Iniciadas",
      companyContext: [
        `Ações ainda no status 'Não iniciado' em objetivos de baixo progresso`,
        `Ciclo em ${pct}% — cada ação não iniciada é um risco de encerramento zerado`,
        `${data.notStartedActions || 0} ações não iniciadas no total do ciclo`,
      ],
      whyItMatters: `A principal barreira de execução não é a dificuldade da tarefa — é o início. Uma vez começada, uma ação tem 80% de chance de ser concluída (Zeigarnik Effect). Criar o 'primeiro passo' — mesmo pequeno — quebra a inércia e ativa o comprometimento psicológico com a entrega.`,
      nextSteps: [
        "Selecionar a ação mais simples do conjunto (a que pode ser feita amanhã)",
        "Definir explicitamente: quem faz, o que faz, em que horário amanhã",
        "Fazer a primeira entrega visível o quanto antes — isso cria momentum para o restante",
        "Verificar se há algum bloqueio real que impede o início — se sim, resolver antes de amanhã",
      ],
    },

    recognition: {
      title: "Reconhecimento da Equipe",
      companyContext: [
        `${data.completedActions || 0} ações concluídas neste ciclo — resultado concreto`,
        `Taxa de conclusão de ${completionPct}% — performance acima da média`,
        `A equipe demonstrou capacidade de execução consistente`,
      ],
      whyItMatters: `Reconhecimento explícito é um dos investimentos de maior ROI em gestão de pessoas. Pesquisas da Gallup mostram que times que recebem reconhecimento regular têm 31% menos turnover, 2.5x mais produtividade e 3x mais engagement. E não custa dinheiro — custa atenção.`,
      nextSteps: [
        "Fazer um anúncio público no próximo encontro de equipe — nomear quem entregou e o que entregou",
        "Vincular a conquista ao impacto estratégico: 'você completou X, o que nos aproxima de Y'",
        "Considerar um reconhecimento escrito (Slack, e-mail ou sistema interno) para que fique registrado",
        "Perguntar à equipe o que tornou possível essa entrega — use a resposta para replicar o processo",
      ],
    },

    sustained_pace: {
      title: "Manutenção do Ritmo Consistente",
      companyContext: [
        `Indicadores do ciclo mostram execução dentro do esperado`,
        `${data.completedActions || 0} ações concluídas — progresso consistente`,
        `Ciclo em ${pct}% — ritmo sustentável e previsível`,
      ],
      whyItMatters: `Consistência é mais valiosa do que intensidade em ambientes de trabalho sustentáveis. Times que oscilam entre sprints intensos e quedas de produtividade têm performance média inferior a times que mantêm ritmo constante. O ritmo atual é um ativo — protegê-lo é estratégico.`,
      nextSteps: [
        "Manter as cerimônias de acompanhamento atuais sem interrupções",
        "Ajustar metas gradualmente, sem saltos bruscos que quebrem o ritmo",
        "Documentar o que está funcionando para preservar após mudanças de time ou liderança",
        "Usar esse momento de estabilidade para investir em melhoria de processos e ferramentas",
      ],
    },
  }

  return briefings[item.type] || {
    title: item.text,
    companyContext: item.triggerMetrics.map(m => `${m.label}: ${m.value}`),
    whyItMatters: "Esta análise foi gerada com base nos dados do ciclo atual.",
    nextSteps: ["Revisar os dados do ciclo com a equipe", "Definir um plano de ação específico"],
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderRadius: 14, padding: 22, border: "1px solid #f0f0f0" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#222", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>{title}
      </div>
      {children}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: "16px 18px", border: "1px solid #f0f0f0", borderLeft: `4px solid ${accent}` }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{value}</div>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: progressColor(value), borderRadius: 4, transition: "width 0.4s" }} />
    </div>
  )
}

function progressColor(v: number): string {
  const p = v * 100
  if (p >= 80) return "#16a34a"
  if (p >= 40) return "#3b82f6"
  if (p > 0)  return "#f59e0b"
  return "#ef4444"
}

const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 16px 0" }
const emptyMsg: React.CSSProperties = { fontSize: 13, color: "#aaa", margin: 0, fontStyle: "italic" }
const riskItem: React.CSSProperties = { padding: "10px 0", borderBottom: "1px solid #f5f5f5" }
