// ============================================================================
// SEED — Funil Faixa Preta (FFP)
// Popula o banco com dados reais para demonstração e uso em produção.
//
// Roda com: node seed.js  (dentro de Back/server)
// ============================================================================

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

// ─────────────────────────────────────────────────────────────────────────────
// Funções de cálculo de progresso (espelham okr-progress.ts)
// ─────────────────────────────────────────────────────────────────────────────

function calcActionProgress(statuses) {
  if (!statuses.length) return 0
  const score = statuses.reduce((s, st) => {
    if (st === "COMPLETED")  return s + 1.0
    if (st === "IN_PROGRESS") return s + 0.5
    if (st === "AT_RISK")    return s + 0.3
    return s
  }, 0)
  return score / statuses.length
}

function calcMetricProgress(start, current, target) {
  if (target === start) return 0
  return Math.min(1, Math.max(0, (current - start) / (target - start)))
}

function avgProgress(values) {
  if (!values.length) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

// ─────────────────────────────────────────────────────────────────────────────
// DADOS DOS CLIENTES
// ─────────────────────────────────────────────────────────────────────────────

// Core: 25 clientes ativos desde Jan/2026 ou antes → MRR base R$ 35.000
const CLIENTS_CORE = [
  { name: "Grupo Apex",              service: "Tráfego Pago", monthlyValue: 3500, startDate: "2025-07-01" },
  { name: "Imobiliária Premium",     service: "Tráfego Pago", monthlyValue: 2500, startDate: "2025-07-01" },
  { name: "TechStart Solutions",     service: "Agente de IA", monthlyValue: 3000, startDate: "2025-09-01" },
  { name: "Clínica Bella Forma",     service: "Tráfego Pago", monthlyValue: 2200, startDate: "2025-08-01" },
  { name: "Clínica Odonto Sorriso",  service: "Agente de IA", monthlyValue: 2000, startDate: "2025-08-01" },
  { name: "Menta Saúde Mental",      service: "Mentoria",     monthlyValue: 2000, startDate: "2025-10-01" },
  { name: "Construtora Horizonte",   service: "Tráfego Pago", monthlyValue: 1800, startDate: "2025-11-01" },
  { name: "Studio Fitness Pro",      service: "Tráfego Pago", monthlyValue: 1800, startDate: "2025-09-01" },
  { name: "Silva & Santos Advocacia",service: "Tráfego Pago", monthlyValue: 1500, startDate: "2025-12-01" },
  { name: "EduPro Cursos Online",    service: "Tráfego Pago", monthlyValue: 1500, startDate: "2025-11-01" },
  { name: "Dr. Henrique Alves",      service: "Tráfego Pago", monthlyValue: 1500, startDate: "2025-10-01" },
  { name: "InvestPro Gestão",        service: "Agente de IA", monthlyValue: 1300, startDate: "2026-01-05" },
  { name: "Moda Trends Store",       service: "Tráfego Pago", monthlyValue: 1200, startDate: "2025-10-15" },
  { name: "Clínica Estética Body",   service: "Tráfego Pago", monthlyValue: 1200, startDate: "2025-12-01" },
  { name: "Escola Top Idiomas",      service: "Tráfego Pago", monthlyValue:  900, startDate: "2025-11-01" },
  { name: "Academia MoveFit",        service: "Tráfego Pago", monthlyValue:  850, startDate: "2025-12-15" },
  { name: "PetShop Vida Animal",     service: "Tráfego Pago", monthlyValue:  800, startDate: "2025-11-15" },
  { name: "Distribuidora Norte",     service: "Tráfego Pago", monthlyValue:  800, startDate: "2026-01-10" },
  { name: "CozinhaBela Food",        service: "Tráfego Pago", monthlyValue:  800, startDate: "2026-01-15" },
  { name: "Restaurante Sabor & Arte",service: "Tráfego Pago", monthlyValue:  700, startDate: "2025-12-01" },
  { name: "Buffet Eventos Prime",    service: "Tráfego Pago", monthlyValue:  700, startDate: "2026-01-15" },
  { name: "AutoPeças Rápido",        service: "Tráfego Pago", monthlyValue:  650, startDate: "2025-12-15" },
  { name: "Floricultura Flores & Vida", service: "Tráfego Pago", monthlyValue: 650, startDate: "2025-12-01" },
  { name: "Ótica Visão Clara",       service: "Tráfego Pago", monthlyValue:  600, startDate: "2026-01-05" },
  { name: "Psicóloga Dra. Costa",    service: "Tráfego Pago", monthlyValue:  550, startDate: "2026-01-20" },
]
// Soma: R$ 35.000

// Novos em Fevereiro: +R$ 6.100 → MRR total R$ 41.100
const CLIENTS_FEV = [
  { name: "E-commerce FashionBR",  service: "Tráfego Pago", monthlyValue: 2000, startDate: "2026-02-01" },
  { name: "Clínica Renova Derma",  service: "Tráfego Pago", monthlyValue: 1500, startDate: "2026-02-01" },
  { name: "LegalTech Advogados",   service: "Agente de IA", monthlyValue: 1200, startDate: "2026-02-01" },
  { name: "Coworking EspaçoWork",  service: "Tráfego Pago", monthlyValue:  800, startDate: "2026-02-10" },
  { name: "Studio Pilates Zen",    service: "Tráfego Pago", monthlyValue:  600, startDate: "2026-02-15" },
]

// Novos em Março: +R$ 8.500 → MRR total R$ 49.600
const CLIENTS_MAR = [
  { name: "AgropecuáriaVerde Sul",  service: "Tráfego Pago", monthlyValue: 2200, startDate: "2026-03-01" },
  { name: "BusinessUp Mentoria",    service: "Mentoria",     monthlyValue: 2000, startDate: "2026-03-01" },
  { name: "HealthTech App",         service: "Agente de IA", monthlyValue: 2000, startDate: "2026-03-01" },
  { name: "Franquia TapiocaExpress",service: "Tráfego Pago", monthlyValue: 1500, startDate: "2026-03-01" },
  { name: "Escola de Arte Criativa",service: "Tráfego Pago", monthlyValue:  800, startDate: "2026-03-10" },
]

const ALL_CLIENTS = [...CLIENTS_CORE, ...CLIENTS_FEV, ...CLIENTS_MAR]

// ─────────────────────────────────────────────────────────────────────────────
// TRANSAÇÕES FINANCEIRAS (Jan–Mar 2026)
// amount > 0 = receita  |  amount < 0 = despesa
//
// Jan: Faturamento R$39K, Custo R$29K, Lucro R$10K
// Fev: Faturamento R$43K, Custo R$30K, Lucro R$13K
// Mar: Faturamento R$53K, Custo R$30K, Lucro R$23K
// ─────────────────────────────────────────────────────────────────────────────

const TRANSACTIONS = [
  // ── JANEIRO ──────────────────────────────────────────────────────────────
  { description: "Mensalidades Tráfego Pago — Janeiro",  type: "RECEITA",  amount:  22000, date: "2026-01-05", clientName: null },
  { description: "Mensalidades Agentes de IA — Janeiro", type: "RECEITA",  amount:   8300, date: "2026-01-05", clientName: null },
  { description: "Mensalidades Mentorias — Janeiro",     type: "RECEITA",  amount:   4000, date: "2026-01-05", clientName: null },
  { description: "Projeto implantação IA",               type: "RECEITA",  amount:   2500, date: "2026-01-12", clientName: "TechStart Solutions" },
  { description: "Setup campanha Google",                type: "RECEITA",  amount:   1500, date: "2026-01-18", clientName: "Imobiliária Premium" },
  { description: "Consultoria extra tráfego",            type: "RECEITA",  amount:    700, date: "2026-01-25", clientName: "Grupo Apex" },
  { description: "Equipe e colaboradores — Janeiro",     type: "DESPESA",  amount: -18000, date: "2026-01-31", clientName: null },
  { description: "Ferramentas e softwares",              type: "DESPESA",  amount:  -3500, date: "2026-01-10", clientName: null },
  { description: "Créditos de anúncio",                  type: "DESPESA",  amount:  -4000, date: "2026-01-05", clientName: null },
  { description: "Aluguel e infraestrutura",             type: "DESPESA",  amount:  -2000, date: "2026-01-05", clientName: null },
  { description: "Outras despesas operacionais",         type: "DESPESA",  amount:  -1500, date: "2026-01-20", clientName: null },

  // ── FEVEREIRO ─────────────────────────────────────────────────────────────
  { description: "Mensalidades Tráfego Pago — Fevereiro",  type: "RECEITA",  amount:  24500, date: "2026-02-05", clientName: null },
  { description: "Mensalidades Agentes de IA — Fevereiro", type: "RECEITA",  amount:   8300, date: "2026-02-05", clientName: null },
  { description: "Mensalidades Mentorias — Fevereiro",     type: "RECEITA",  amount:   4000, date: "2026-02-05", clientName: null },
  { description: "Setup campanha + criação de funil",      type: "RECEITA",  amount:   3200, date: "2026-02-10", clientName: "Clínica Renova Derma" },
  { description: "Projeto funil de vendas",                type: "RECEITA",  amount:   2000, date: "2026-02-18", clientName: "E-commerce FashionBR" },
  { description: "Bônus performance Q4/2025",              type: "RECEITA",  amount:   1000, date: "2026-02-20", clientName: "Grupo Apex" },
  { description: "Equipe e colaboradores — Fevereiro",     type: "DESPESA",  amount: -19000, date: "2026-02-28", clientName: null },
  { description: "Ferramentas e softwares",                type: "DESPESA",  amount:  -3800, date: "2026-02-10", clientName: null },
  { description: "Créditos de anúncio",                    type: "DESPESA",  amount:  -4000, date: "2026-02-05", clientName: null },
  { description: "Aluguel e infraestrutura",               type: "DESPESA",  amount:  -2000, date: "2026-02-05", clientName: null },
  { description: "Outras despesas operacionais",           type: "DESPESA",  amount:  -1200, date: "2026-02-20", clientName: null },

  // ── MARÇO ─────────────────────────────────────────────────────────────────
  { description: "Mensalidades Tráfego Pago — Março",  type: "RECEITA",  amount:  31000, date: "2026-03-05", clientName: null },
  { description: "Mensalidades Agentes de IA — Março", type: "RECEITA",  amount:   9300, date: "2026-03-05", clientName: null },
  { description: "Mensalidades Mentorias — Março",     type: "RECEITA",  amount:   6000, date: "2026-03-05", clientName: null },
  { description: "Projeto implantação IA completo",    type: "RECEITA",  amount:   3500, date: "2026-03-12", clientName: "AgropecuáriaVerde Sul" },
  { description: "Auditoria de funil de vendas",       type: "RECEITA",  amount:   2000, date: "2026-03-18", clientName: "E-commerce FashionBR" },
  { description: "Gestão de tráfego extra",            type: "RECEITA",  amount:   1200, date: "2026-03-25", clientName: "Grupo Apex" },
  { description: "Equipe e colaboradores — Março",     type: "DESPESA",  amount: -20000, date: "2026-03-31", clientName: null },
  { description: "Ferramentas e softwares",            type: "DESPESA",  amount:  -3800, date: "2026-03-10", clientName: null },
  { description: "Créditos de anúncio",                type: "DESPESA",  amount:  -4000, date: "2026-03-05", clientName: null },
  { description: "Aluguel e infraestrutura",           type: "DESPESA",  amount:  -2000, date: "2026-03-05", clientName: null },
  { description: "Outras despesas operacionais",       type: "DESPESA",  amount:   -200, date: "2026-03-20", clientName: null },
]

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const prisma = new PrismaClient()

  try {
    // ── 1. LIMPA ──────────────────────────────────────────────────────────
    console.log("Limpando dados antigos...")
    await prisma.syncLog.deleteMany()
    await prisma.externalMapping.deleteMany()
    await prisma.inviteToken.deleteMany()
    await prisma.action.deleteMany()
    await prisma.keyResult.deleteMany()
    await prisma.objective.deleteMany()
    await prisma.cycle.deleteMany()
    await prisma.financialTransaction.deleteMany()
    await prisma.client.deleteMany()
    await prisma.user.deleteMany()
    await prisma.company.deleteMany()
    console.log("OK - dados limpos")

    // ── 2. EMPRESA ────────────────────────────────────────────────────────
    console.log("Criando empresa...")
    const company = await prisma.company.create({
      data: { name: "Funil Faixa Preta", slug: "ffp" },
    })

    // ── 3. USUARIOS ───────────────────────────────────────────────────────
    console.log("Criando usuarios...")
    const hash = await bcrypt.hash("123456", 10)

    const admin = await prisma.user.create({
      data: { email: "admin@ffp.com", password: hash, name: "Admin", role: "ADMIN", companyId: company.id },
    })
    const francimario = await prisma.user.create({
      data: { email: "francimario@ffp.com", password: hash, name: "Francimario", role: "ADMIN", companyId: company.id },
    })
    const duda = await prisma.user.create({
      data: { email: "duda@ffp.com", password: hash, name: "Duda", role: "MEMBER", companyId: company.id },
    })
    const alan = await prisma.user.create({
      data: { email: "alan@ffp.com", password: hash, name: "Alan", role: "MEMBER", companyId: company.id },
    })
    const pedro = await prisma.user.create({
      data: { email: "pedro@ffp.com", password: hash, name: "Pedro", role: "MEMBER", companyId: company.id },
    })
    console.log("OK - 5 usuarios criados")

    // ── 4. CLIENTES ───────────────────────────────────────────────────────
    console.log("Criando 35 clientes...")
    await prisma.client.createMany({
      data: ALL_CLIENTS.map(c => ({
        name:         c.name,
        service:      c.service,
        monthlyValue: c.monthlyValue,
        startDate:    new Date(c.startDate),
        active:       true,
        companyId:    company.id,
      })),
    })
    const mrr = ALL_CLIENTS.reduce((s, c) => s + c.monthlyValue, 0)
    console.log("OK - 35 clientes | MRR atual: R$ " + mrr.toLocaleString("pt-BR"))

    // ── 5. TRANSACOES JAN-MAR 2026 ─────────────────────────────────────────
    console.log("Criando transacoes financeiras Jan-Mar 2026...")
    await prisma.financialTransaction.createMany({
      data: TRANSACTIONS.map(t => ({
        description: t.description,
        type:        t.type,
        amount:      t.amount,
        date:        new Date(t.date),
        clientName:  t.clientName,
        companyId:   company.id,
      })),
    })

    const janRev  = TRANSACTIONS.filter(t => t.date.startsWith("2026-01") && t.amount > 0).reduce((s,t)=>s+t.amount,0)
    const janCost = TRANSACTIONS.filter(t => t.date.startsWith("2026-01") && t.amount < 0).reduce((s,t)=>s+t.amount,0)
    const fevRev  = TRANSACTIONS.filter(t => t.date.startsWith("2026-02") && t.amount > 0).reduce((s,t)=>s+t.amount,0)
    const fevCost = TRANSACTIONS.filter(t => t.date.startsWith("2026-02") && t.amount < 0).reduce((s,t)=>s+t.amount,0)
    const marRev  = TRANSACTIONS.filter(t => t.date.startsWith("2026-03") && t.amount > 0).reduce((s,t)=>s+t.amount,0)
    const marCost = TRANSACTIONS.filter(t => t.date.startsWith("2026-03") && t.amount < 0).reduce((s,t)=>s+t.amount,0)
    console.log("OK - Jan: fat R$" + janRev/1000 + "K / custo R$" + Math.abs(janCost)/1000 + "K / lucro R$" + (janRev+janCost)/1000 + "K")
    console.log("OK - Fev: fat R$" + fevRev/1000 + "K / custo R$" + Math.abs(fevCost)/1000 + "K / lucro R$" + (fevRev+fevCost)/1000 + "K")
    console.log("OK - Mar: fat R$" + marRev/1000 + "K / custo R$" + Math.abs(marCost)/1000 + "K / lucro R$" + (marRev+marCost)/1000 + "K")

    // ── 6. CICLO Q2 2026 ──────────────────────────────────────────────────
    console.log("Criando Ciclo Q2 2026 (ATIVO)...")
    const cycle = await prisma.cycle.create({
      data: {
        label:     "Q2 2026",
        startDate: new Date("2026-04-01"),
        endDate:   new Date("2026-06-30"),
        status:    "ACTIVE",
        companyId: company.id,
      },
    })

    // ── 7. OKRs ───────────────────────────────────────────────────────────
    console.log("Criando OKRs Q2 2026...")

    // ═══════════════════════════════════════════════════════════════════════
    // OBJETIVO 1 — Faturamento R$165K
    // ═══════════════════════════════════════════════════════════════════════

    // KR 1.1 — METRIC_BASED: MRR R$49K → R$55K
    const kr11_progress = calcMetricProgress(49000, 49600, 55000) // ~10%

    // KR 1.2 — ACTION_BASED: 5 novos contratos
    const kr12_statuses = ["COMPLETED", "IN_PROGRESS", "NOT_STARTED", "NOT_STARTED", "NOT_STARTED"]
    const kr12_progress = calcActionProgress(kr12_statuses) // 30%

    // KR 1.3 — ACTION_BASED: upsell IA em 3 clientes
    const kr13_statuses = ["COMPLETED", "IN_PROGRESS", "NOT_STARTED"]
    const kr13_progress = calcActionProgress(kr13_statuses) // 50%

    const obj1_progress = avgProgress([kr11_progress, kr12_progress, kr13_progress]) // ~30%

    const obj1 = await prisma.objective.create({
      data: {
        title:       "Crescer o faturamento para R$ 165K no Q2 2026",
        description: "Expandir receita 45% vs Q1 via novos contratos e upsell de Agentes de IA",
        status:      "IN_PROGRESS",
        progress:    obj1_progress,
        sortOrder:   1,
        ownerId:     francimario.id,
        cycleId:     cycle.id,
        companyId:   company.id,
      },
    })

    const kr11 = await prisma.keyResult.create({
      data: {
        title:        "Expandir MRR de R$ 49K para R$ 55K",
        progressMode: "METRIC_BASED",
        startValue:   49000,
        currentValue: 49600,
        targetValue:  55000,
        unit:         "R$",
        progress:     kr11_progress,
        status:       "IN_PROGRESS",
        sortOrder:    1,
        ownerId:      francimario.id,
        objectiveId:  obj1.id,
        companyId:    company.id,
      },
    })

    const kr12 = await prisma.keyResult.create({
      data: {
        title:        "Fechar 5 novos contratos de servico no Q2",
        progressMode: "ACTION_BASED",
        progress:     kr12_progress,
        status:       "IN_PROGRESS",
        sortOrder:    2,
        ownerId:      alan.id,
        objectiveId:  obj1.id,
        companyId:    company.id,
      },
    })
    await prisma.action.createMany({ data: [
      { title: "Qualificar lead Clinica NovaSaude",            status: "COMPLETED",   sortOrder: 1, ownerId: alan.id,   keyResultId: kr12.id, companyId: company.id, completedAt: new Date("2026-04-08") },
      { title: "Criar proposta para Academia Bella",           status: "IN_PROGRESS", sortOrder: 2, ownerId: alan.id,   keyResultId: kr12.id, companyId: company.id },
      { title: "Apresentacao para rede de franquias Padaria",  status: "NOT_STARTED", sortOrder: 3, ownerId: pedro.id,  keyResultId: kr12.id, companyId: company.id },
      { title: "Prospeccao LinkedIn setor juridico",           status: "NOT_STARTED", sortOrder: 4, ownerId: pedro.id,  keyResultId: kr12.id, companyId: company.id },
      { title: "Enviar proposta para startup EdTech",          status: "NOT_STARTED", sortOrder: 5, ownerId: alan.id,   keyResultId: kr12.id, companyId: company.id },
    ]})

    const kr13 = await prisma.keyResult.create({
      data: {
        title:        "Fazer upsell de Agente de IA em 3 clientes de trafego",
        progressMode: "ACTION_BASED",
        progress:     kr13_progress,
        status:       "IN_PROGRESS",
        sortOrder:    3,
        ownerId:      duda.id,
        objectiveId:  obj1.id,
        companyId:    company.id,
      },
    })
    await prisma.action.createMany({ data: [
      { title: "Demo Agente de IA para Grupo Apex",                status: "COMPLETED",   sortOrder: 1, ownerId: duda.id, keyResultId: kr13.id, companyId: company.id, completedAt: new Date("2026-04-10") },
      { title: "Enviar proposta IA para Imobiliaria Premium",      status: "IN_PROGRESS", sortOrder: 2, ownerId: duda.id, keyResultId: kr13.id, companyId: company.id },
      { title: "Agendar reuniao IA com Construtora Horizonte",     status: "NOT_STARTED", sortOrder: 3, ownerId: duda.id, keyResultId: kr13.id, companyId: company.id },
    ]})

    // ═══════════════════════════════════════════════════════════════════════
    // OBJETIVO 2 — Lucro R$55K
    // ═══════════════════════════════════════════════════════════════════════

    // KR 2.1 — ACTION_BASED: controle de custos
    const kr21_statuses = ["COMPLETED", "IN_PROGRESS", "IN_PROGRESS", "NOT_STARTED"]
    const kr21_progress = calcActionProgress(kr21_statuses) // 50%

    // KR 2.2 — METRIC_BASED: ticket médio R$1.400 → R$1.900
    const kr22_progress = calcMetricProgress(1400, 1417, 1900) // ~3%

    // KR 2.3 — ACTION_BASED: churn zero
    const kr23_statuses = ["COMPLETED", "IN_PROGRESS", "IN_PROGRESS", "NOT_STARTED"]
    const kr23_progress = calcActionProgress(kr23_statuses) // 50%

    const obj2_progress = avgProgress([kr21_progress, kr22_progress, kr23_progress]) // ~34%

    const obj2 = await prisma.objective.create({
      data: {
        title:       "Atingir R$ 55K de lucro no Q2 2026",
        description: "Manter margem acima de 33% enquanto a receita cresce",
        status:      "IN_PROGRESS",
        progress:    obj2_progress,
        sortOrder:   2,
        ownerId:     alan.id,
        cycleId:     cycle.id,
        companyId:   company.id,
      },
    })

    const kr21 = await prisma.keyResult.create({
      data: {
        title:        "Manter lucro mensal acima de R$ 18K em cada mes do Q2",
        progressMode: "ACTION_BASED",
        progress:     kr21_progress,
        status:       "IN_PROGRESS",
        sortOrder:    1,
        ownerId:      alan.id,
        objectiveId:  obj2.id,
        companyId:    company.id,
      },
    })
    await prisma.action.createMany({ data: [
      { title: "Revisar pricing de clientes com margem abaixo de 30%",  status: "COMPLETED",   sortOrder: 1, ownerId: alan.id,   keyResultId: kr21.id, companyId: company.id, completedAt: new Date("2026-04-05") },
      { title: "Apresentar novo modelo de contrato para 3 clientes",    status: "IN_PROGRESS", sortOrder: 2, ownerId: alan.id,   keyResultId: kr21.id, companyId: company.id },
      { title: "Renegociar contrato de ferramentas SaaS",               status: "IN_PROGRESS", sortOrder: 3, ownerId: pedro.id,  keyResultId: kr21.id, companyId: company.id },
      { title: "Otimizar gastos com creditos de anuncio internos",      status: "NOT_STARTED", sortOrder: 4, ownerId: pedro.id,  keyResultId: kr21.id, companyId: company.id },
    ]})

    const kr22 = await prisma.keyResult.create({
      data: {
        title:        "Aumentar ticket medio de R$ 1.400 para R$ 1.900",
        progressMode: "METRIC_BASED",
        startValue:   1400,
        currentValue: 1417,
        targetValue:  1900,
        unit:         "R$",
        progress:     kr22_progress,
        status:       "IN_PROGRESS",
        sortOrder:    2,
        ownerId:      francimario.id,
        objectiveId:  obj2.id,
        companyId:    company.id,
      },
    })

    const kr23 = await prisma.keyResult.create({
      data: {
        title:        "Zerar churn de clientes no Q2",
        progressMode: "ACTION_BASED",
        progress:     kr23_progress,
        status:       "IN_PROGRESS",
        sortOrder:    3,
        ownerId:      duda.id,
        objectiveId:  obj2.id,
        companyId:    company.id,
      },
    })
    await prisma.action.createMany({ data: [
      { title: "Atribuir CS dedicado para os 5 maiores clientes",   status: "COMPLETED",   sortOrder: 1, ownerId: duda.id,  keyResultId: kr23.id, companyId: company.id, completedAt: new Date("2026-04-08") },
      { title: "Implementar NPS mensal para todos os clientes",     status: "IN_PROGRESS", sortOrder: 2, ownerId: duda.id,  keyResultId: kr23.id, companyId: company.id },
      { title: "Criar processo de QBR (Quarterly Business Review)", status: "IN_PROGRESS", sortOrder: 3, ownerId: duda.id,  keyResultId: kr23.id, companyId: company.id },
      { title: "Montar dashboard de resultados por cliente",        status: "NOT_STARTED", sortOrder: 4, ownerId: pedro.id, keyResultId: kr23.id, companyId: company.id },
    ]})

    // ═══════════════════════════════════════════════════════════════════════
    // OBJETIVO 3 — Qualidade de entrega
    // ═══════════════════════════════════════════════════════════════════════

    // KR 3.1 — ACTION_BASED: SLA 24h
    const kr31_statuses = ["COMPLETED", "COMPLETED", "IN_PROGRESS", "NOT_STARTED"]
    const kr31_progress = calcActionProgress(kr31_statuses) // 62.5%

    // KR 3.2 — ACTION_BASED: 2 novos agentes de IA
    const kr32_statuses = ["COMPLETED", "IN_PROGRESS", "NOT_STARTED", "IN_PROGRESS", "NOT_STARTED"]
    const kr32_progress = calcActionProgress(kr32_statuses) // 40%

    // KR 3.3 — METRIC_BASED: NPS 7.5 → 8.5
    const kr33_progress = calcMetricProgress(7.5, 7.8, 8.5) // 30%

    const obj3_progress = avgProgress([kr31_progress, kr32_progress, kr33_progress]) // ~44%

    const obj3 = await prisma.objective.create({
      data: {
        title:       "Elevar a qualidade de entrega para os clientes",
        description: "Melhorar NPS, SLA de atendimento e lancamento de produtos de IA proprios",
        status:      "IN_PROGRESS",
        progress:    obj3_progress,
        sortOrder:   3,
        ownerId:     duda.id,
        cycleId:     cycle.id,
        companyId:   company.id,
      },
    })

    const kr31 = await prisma.keyResult.create({
      data: {
        title:        "Reduzir SLA de resolucao de problemas para 24h",
        progressMode: "ACTION_BASED",
        progress:     kr31_progress,
        status:       "IN_PROGRESS",
        sortOrder:    1,
        ownerId:      duda.id,
        objectiveId:  obj3.id,
        companyId:    company.id,
      },
    })
    await prisma.action.createMany({ data: [
      { title: "Criar canal de suporte no WhatsApp Business",    status: "COMPLETED",   sortOrder: 1, ownerId: duda.id,  keyResultId: kr31.id, companyId: company.id, completedAt: new Date("2026-04-03") },
      { title: "Implementar template de relatorio mensal",       status: "COMPLETED",   sortOrder: 2, ownerId: pedro.id, keyResultId: kr31.id, companyId: company.id, completedAt: new Date("2026-04-06") },
      { title: "Definir processo de escalonamento de tickets",   status: "IN_PROGRESS", sortOrder: 3, ownerId: duda.id,  keyResultId: kr31.id, companyId: company.id },
      { title: "Treinar equipe em gestao de crises",             status: "NOT_STARTED", sortOrder: 4, ownerId: duda.id,  keyResultId: kr31.id, companyId: company.id },
    ]})

    const kr32 = await prisma.keyResult.create({
      data: {
        title:        "Lancar 2 novos Agentes de IA proprios",
        progressMode: "ACTION_BASED",
        progress:     kr32_progress,
        status:       "IN_PROGRESS",
        sortOrder:    2,
        ownerId:      alan.id,
        objectiveId:  obj3.id,
        companyId:    company.id,
      },
    })
    await prisma.action.createMany({ data: [
      { title: "Documentar spec do Agente de Atendimento",              status: "COMPLETED",   sortOrder: 1, ownerId: alan.id,  keyResultId: kr32.id, companyId: company.id, completedAt: new Date("2026-04-05") },
      { title: "Desenvolver MVP do Agente de Atendimento",              status: "IN_PROGRESS", sortOrder: 2, ownerId: alan.id,  keyResultId: kr32.id, companyId: company.id },
      { title: "Testar Agente de Atendimento com 2 clientes piloto",    status: "NOT_STARTED", sortOrder: 3, ownerId: alan.id,  keyResultId: kr32.id, companyId: company.id },
      { title: "Documentar spec do Agente de SDR",                      status: "IN_PROGRESS", sortOrder: 4, ownerId: alan.id,  keyResultId: kr32.id, companyId: company.id },
      { title: "Desenvolver MVP do Agente de SDR",                      status: "NOT_STARTED", sortOrder: 5, ownerId: pedro.id, keyResultId: kr32.id, companyId: company.id },
    ]})

    const kr33 = await prisma.keyResult.create({
      data: {
        title:        "Atingir NPS medio de 8.5 com os clientes",
        progressMode: "METRIC_BASED",
        startValue:   7.5,
        currentValue: 7.8,
        targetValue:  8.5,
        unit:         "pontos",
        progress:     kr33_progress,
        status:       "IN_PROGRESS",
        sortOrder:    3,
        ownerId:      duda.id,
        objectiveId:  obj3.id,
        companyId:    company.id,
      },
    })

    // ── 8. RESUMO FINAL ───────────────────────────────────────────────────
    const bar = "=".repeat(52)
    console.log("")
    console.log(bar)
    console.log("  SEED COMPLETO — Funil Faixa Preta")
    console.log(bar)
    console.log("")
    console.log("  ACESSO AO SISTEMA:")
    console.log("  Empresa:      ffp")
    console.log("  Admin:        admin@ffp.com       / 123456")
    console.log("  Francimario:  francimario@ffp.com / 123456")
    console.log("  Duda:         duda@ffp.com        / 123456")
    console.log("  Alan:         alan@ffp.com        / 123456")
    console.log("  Pedro:        pedro@ffp.com       / 123456")
    console.log("")
    console.log("  DADOS CRIADOS:")
    console.log("  Clientes ativos: 35  |  MRR atual: R$ 49.600")
    console.log("  Transacoes: Jan-Mar 2026")
    console.log("    Jan  fat R$39K  custo R$29K  lucro R$10K")
    console.log("    Fev  fat R$43K  custo R$30K  lucro R$13K")
    console.log("    Mar  fat R$53K  custo R$30K  lucro R$23K")
    console.log("")
    console.log("  OKRs — Ciclo Q2 2026 (01/04 a 30/06):")
    console.log("  Obj 1 — Faturamento R$165K ........ " + Math.round(obj1_progress * 100) + "%")
    console.log("  Obj 2 — Lucro R$55K ............... " + Math.round(obj2_progress * 100) + "%")
    console.log("  Obj 3 — Qualidade de entrega ....... " + Math.round(obj3_progress * 100) + "%")
    console.log("")
    console.log(bar)

  } catch (err) {
    console.error("ERRO no seed:", err.message || err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
