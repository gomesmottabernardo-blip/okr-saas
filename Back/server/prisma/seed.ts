import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

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

  console.log("👤 Usuários criados:", bernardo.email, "|", igor.email);

  // ── Clientes simulados ───────────────────────────────────────────────────────

  const services = ["Gestão de Tráfego", "IA", "Consultoria", "Gestão de Tráfego", "IA"];
  const clientData = Array.from({ length: 40 }, (_, i) => ({
    name: `Cliente ${i + 1}`,
    service: services[i % services.length],
    monthlyValue: 1500 + (i % 5) * 500,
    startDate: new Date(2025, i % 12, 1),
    active: i < 36,
    companyId: company.id,
  }));

  await prisma.client.createMany({ data: clientData });
  console.log("👥 Clientes criados: 40");

  // ── Transações financeiras (últimos 6 meses) ─────────────────────────────────

  const transactions = [];
  for (let m = 5; m >= 0; m--) {
    const date = new Date(2026, 3 - m, 15);
    transactions.push(
      {
        description: `MRR — Mês ${date.toLocaleString("pt-BR", { month: "short", year: "numeric" })}`,
        type: "REVENUE",
        amount: 72000 + m * 8000,
        date,
        companyId: company.id,
      },
      {
        description: "Salários e Operacional",
        type: "EXPENSE",
        amount: 28000 + m * 1000,
        date: new Date(date.getFullYear(), date.getMonth(), 5),
        companyId: company.id,
      },
    );
  }
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
  console.log("📅 Ciclo criado:", cycle.label);

  // ── Objectives, Key Results e Actions ─────────────────────────────────────────

  // OBJ 1: Crescimento de Receita
  const obj1 = await prisma.objective.create({
    data: {
      title: "Crescimento de Receita",
      description: "Atingir R$182k de MRR até o fim do Q2",
      cycleId: cycle.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 1,
    },
  });

  const kr1 = await prisma.keyResult.create({
    data: {
      title: "Faturar R$182k no trimestre",
      progressMode: "METRIC_BASED",
      startValue: 72000,
      currentValue: 96000,
      targetValue: 182000,
      unit: "R$",
      objectiveId: obj1.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 1,
    },
  });

  const kr2 = await prisma.keyResult.create({
    data: {
      title: "Manter ticket médio acima de R$2.000",
      progressMode: "METRIC_BASED",
      startValue: 1800,
      currentValue: 2100,
      targetValue: 2000,
      unit: "R$",
      objectiveId: obj1.id,
      companyId: company.id,
      sortOrder: 2,
    },
  });

  await prisma.action.createMany({
    data: [
      { title: "Prospectar 20 novos clientes", keyResultId: kr1.id, companyId: company.id, ownerId: igor.id, status: "IN_PROGRESS", dueDate: new Date("2026-05-15") },
      { title: "Campanha de reativação de inativos", keyResultId: kr1.id, companyId: company.id, status: "NOT_STARTED", dueDate: new Date("2026-05-30") },
      { title: "Revisão de precificação", keyResultId: kr2.id, companyId: company.id, ownerId: igor.id, status: "COMPLETED", completedAt: new Date("2026-04-10") },
    ],
  });

  // OBJ 2: Escalar Time e Operações
  const obj2 = await prisma.objective.create({
    data: {
      title: "Escalar Time e Operações",
      description: "Contratar especialistas e reduzir churn",
      cycleId: cycle.id,
      companyId: company.id,
      sortOrder: 2,
    },
  });

  const kr3 = await prisma.keyResult.create({
    data: {
      title: "Contratar 2 especialistas de tráfego",
      progressMode: "ACTION_BASED",
      targetValue: 2,
      currentValue: 0,
      startValue: 0,
      objectiveId: obj2.id,
      companyId: company.id,
      ownerId: igor.id,
      sortOrder: 1,
    },
  });

  const kr4 = await prisma.keyResult.create({
    data: {
      title: "Reduzir churn para menos de 5%",
      progressMode: "METRIC_BASED",
      startValue: 12,
      currentValue: 8,
      targetValue: 5,
      unit: "%",
      objectiveId: obj2.id,
      companyId: company.id,
      sortOrder: 2,
    },
  });

  await prisma.action.createMany({
    data: [
      { title: "Abrir vagas no LinkedIn", keyResultId: kr3.id, companyId: company.id, status: "COMPLETED", completedAt: new Date("2026-04-05") },
      { title: "Entrevistar candidatos", keyResultId: kr3.id, companyId: company.id, ownerId: igor.id, status: "IN_PROGRESS", dueDate: new Date("2026-05-01") },
      { title: "Onboarding dos novos contratados", keyResultId: kr3.id, companyId: company.id, status: "NOT_STARTED", dueDate: new Date("2026-06-01") },
      { title: "Criar ritual de check-in mensal com clientes", keyResultId: kr4.id, companyId: company.id, status: "IN_PROGRESS", dueDate: new Date("2026-04-30") },
      { title: "Mapear clientes com risco de cancelamento", keyResultId: kr4.id, companyId: company.id, status: "AT_RISK", dueDate: new Date("2026-04-20") },
    ],
  });

  // OBJ 3: Fortalecer Presença Digital
  const obj3 = await prisma.objective.create({
    data: {
      title: "Fortalecer Presença Digital",
      description: "Crescer alcance e autoridade da marca FFP",
      cycleId: cycle.id,
      companyId: company.id,
      sortOrder: 3,
    },
  });

  const kr5 = await prisma.keyResult.create({
    data: {
      title: "Alcançar 10k seguidores no Instagram",
      progressMode: "METRIC_BASED",
      startValue: 6500,
      currentValue: 7800,
      targetValue: 10000,
      unit: "seguidores",
      objectiveId: obj3.id,
      companyId: company.id,
      sortOrder: 1,
    },
  });

  const kr6 = await prisma.keyResult.create({
    data: {
      title: "Publicar 24 cases de sucesso no trimestre",
      progressMode: "ACTION_BASED",
      targetValue: 24,
      currentValue: 0,
      startValue: 0,
      objectiveId: obj3.id,
      companyId: company.id,
      sortOrder: 2,
    },
  });

  await prisma.action.createMany({
    data: [
      { title: "Contratar social media freelancer", keyResultId: kr5.id, companyId: company.id, status: "COMPLETED", completedAt: new Date("2026-04-03") },
      { title: "Calendário de conteúdo Q2", keyResultId: kr5.id, companyId: company.id, status: "IN_PROGRESS", dueDate: new Date("2026-04-25") },
      { title: "Coletar depoimentos de 10 clientes", keyResultId: kr6.id, companyId: company.id, status: "IN_PROGRESS", dueDate: new Date("2026-05-10") },
      { title: "Produzir 6 vídeos de case", keyResultId: kr6.id, companyId: company.id, status: "NOT_STARTED", dueDate: new Date("2026-05-31") },
      { title: "Agendar publicações", keyResultId: kr6.id, companyId: company.id, status: "NOT_STARTED", dueDate: new Date("2026-06-15") },
    ],
  });

  console.log("🎯 OKRs criados: 3 objectives, 6 key results, 13 actions");
  console.log("✅ Seed finalizado com sucesso!");
  console.log("");
  console.log("   Login: gomesmotta.bernardo@gmail.com / 123456  (SUPER ADMIN)");
  console.log("   Login: igor@funilfaixapreta.com / 123456       (ADMIN)");
  console.log("   Slug:  ffp");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
