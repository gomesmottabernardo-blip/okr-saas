const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

function getToken(): string | null {
  return localStorage.getItem("token")
}

async function trpcQuery(path: string, input?: any): Promise<any> {
  const token = getToken()

  const params = input
    ? `?input=${encodeURIComponent(JSON.stringify(input))}`
    : ""

  const res = await fetch(`${API_URL}/trpc/${path}${params}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/"
      throw new Error("Sessão expirada")
    }
    throw new Error(`Erro ${res.status}`)
  }

  const json = await res.json()
  return json.result?.data ?? json
}

async function trpcMutation(path: string, input: any): Promise<any> {
  const token = getToken()

  const res = await fetch(`${API_URL}/trpc/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/"
      throw new Error("Sessão expirada")
    }
    const text = await res.text()
    throw new Error(text || `Erro ${res.status}`)
  }

  const json = await res.json()
  return json.result?.data ?? json
}

export async function login(companySlug: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/trpc/auth.login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companySlug, email, password }),
  })

  if (!res.ok) {
    throw new Error("Login falhou")
  }

  const json = await res.json()
  const token = json.result?.data?.token

  if (token) {
    localStorage.setItem("token", token)
    return token
  }

  throw new Error("Token não encontrado")
}

export function logout() {
  localStorage.removeItem("token")
  window.location.href = "/"
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export function getMyRole(): "SUPER_ADMIN" | "ADMIN" | "MEMBER" {
  const token = localStorage.getItem("token")
  if (!token) return "MEMBER"
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    if (payload.role === "SUPER_ADMIN") return "SUPER_ADMIN"
    if (payload.role === "ADMIN") return "ADMIN"
    return "MEMBER"
  } catch {
    return "MEMBER"
  }
}

export async function fetchDashboardSummary(cycleId?: string) {
  return trpcQuery("dashboard.summary", cycleId ? { cycleId } : undefined)
}

export async function fetchMonthlyBreakdown() {
  return trpcQuery("dashboard.monthly")
}

export async function fetchCompanySettings() {
  return trpcQuery("company.getSettings")
}

export async function updateCompanySettings(data: {
  domain?: string
  primaryColor?: string
  logoUrl?: string | null
}) {
  return trpcMutation("company.updateSettings", data)
}

export async function fetchUsers() {
  return trpcQuery("okr.listUsers")
}

export async function fetchOverdueAlerts(cycleId?: string) {
  return trpcQuery("okr.overdueAlerts", cycleId ? { cycleId } : undefined)
}

export async function fetchCycleInsights(cycleId?: string) {
  return trpcQuery("insights.getCycleInsights", cycleId ? { cycleId } : undefined)
}

export async function sendAlerts(cycleId?: string) {
  return trpcMutation("alerts.sendOverdueAlerts", cycleId ? { cycleId } : {})
}

export async function fetchFinancialMetrics() {
  return trpcQuery("dashboard.financial")
}

export async function fetchFinancialProjections() {
  return trpcQuery("dashboard.projections")
}

export async function fetchOkrMetrics(cycleId?: string) {
  return trpcQuery("dashboard.okr", cycleId ? { cycleId } : undefined)
}

export async function fetchCycles() {
  return trpcQuery("okr.listCycles")
}

export async function fetchActiveCycle() {
  return trpcQuery("okr.getActiveCycle")
}

export async function createCycle(label: string, startDate: string, endDate: string) {
  return trpcMutation("okr.createCycle", {
    label,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
  })
}

export async function activateCycle(cycleId: string) {
  return trpcMutation("okr.activateCycle", { cycleId })
}

export async function fetchObjectives(cycleId?: string) {
  return trpcQuery("okr.listObjectives", cycleId ? { cycleId } : undefined)
}

export async function createObjective(data: {
  title: string
  description?: string
  cycleId?: string
  ownerId?: string
}) {
  return trpcMutation("okr.createObjective", data)
}

export async function updateObjective(id: string, data: any) {
  return trpcMutation("okr.updateObjective", { id, ...data })
}

export async function deleteObjective(id: string) {
  return trpcMutation("okr.deleteObjective", { id })
}

export async function createKeyResult(data: {
  title: string
  objectiveId: string
  progressMode?: string
  targetValue?: number
  startValue?: number
  unit?: string
}) {
  return trpcMutation("okr.createKeyResult", data)
}

export async function updateKeyResult(id: string, data: any) {
  return trpcMutation("okr.updateKeyResult", { id, ...data })
}

export async function deleteKeyResult(id: string) {
  return trpcMutation("okr.deleteKeyResult", { id })
}

export async function createAction(data: {
  title: string
  keyResultId: string
  ownerId?: string
  dueDate?: string
}) {
  return trpcMutation("okr.createAction", data)
}

export async function updateAction(id: string, data: any) {
  return trpcMutation("okr.updateAction", { id, ...data })
}

export async function deleteAction(id: string) {
  return trpcMutation("okr.deleteAction", { id })
}

// ── Settings: User Management ─────────────────────────────────────────────────

export async function fetchCompanyUsers() {
  return trpcQuery("settings.listUsers")
}

export async function createCompanyUser(data: {
  name: string
  email: string
  role: "ADMIN" | "MEMBER"
}) {
  return trpcMutation("settings.createUser", data)
}

export async function updateCompanyUser(id: string, data: { name?: string; role?: "ADMIN" | "MEMBER" }) {
  return trpcMutation("settings.updateUser", { id, ...data })
}

export async function removeCompanyUser(id: string) {
  return trpcMutation("settings.removeUser", { id })
}

export async function updateCompanyLinks(data: {
  site?: string
  instagram?: string
  linkedin?: string
  otherLinks?: string
}) {
  return trpcMutation("settings.updateLinks", data)
}

// ── Settings: Super Admin ─────────────────────────────────────────────────────

export async function fetchAllCompanies() {
  return trpcQuery("settings.listAllCompanies")
}

export async function setCompanyMaxUsers(companyId: string, maxUsers: number) {
  return trpcMutation("settings.setCompanyMaxUsers", { companyId, maxUsers })
}

export async function regenerateUserInvite(userId: string) {
  return trpcMutation("settings.regenerateInvite", { userId })
}

// ── First-access password setup ───────────────────────────────────────────────

export async function validateSetupToken(token: string) {
  return trpcQuery("auth.validateSetupToken", { token })
}

export async function setupPassword(token: string, password: string) {
  return trpcMutation("auth.setupPassword", { token, password })
}
