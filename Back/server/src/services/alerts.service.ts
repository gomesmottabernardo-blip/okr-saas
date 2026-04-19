import { prisma } from "../lib/prisma"
import { resolveTargetCycleId } from "./okr.service"

export interface AlertEmailResult {
  sent: number
  skipped: number
  recipients: string[]
  errors: string[]
  noApiKey?: boolean
}

export async function sendOverdueAlertEmails(
  companyId: string,
  cycleId?: string
): Promise<AlertEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { sent: 0, skipped: 0, recipients: [], errors: [], noApiKey: true }
  }

  const company = await prisma.company.findFirst({
    where: { id: companyId },
    select: { name: true, primaryColor: true },
  })

  const targetCycleId = await resolveTargetCycleId(companyId, cycleId)
  if (!targetCycleId) throw new Error("Nenhum ciclo ativo encontrado")

  const now = new Date()

  const actions = await prisma.action.findMany({
    where: {
      companyId,
      status: { not: "COMPLETED" },
      ownerId: { not: null },
      keyResult: { objective: { cycleId: targetCycleId } },
      OR: [{ dueDate: { lt: now } }, { status: "AT_RISK" }],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      keyResult: {
        include: {
          objective: { select: { title: true, progress: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  })

  // Agrupa por owner
  const byOwner = new Map<string, { owner: any; actions: any[] }>()
  for (const action of actions) {
    if (!action.owner?.email) continue
    const key = action.owner.id
    if (!byOwner.has(key)) byOwner.set(key, { owner: action.owner, actions: [] })
    byOwner.get(key)!.actions.push(action)
  }

  if (byOwner.size === 0) {
    return { sent: 0, skipped: 0, recipients: [], errors: [] }
  }

  const { Resend } = require("resend")
  const resend = new Resend(apiKey)
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev"
  const companyName = company?.name || "Strategic OS"
  const primaryColor = company?.primaryColor || "#6366f1"

  const result: AlertEmailResult = { sent: 0, skipped: 0, recipients: [], errors: [] }

  for (const [, { owner, actions: ownerActions }] of byOwner) {
    const html = buildEmailHTML(companyName, primaryColor, owner.name, ownerActions, now)
    const subject = `⚠️ ${ownerActions.length} tarefa${ownerActions.length > 1 ? "s" : ""} prioritária${ownerActions.length > 1 ? "s" : ""} precisam da sua atenção`

    try {
      await resend.emails.send({
        from: `${companyName} OKR <${fromEmail}>`,
        to: owner.email,
        subject,
        html,
      })
      result.sent++
      result.recipients.push(`${owner.name} <${owner.email}>`)
    } catch (err: any) {
      result.errors.push(`${owner.name}: ${err.message || "erro desconhecido"}`)
      result.skipped++
    }
  }

  return result
}

function buildEmailHTML(
  companyName: string,
  primaryColor: string,
  ownerName: string,
  actions: any[],
  now: Date
): string {
  const rows = actions
    .map(a => {
      const isOverdue = a.dueDate && new Date(a.dueDate) < now
      const dateStr = a.dueDate
        ? new Date(a.dueDate).toLocaleDateString("pt-BR")
        : "Sem prazo"
      const badge = isOverdue
        ? `<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">ATRASADA</span>`
        : `<span style="background:#fef3c7;color:#d97706;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">EM RISCO</span>`

      return `
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
            <div style="margin-bottom:4px;">${badge}</div>
            <div style="font-size:14px;font-weight:600;color:#1a1a1a;margin:6px 0 4px;">${a.title}</div>
            <div style="font-size:12px;color:#888;">
              Objetivo: ${a.keyResult.objective.title}
              &nbsp;·&nbsp;
              Progresso: ${Math.round(a.keyResult.objective.progress * 100)}%
            </div>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:top;white-space:nowrap;">
            <span style="font-size:13px;color:${isOverdue ? "#dc2626" : "#888"};font-weight:${isOverdue ? "600" : "400"};">
              ${dateStr}
            </span>
          </td>
        </tr>`
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto 48px;">
    <!-- Header -->
    <div style="background:${primaryColor};border-radius:12px 12px 0 0;padding:28px 32px;">
      <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">${companyName}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:3px;">Alerta de OKRs — Tarefas prioritárias</div>
    </div>
    <!-- Body -->
    <div style="background:white;padding:32px;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;">
      <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#1a1a1a;">Olá, ${ownerName}</p>
      <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">
        Você tem <strong style="color:#dc2626;">${actions.length} tarefa${actions.length > 1 ? "s" : ""}</strong>
        que ${actions.length > 1 ? "estão" : "está"} atrasada${actions.length > 1 ? "s" : ""} ou em risco.
        Por favor, priorize-${actions.length > 1 ? "as" : "a"} hoje.
      </p>
      <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;">
        ${rows}
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.6;">
        Atualize o status dessas tarefas no sistema integrado da empresa ou entre em contato com seu gestor.<br>
        Esta mensagem foi gerada automaticamente pelo <strong>Strategic OS</strong>.
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f4f5f7;border-radius:0 0 12px 12px;border:1px solid #e8e8e8;border-top:none;padding:16px 32px;text-align:center;">
      <span style="font-size:12px;color:#bbb;">Strategic OS · Sistema de Gestão de OKRs</span>
    </div>
  </div>
</body>
</html>`
}
