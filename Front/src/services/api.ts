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

export async function fetchDashboardSummary(cycleId?: string) {
  return trpcQuery("dashboard.summary", cycleId ? { cycleId } : undefined)
}

export async function fetchFinancialMetrics() {
  return trpcQuery("dashboard.financial")
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
