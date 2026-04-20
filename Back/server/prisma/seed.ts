import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed com dados reais da Funil Faixa Preta...");

  // Limpa dados existentes (ordem inversa das dependências)
  await prisma.action.deleteMany();
  await prisma.keyResult.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.inviteToken.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // ── Empresa ──────────────────────────────────────────────────────────────────

  const company = await prisma.company.create({
    data: {
      name: "Funil Faixa Preta",
      slug: "ffp",
      domain: "funilfaixapreta.com",
      primaryColor: "#111111",
      maxUsers: 20,
    },
  });
  console.log("🏢 Empresa criada:", company.name);

  // ── Usuários ─────────────────────────────────────────────────────────────────

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const bernardo = await prisma.user.create({
    data: {
      name: "Bernardo Gomes Motta",
      email: "gomesmotta.bernardo@gmail.com",
      password: await hash("123456"),
      role: "SUPER_ADMIN",
      companyId: company.id,
    },
  });

  const igor = await prisma.user.create({
    data: {
      name: "Igor",
      email: "igor@funilfaixapreta.com",
      password: await hash("123456"),
      role: "ADMIN",
      companyId: company.id,
    },
  });

  const duda = await prisma.user.create({
    data: {
      name: "Duda",
      email: "duda@funilfaixapreta.com",
      password: await hash("123456"),
      role: "MEMBER",
      companyId: company.id,
    },
  });

  const francimario = await prisma.user.create({
    data: {
      name: "Francimário",
      email: "francimario@funilfaixapreta.com",
      password: await hash("123456"),
      role: "MEMBER",
      companyId: company.id,
    },
  });

  const alan = await prisma.user.create({
    data: {
      name: "Alan",
      email: "alan@funilfaixapreta.com",
      password: await hash("123456"),
      role: "MEMBER",
      companyId: company.id,
    },
  });

  const pedro = await prisma.user.create({
    data: {
      name: "Pedro",
      email: "pedro@funilfaixapreta.com",
      password: await hash("123456"),
      role: "MEMBER",
      companyId: company.id,
    },
  });

  console.log("👤 Usuários criados: Bernardo | Igor | Duda | Francimário | Alan | Pedro");

  // ── Clientes reais da FFP (Notion) ───────────────────────────────────────────

  await prisma.client.createMany({
    data: [
      // Baby Gym — Franqueadora + 17 franquias
      { name: "Baby Gym Franqueadora",       service: "Gestão de Tráfego", monthlyValue: 4000, startDate: new Date("2024-01-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Goiânia",            service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2024-03-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Santa Maria",        service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2024-03-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Vitória",            service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2024-04-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Imperatriz",         service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2024-04-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Ubá",                service: "Gestão de Tráfego", monthlyValue: 1200, startDate: new Date("2024-05-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Cuiabá",             service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2024-06-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Divinópolis",        service: "Gestão de Tráfego", monthlyValue: 1200, startDate: new Date("2024-06-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Jardins",            service: "Gestão de Tráfego", monthlyValue: 1800, startDate: new Date("2024-07-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Morumbi",            service: "Gestão de Tráfego", monthlyValue: 1800, startDate: new Date("2024-07-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Brooklin",           service: "Gestão de Tráfego", monthlyValue: 1800, startDate: new Date("2024-08-01"), active: true,  companyId: company.id },
      { name: "Baby Gym BH",                 service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2024-08-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Aracaju",            service: "Gestão de Tráfego", monthlyValue: 1200, startDate: new Date("2024-09-01"), active: true,  companyId: company.id },
      { name: "Baby Gym POA",                service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2024-09-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Rio Verde",          service: "Gestão de Tráfego", monthlyValue: 1200, startDate: new Date("2024-10-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Sinop",              service: "Gestão de Tráfego", monthlyValue: 1200, startDate: new Date("2024-10-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Nilo",               service: "Gestão de Tráfego", monthlyValue: 1200, startDate: new Date("2024-11-01"), active: true,  companyId: company.id },
      { name: "Baby Gym Alphaville",         service: "Gestão de Tráfego", monthlyValue: 1800, startDate: new Date("2024-11-01"), active: true,  companyId: company.id },
      // Outros clientes
      { name: "Orthopride",                  service: "Gestão de Tráfego", monthlyValue: 3500, startDate: new Date("2024-02-01"), active: true,  companyId: company.id },
      { name: "Jaby",                        service: "Gestão de Tráfego", monthlyValue: 2500, startDate: new Date("2024-05-01"), active: true,  companyId: company.id },
      { name: "Caza",                        service: "Gestão de Tráfego", monthlyValue: 2000, startDate: new Date("2024-06-01"), active: true,  companyId: company.id },
      { name: "Sergue",                      service: "IA",                monthlyValue: 1800, startDate: new Date("2025-10-01"), active: true,  companyId: company.id },
      { name: "Aldeia",                      service: "IA",                monthlyValue: 1500, startDate: new Date("2025-11-01"), active: true,  companyId: company.id },
      { name: "DDP",                         service: "Gestão de Tráfego", monthlyValue: 2000, startDate: new Date("2024-07-01"), active: true,  companyId: company.id },
      { name: "Atchim",                      service: "IA",                monthlyValue: 1700, startDate: new Date("2026-04-01"), active: true,  companyId: company.id },
      { name: "Rio ET",                      service: "Consultoria",       monthlyValue: 2500, startDate: new Date("2024-09-01"), active: true,  companyId: company.id },
      { name: "Samsonite",                   service: "Gestão de Tráfego", monthlyValue: 3000, startDate: new Date("2024-03-01"), active: true,  companyId: company.id },
      { name: "Sensus Spa",                  service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2024-08-01"), active: true,  companyId: company.id },
      { name: "Lavoro Seguros",              service: "Consultoria",       monthlyValue: 2000, startDate: new Date("2025-01-01"), active: true,  companyId: company.id },
      { name: "SB Seguros",                  service: "Consultoria",       monthlyValue: 1800, startDate: new Date("2025-02-01"), active: true,  companyId: company.id },
      { name: "Kempinski",                   service: "Gestão de Tráfego", monthlyValue: 3000, startDate: new Date("2024-10-01"), active: true,  companyId: company.id },
      { name: "Revivere",                    service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2025-03-01"), active: true,  companyId: company.id },
      { name: "SANDUPARK",                   service: "Gestão de Tráfego", monthlyValue: 2000, startDate: new Date("2025-04-01"), active: true,  companyId: company.id },
      { name: "ZAYYA",                       service: "IA",                monthlyValue: 1800, startDate: new Date("2025-09-01"), active: true,  companyId: company.id },
      { name: "Elister",                     service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2025-05-01"), active: true,  companyId: company.id },
      { name: "Traktion",                    service: "IA",                monthlyValue: 2000, startDate: new Date("2025-08-01"), active: true,  companyId: company.id },
      { name: "Inter Academy Brasília",      service: "Gestão de Tráfego", monthlyValue: 2000, startDate: new Date("2025-06-01"), active: true,  companyId: company.id },
      { name: "Malafaia Natação",            service: "Gestão de Tráfego", monthlyValue: 1500, startDate: new Date("2025-07-01"), active: true,  companyId: company.id },
      { name: "Gustavo Asmar",               service: "Consultoria",       monthlyValue: 2000, startDate: new Date("2025-10-01"), active: true,  companyId: company.id },
    ],
  });
  console.log("👥 Clientes reais criados: 39");

  // ── Transações financeiras (histórico + Q2 2026) ─────────────────────────────
  // Dados reais Q2: Abr Fat R$51K / Custo R$33K | Mai R$55K / R$34K | Jun R$55K / R$36K

  const financialData = [
    // Histórico pré-Q2 (crescimento gradual)
    { month: new Date("2025-11-15"), revenue: 37000, expense: 26000 },
    { month: new Date("2025-12-15"), revenue: 39000, expense: 27000 },
    { month: new Date("2026-01-15"), revenue: 41000, expense: 28000 },
    { month: new Date("2026-02-15"), revenue: 44000, expense: 30000 },
    { month: new Date("2026-03-15"), revenue: 47000, expense: 31000 },
    // Q2 2026 — metas reais do Notion
    { month: new Date("2026-04-15"), revenue: 51000, expense: 33000 },
  ];

  const transactions = financialData.flatMap(({ month, revenue, expense }) => [
    {
      description: `Faturamento — ${month.toLocaleString("pt-BR", { month: "long", year: "numeric" })}`,
      type: "REVENUE",
      amount: revenue,
      date: month,
      companyId: company.id,
    },
    {
      description: "Custos Operacionais",
      type: "EXPENSE",
      amount: expense,
      date: new Date(month.getFullYear(), month.getMonth(), 5),
      companyId: company.id,
    },
  ]);

  await prisma.financialTransaction.createMany({ data: transactions });
  console.log("💰 Transações financeiras criadas:", transactions.length);

  // ── Ciclo Q2 2026 (ATIVO) ─────────────────────────────────────────────────────

  const cycle = await prisma.cycle.create({
    data: {
      label: "Q2 2026",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-06-30"),
      status: "ACTIVE",
      companyId: company.id,
    },
  });
  console.log("📅 Ciclo criado:", cycle.label, "| Meta do Tri: Lucro R$55K");

  // ── OBJ 1: Faturamento R$165K no Q2 ──────────────────────────────────────────
  // Squad: Funil de Vendas (Igor)

  const obj1 = await prisma.objective.create({
    data: {
      title: "Faturar R$165K no Q2 2026",
      description: "OKR Financeiro — Meta trimestral de faturamento total. Squad: Funil de Vendas.",
      cycleId: cycle.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 1,
    },
  });

  const kr1_1 = await prisma.keyResult.create({
    data: {
      title: "Faturamento Abril ≥ R$51K",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 47000,
      targetValue: 51000,
      unit: "R$",
      objectiveId: obj1.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 1,
    },
  });

  const kr1_2 = await prisma.keyResult.create({
    data: {
      title: "Faturamento Maio ≥ R$55K",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 0,
      targetValue: 55000,
      unit: "R$",
      objectiveId: obj1.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 2,
    },
  });

  const kr1_3 = await prisma.keyResult.create({
    data: {
      title: "Faturamento Junho ≥ R$55K",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 0,
      targetValue: 55000,
      unit: "R$",
      objectiveId: obj1.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 3,
    },
  });

  await prisma.action.createMany({
    data: [
      { title: "Fechar 3 novos contratos até 30/04", keyResultId: kr1_1.id, companyId: company.id, ownerId: francimario.id, status: "IN_PROGRESS", dueDate: new Date("2026-04-30") },
      { title: "Reativar 2 clientes inativos", keyResultId: kr1_1.id, companyId: company.id, ownerId: pedro.id, status: "IN_PROGRESS", dueDate: new Date("2026-04-28") },
      { title: "Lançar campanha de upsell para base Baby Gym", keyResultId: kr1_2.id, companyId: company.id, ownerId: igor.id, status: "NOT_STARTED", dueDate: new Date("2026-05-10") },
      { title: "Prospectar 10 novas franquias Baby Gym", keyResultId: kr1_3.id, companyId: company.id, ownerId: francimario.id, status: "NOT_STARTED", dueDate: new Date("2026-06-15") },
    ],
  });

  // ── OBJ 2: MRR — Escalar para R$56K até Junho ────────────────────────────────
  // Squad: Captação de Clientes (Alan/Francimário)

  const obj2 = await prisma.objective.create({
    data: {
      title: "Escalar MRR para R$56K até Junho",
      description: "Crescimento de receita recorrente mensal. Squads: Captação de Clientes e Eficiência SDR.",
      cycleId: cycle.id,
      companyId: company.id,
      ownerId: alan.id,
      sortOrder: 2,
    },
  });

  const kr2_1 = await prisma.keyResult.create({
    data: {
      title: "MRR Abril ≥ R$47K",
      progressMode: "METRIC_BASED",
      startValue: 44000,
      currentValue: 46000,
      targetValue: 47000,
      unit: "R$",
      objectiveId: obj2.id,
      companyId: company.id,
      ownerId: alan.id,
      sortOrder: 1,
    },
  });

  const kr2_2 = await prisma.keyResult.create({
    data: {
      title: "MRR Maio ≥ R$51K",
      progressMode: "METRIC_BASED",
      startValue: 47000,
      currentValue: 0,
      targetValue: 51000,
      unit: "R$",
      objectiveId: obj2.id,
      companyId: company.id,
      ownerId: alan.id,
      sortOrder: 2,
    },
  });

  const kr2_3 = await prisma.keyResult.create({
    data: {
      title: "MRR Junho ≥ R$56K",
      progressMode: "METRIC_BASED",
      startValue: 51000,
      currentValue: 0,
      targetValue: 56000,
      unit: "R$",
      objectiveId: obj2.id,
      companyId: company.id,
      ownerId: alan.id,
      sortOrder: 3,
    },
  });

  await prisma.action.createMany({
    data: [
      { title: "Estruturar cadência de prospecção semanal", keyResultId: kr2_1.id, companyId: company.id, ownerId: francimario.id, status: "IN_PROGRESS", dueDate: new Date("2026-04-25") },
      { title: "Revisão de contratos com reajuste de preço", keyResultId: kr2_1.id, companyId: company.id, ownerId: igor.id, status: "COMPLETED", completedAt: new Date("2026-04-10") },
      { title: "Ativar pipeline SDR para Maio", keyResultId: kr2_2.id, companyId: company.id, ownerId: francimario.id, status: "NOT_STARTED", dueDate: new Date("2026-04-30") },
      { title: "Fechar 5 novos clientes Tráfego em Maio/Junho", keyResultId: kr2_3.id, companyId: company.id, ownerId: alan.id, status: "NOT_STARTED", dueDate: new Date("2026-06-20") },
    ],
  });

  // ── OBJ 3: Vertical de IA — R$10K MRR até Maio ───────────────────────────────
  // Squad: Melhorias Funil Aplicação (Duda)

  const obj3 = await prisma.objective.create({
    data: {
      title: "Escalar Vertical de IA para R$10K/mês",
      description: "Lançar e escalar produto de IA para clientes FFP. Squad: Melhorias Funil Aplicação.",
      cycleId: cycle.id,
      companyId: company.id,
      ownerId: duda.id,
      sortOrder: 3,
    },
  });

  const kr3_1 = await prisma.keyResult.create({
    data: {
      title: "IA Abril — R$5K com 3 clientes ativos",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 3500,
      targetValue: 5000,
      unit: "R$",
      objectiveId: obj3.id,
      companyId: company.id,
      ownerId: duda.id,
      sortOrder: 1,
    },
  });

  const kr3_2 = await prisma.keyResult.create({
    data: {
      title: "IA Maio — R$10K (dobrar base)",
      progressMode: "METRIC_BASED",
      startValue: 5000,
      currentValue: 0,
      targetValue: 10000,
      unit: "R$",
      objectiveId: obj3.id,
      companyId: company.id,
      ownerId: duda.id,
      sortOrder: 2,
    },
  });

  const kr3_3 = await prisma.keyResult.create({
    data: {
      title: "IA Junho — manter R$10K",
      progressMode: "METRIC_BASED",
      startValue: 10000,
      currentValue: 0,
      targetValue: 10000,
      unit: "R$",
      objectiveId: obj3.id,
      companyId: company.id,
      ownerId: duda.id,
      sortOrder: 3,
    },
  });

  await prisma.action.createMany({
    data: [
      { title: "Onboarding Atchim no produto IA", keyResultId: kr3_1.id, companyId: company.id, ownerId: duda.id, status: "IN_PROGRESS", dueDate: new Date("2026-04-25") },
      { title: "Criar case de sucesso Sergue + Aldeia", keyResultId: kr3_1.id, companyId: company.id, ownerId: duda.id, status: "IN_PROGRESS", dueDate: new Date("2026-04-30") },
      { title: "Lançar oferta IA para 10 clientes tráfego", keyResultId: kr3_2.id, companyId: company.id, ownerId: duda.id, status: "NOT_STARTED", dueDate: new Date("2026-05-05") },
      { title: "Produzir demo IA para pitch de novos clientes", keyResultId: kr3_2.id, companyId: company.id, ownerId: duda.id, status: "NOT_STARTED", dueDate: new Date("2026-05-10") },
      { title: "Revisão mensal de resultados IA com clientes", keyResultId: kr3_3.id, companyId: company.id, ownerId: pedro.id, status: "NOT_STARTED", dueDate: new Date("2026-06-05") },
    ],
  });

  // ── OBJ 4: Custos — Manter em R$110K no Q2 ───────────────────────────────────
  // Squad: Eficiência SDR + Funil de Vendas

  const obj4 = await prisma.objective.create({
    data: {
      title: "Controlar Custos Totais em R$110K no Q2",
      description: "OKR de Custos — Manter eficiência operacional no trimestre.",
      cycleId: cycle.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 4,
    },
  });

  const kr4_1 = await prisma.keyResult.create({
    data: {
      title: "Custo Abril ≤ R$33K",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 31000,
      targetValue: 33000,
      unit: "R$",
      objectiveId: obj4.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 1,
    },
  });

  const kr4_2 = await prisma.keyResult.create({
    data: {
      title: "Custo Maio ≤ R$34K",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 0,
      targetValue: 34000,
      unit: "R$",
      objectiveId: obj4.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 2,
    },
  });

  const kr4_3 = await prisma.keyResult.create({
    data: {
      title: "Custo Junho ≤ R$36K",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 0,
      targetValue: 36000,
      unit: "R$",
      objectiveId: obj4.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 3,
    },
  });

  await prisma.action.createMany({
    data: [
      { title: "Auditar gastos com ferramentas e cancelar não utilizadas", keyResultId: kr4_1.id, companyId: company.id, ownerId: igor.id, status: "COMPLETED", completedAt: new Date("2026-04-08") },
      { title: "Negociar contratos de fornecedores para Maio", keyResultId: kr4_2.id, companyId: company.id, ownerId: igor.id, status: "NOT_STARTED", dueDate: new Date("2026-04-28") },
      { title: "Revisar comissões e estrutura de custos variáveis", keyResultId: kr4_3.id, companyId: company.id, ownerId: igor.id, status: "NOT_STARTED", dueDate: new Date("2026-05-30") },
    ],
  });

  // ── OBJ 5: Lucro — Meta R$55K no Q2 ─────────────────────────────────────────
  // Meta do Tri: Lucro R$55K

  const obj5 = await prisma.objective.create({
    data: {
      title: "Gerar Lucro de R$55K no Q2 2026",
      description: "Meta do Trimestre — Lucro líquido. Abr R$16K | Mai R$18K | Jun R$20K = R$54K.",
      cycleId: cycle.id,
      companyId: company.id,
      ownerId: bernardo.id,
      sortOrder: 5,
    },
  });

  const kr5_1 = await prisma.keyResult.create({
    data: {
      title: "Lucro Abril ≥ R$16K",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 14000,
      targetValue: 16000,
      unit: "R$",
      objectiveId: obj5.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 1,
    },
  });

  const kr5_2 = await prisma.keyResult.create({
    data: {
      title: "Lucro Maio ≥ R$18K",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 0,
      targetValue: 18000,
      unit: "R$",
      objectiveId: obj5.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 2,
    },
  });

  const kr5_3 = await prisma.keyResult.create({
    data: {
      title: "Lucro Junho ≥ R$20K",
      progressMode: "METRIC_BASED",
      startValue: 0,
      currentValue: 0,
      targetValue: 20000,
      unit: "R$",
      objectiveId: obj5.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 3,
    },
  });

  await prisma.action.createMany({
    data: [
      { title: "Fechar DRE de Abril até dia 05/05", keyResultId: kr5_1.id, companyId: company.id, ownerId: igor.id, status: "NOT_STARTED", dueDate: new Date("2026-05-05") },
      { title: "Apresentar resultado Abril para sócios", keyResultId: kr5_1.id, companyId: company.id, ownerId: bernardo.id, status: "NOT_STARTED", dueDate: new Date("2026-05-07") },
      { title: "Weekly financeiro toda segunda-feira", keyResultId: kr5_2.id, companyId: company.id, ownerId: igor.id, status: "IN_PROGRESS", dueDate: new Date("2026-05-30") },
      { title: "Projeção de caixa Junho com base em Maio real", keyResultId: kr5_3.id, companyId: company.id, ownerId: igor.id, status: "NOT_STARTED", dueDate: new Date("2026-06-01") },
    ],
  });

  console.log("🎯 OKRs criados: 5 objectives, 15 key results, 20 actions");
  console.log("✅ Seed finalizado com sucesso!");
  console.log("");
  console.log("   Login SUPER ADMIN : gomesmotta.bernardo@gmail.com / 123456");
  console.log("   Login ADMIN       : igor@funilfaixapreta.com / 123456");
  console.log("   Login MEMBER      : duda | francimario | alan | pedro @funilfaixapreta.com / 123456");
  console.log("   Slug              : ffp");
  console.log("");
  console.log("   🏆 Meta do Tri    : Lucro R$55K");
  console.log("   📈 Fat Q2         : R$165K  (Abr R$51K | Mai R$55K | Jun R$55K)");
  console.log("   💸 Custo Q2       : R$110K  (Abr R$33K | Mai R$34K | Jun R$36K)");
  console.log("   🔁 MRR Jun        : R$56K");
  console.log("   🤖 IA Mai         : R$10K");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
