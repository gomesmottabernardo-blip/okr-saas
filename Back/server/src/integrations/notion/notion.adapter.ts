import { Client } from "@notionhq/client"
import { prisma } from "../../lib/prisma"
import { ActionStatus } from "@prisma/client"

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DATABASE_ID = process.env.NOTION_DATABASE_ID!

const STATUS_MAP: Record<string, ActionStatus> = {
  "A fazer": "NOT_STARTED",
  "Em andamento": "IN_PROGRESS",
  "Em revisão": "IN_PROGRESS",
  "Aguardando Aprovação": "IN_PROGRESS",
  "Aguardando Igor": "IN_PROGRESS",
  "Aguardando postagem": "IN_PROGRESS",
  "Concluída": "COMPLETED",
  "Enviado para Cliente": "COMPLETED",
  "Pausado": "COMPLETED",
}

function getTitle(prop: any): string | null {
  if (!prop || prop.type !== "title") return null
  return prop.title?.map((t: any) => t.plain_text).join("").trim() || null
}

function getSelect(prop: any): string | null {
  if (!prop || prop.type !== "status") {
    // Also handle "select" type in case it varies
    if (!prop || prop.type !== "select") return null
    return prop.select?.name ?? null
  }
  return prop.status?.name ?? null
}

function getPerson(prop: any): string | null {
  if (!prop || prop.type !== "people") return null
  const people = prop.people as any[]
  if (!people || people.length === 0) return null
  return people[0]?.name ?? null
}

function getDate(prop: any): string | null {
  if (!prop || prop.type !== "date") return null
  return prop.date?.start ?? null
}

function getMultiSelect(prop: any): string[] {
  if (!prop || prop.type !== "multi_select") return []
  return (prop.multi_select as any[])?.map((s: any) => s.name) ?? []
}

function getRelationNames(prop: any): string[] {
  if (!prop || prop.type !== "relation") return []
  return (prop.relation as any[])?.map((r: any) => r.id) ?? []
}

function matchUser(
  users: { id: string; name: string | null }[],
  notionName: string
): string | null {
  const firstName = notionName.split(" ")[0].toLowerCase()
  const user = users.find(u => u.name?.split(" ")[0].toLowerCase() === firstName)
  return user?.id ?? null
}

async function fetchAllPages(): Promise<any[]> {
  const pages: any[] = []
  let cursor: string | undefined = undefined

  do {
    const response = await notion.dataSources.query({
      data_source_id: DATABASE_ID,
      start_cursor: cursor as any,
      page_size: 100,
    } as any)
    pages.push(...(response as any).results)
    const res = response as any
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)

  return pages
}

async function findOrCreateHoldingKR(companyId: string) {
  const existing = await prisma.externalMapping.findUnique({
    where: {
      companyId_source_externalId: {
        companyId,
        source: "NOTION",
        externalId: "__holding_kr__",
      },
    },
  })

  if (existing) {
    const kr = await prisma.keyResult.findUnique({ where: { id: existing.entityId } })
    if (kr) return kr
  }

  const cycle =
    (await prisma.cycle.findFirst({ where: { companyId, status: "ACTIVE" } })) ??
    (await prisma.cycle.findFirst({ where: { companyId }, orderBy: { createdAt: "desc" } }))

  if (!cycle) throw new Error("Nenhum ciclo encontrado para a empresa")

  const obj = await prisma.objective.create({
    data: {
      title: "Tarefas Operacionais (Notion)",
      companyId,
      cycleId: cycle.id,
    },
  })

  const kr = await prisma.keyResult.create({
    data: {
      title: "Backlog Notion",
      objectiveId: obj.id,
      companyId,
      progressMode: "ACTION_BASED",
    },
  })

  await prisma.externalMapping.create({
    data: {
      entityType: "KEY_RESULT",
      entityId: kr.id,
      source: "NOTION",
      externalId: "__holding_kr__",
      companyId,
    },
  })

  return kr
}

export async function syncNotionTasks(companyId: string, triggeredBy?: string) {
  const startedAt = Date.now()

  const syncLog = await prisma.syncLog.create({
    data: {
      source: "NOTION",
      status: "RUNNING",
      companyId,
      triggeredBy,
    },
  })

  try {
    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true },
    })

    const holdingKR = await findOrCreateHoldingKR(companyId)
    const pages = await fetchAllPages()

    let created = 0
    let updated = 0
    let failed = 0

    for (const page of pages) {
      try {
        const props = page.properties as Record<string, any>

        const title = getTitle(props["Nome da tarefa"])
        if (!title) continue

        const notionStatusRaw = getSelect(props["Status"])
        const status: ActionStatus = notionStatusRaw
          ? (STATUS_MAP[notionStatusRaw] ?? "NOT_STARTED")
          : "NOT_STARTED"

        const ownerName = getPerson(props["Responsável "])
        const ownerId = ownerName ? matchUser(users, ownerName) : null

        const dueDateStr = getDate(props["Prazo"])
        const dueDate = dueDateStr ? new Date(dueDateStr) : null

        const clients =
          getMultiSelect(props["Clientes"]) ||
          getRelationNames(props["Clientes"])

        const existingMapping = await prisma.externalMapping.findUnique({
          where: {
            companyId_source_externalId: {
              companyId,
              source: "NOTION",
              externalId: page.id,
            },
          },
        })

        if (existingMapping) {
          await prisma.action.update({
            where: { id: existingMapping.entityId },
            data: {
              title,
              status,
              ownerId,
              dueDate,
              externalStatus: notionStatusRaw,
            },
          })
          await prisma.externalMapping.update({
            where: { id: existingMapping.id },
            data: { lastSyncedAt: new Date(), metadata: { clients } },
          })
          updated++
        } else {
          const action = await prisma.action.create({
            data: {
              title,
              status,
              ownerId,
              dueDate,
              externalStatus: notionStatusRaw,
              keyResultId: holdingKR.id,
              companyId,
            },
          })
          await prisma.externalMapping.create({
            data: {
              entityType: "ACTION",
              entityId: action.id,
              source: "NOTION",
              externalId: page.id,
              metadata: { clients },
              companyId,
            },
          })
          created++
        }
      } catch (err) {
        console.error("Erro ao sincronizar página Notion:", page.id, err)
        failed++
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: failed > 0 && created + updated === 0 ? "FAILED" : failed > 0 ? "PARTIAL" : "SUCCESS",
        itemsSynced: created + updated,
        itemsFailed: failed,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    })

    return { created, updated, failed, total: pages.length }
  } catch (err) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        errorMessage: String(err),
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    })
    throw err
  }
}
