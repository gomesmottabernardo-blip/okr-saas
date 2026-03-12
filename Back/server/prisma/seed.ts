import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {

  console.log("🌱 Iniciando seed...");

  // ==============================
  // EMPRESA
  // ==============================

  const company = await prisma.company.create({
    data: {
      name: "Funil Faixa Preta",
      slug: "ffp",
    },
  });

  console.log("🏢 Empresa criada:", company.name);

  // ==============================
  // USUÁRIO ADMIN
  // ==============================

  const hashedPassword = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@ffp.com",
      password: hashedPassword,
      role: "admin",
      companyId: company.id,
    },
  });

  console.log("👤 Usuário admin criado:", admin.email);

  // ==============================
  // CLIENTES SIMULADOS
  // ==============================

  const clients = [];

  for (let i = 1; i <= 40; i++) {

    const client = await prisma.client.create({
      data: {
        name: `Cliente ${i}`,
        service: i % 2 === 0 ? "Gestão de Tráfego" : "IA",
        monthlyValue: 2000,
        startDate: new Date(),
        active: true,
        companyId: company.id,
      },
    });

    clients.push(client);

  }

  console.log("👥 Clientes criados:", clients.length);

  // ==============================
  // OKR FINANCEIRO
  // ==============================

  const okrFinance = await prisma.oKR.create({
    data: {
      title: "Crescimento Financeiro",
      description: "Atingir metas financeiras do trimestre",
      companyId: company.id,
    },
  });

  console.log("🎯 OKR criado:", okrFinance.title);

  await prisma.keyResult.createMany({
    data: [
      {
        title: "Faturamento 182k",
        target: 182000,
        current: 54000,
        okrId: okrFinance.id,
      },
      {
        title: "Custos abaixo de 102k",
        target: 102000,
        current: 32000,
        okrId: okrFinance.id,
      },
      {
        title: "Lucro 80k",
        target: 80000,
        current: 20000,
        okrId: okrFinance.id,
      },
    ],
  });

  console.log("📊 Key Results criados");

  console.log("✅ Seed finalizado com sucesso");

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });