import { useEffect, useState, useRef } from "react"
import {
  fetchCompanySettings, updateCompanySettings,
  fetchCompanyUsers, createCompanyUser, updateCompanyUser, removeCompanyUser,
  updateCompanyLinks,
  fetchAllCompanies, setCompanyMaxUsers,
} from "../services/api"

interface Props {
  onSave: (settings: { primaryColor?: string; logoUrl?: string; name?: string }) => void
  isAdmin?: boolean
  isSuperAdmin?: boolean
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

async function trpcMut(path: string, input: any) {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/trpc/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || `Erro ${res.status}`)
  return json.result?.data ?? json
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Settings({ onSave, isAdmin = false, isSuperAdmin = false }: Props) {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)

  // Visual identity
  const [domain, setDomain]             = useState("")
  const [primaryColor, setPrimaryColor] = useState("#111111")
  const [logoUrl, setLogoUrl]           = useState("")
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [detecting, setDetecting]       = useState(false)
  const [detectResult, setDetectResult] = useState<{ found: boolean; logoUrl: string | null } | null>(null)

  // Links
  const [site, setSite]             = useState("")
  const [instagram, setInstagram]   = useState("")
  const [linkedin, setLinkedin]     = useState("")
  const [otherLinks, setOtherLinks] = useState("")
  const [savingLinks, setSavingLinks] = useState(false)
  const [savedLinks, setSavedLinks]   = useState(false)

  useEffect(() => {
    fetchCompanySettings().then(s => {
      if (s) {
        setSettings(s)
        setDomain(s.domain || "")
        setPrimaryColor(s.primaryColor || "#111111")
        setLogoUrl(s.logoUrl || "")
        setSite(s.site || "")
        setInstagram(s.instagram || "")
        setLinkedin(s.linkedin || "")
        setOtherLinks(s.otherLinks || "")
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleAutoDetect() {
    if (!domain.trim()) return
    setDetecting(true)
    setDetectResult(null)
    try {
      const result = await trpcMut("company.autoDetectLogo", { domain: domain.trim() })
      setDetectResult(result)
      if (result.logoUrl) {
        setLogoUrl(result.logoUrl)
        onSave({ logoUrl: result.logoUrl })
      }
    } catch {
      setDetectResult({ found: false, logoUrl: null })
    }
    setDetecting(false)
  }

  async function handleSaveBrand() {
    setSaving(true)
    try {
      const updated = await updateCompanySettings({ domain: domain || undefined, primaryColor, logoUrl: logoUrl || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSave({ primaryColor, logoUrl, name: updated?.name })
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  async function handleSaveLinks() {
    setSavingLinks(true)
    try {
      await updateCompanyLinks({ site, instagram, linkedin, otherLinks })
      setSavedLinks(true)
      setTimeout(() => setSavedLinks(false), 2500)
    } catch (err) { console.error(err) }
    setSavingLinks(false)
  }

  if (loading) return <div style={{ padding: 40, color: "#888" }}>Carregando...</div>

  const previewLogoUrl = logoUrl || (domain ? `https://logo.clearbit.com/${domain}` : null)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      {/* ── Identidade Visual ─────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Identidade Visual</SectionTitle>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 22, lineHeight: 1.6 }}>
          Configure a marca da empresa. O sistema busca o logo automaticamente a partir do domínio.
        </p>
        <div style={card}>
          <FieldGroup label="Nome da empresa">
            <div style={readonlyField}>{settings?.name || "—"}</div>
          </FieldGroup>

          <FieldGroup label="Domínio" hint="Ex: funillfaixapreta.com  •  minha-empresa.com.br">
            <div style={{ display: "flex", gap: 8 }}>
              <input value={domain} onChange={e => { setDomain(e.target.value); setDetectResult(null) }}
                placeholder="dominio.com.br" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={handleAutoDetect} disabled={detecting || !domain.trim()}
                style={{ ...btnDark, minWidth: 130, opacity: detecting ? 0.5 : 1 }}>
                {detecting ? "Buscando..." : "🔍 Buscar logo"}
              </button>
            </div>
            {detectResult && (
              <div style={{
                marginTop: 10, padding: "10px 14px", borderRadius: 8,
                background: detectResult.found ? "#f0fdf4" : "#fff7ed",
                border: `1px solid ${detectResult.found ? "#bbf7d0" : "#fed7aa"}`,
                fontSize: 13,
              }}>
                {detectResult.found
                  ? <span style={{ color: "#15803d" }}>✓ Logo encontrada e aplicada.</span>
                  : <span style={{ color: "#c2410c" }}>Logo não encontrada. Cole a URL manualmente abaixo.</span>}
              </div>
            )}
          </FieldGroup>

          <FieldGroup label="Logo">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              <div style={{ width: 80, height: 52, borderRadius: 8, background: "#f8f9fb", border: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {previewLogoUrl
                  ? <img src={previewLogoUrl} alt="logo" style={{ maxWidth: 72, maxHeight: 44, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                  : <span style={{ fontSize: 22, fontWeight: 800, color: primaryColor }}>{(settings?.name || "?").charAt(0)}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>URL manual (opcional)</div>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://exemplo.com/logo.png" style={{ ...inputStyle, fontSize: 12 }} />
              </div>
            </div>
          </FieldGroup>

          <FieldGroup label="Cor principal">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                style={{ width: 48, height: 40, border: "1px solid #e0e0e0", borderRadius: 8, cursor: "pointer", padding: 4 }} />
              <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                placeholder="#111111" style={{ ...inputStyle, width: 110 }} />
              <div style={{ width: 40, height: 40, borderRadius: 8, background: primaryColor, border: "1px solid rgba(0,0,0,0.08)" }} />
            </div>
          </FieldGroup>

          {/* Live preview */}
          <div style={{ marginTop: 4, marginBottom: 24, borderRadius: 10, overflow: "hidden", border: "1px solid #f0f0f0" }}>
            <div style={{ background: "white", borderBottom: `3px solid ${primaryColor}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              {previewLogoUrl
                ? <img src={previewLogoUrl} alt="" style={{ height: 24, maxWidth: 80, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                : <div style={{ minWidth: 28, height: 28, borderRadius: 6, background: primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "white", padding: "0 7px" }}>
                    {(settings?.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 3).toUpperCase()}
                  </div>}
              <span style={{ fontSize: 14, fontWeight: 700, color: primaryColor }}>{settings?.name || "Sua empresa"}</span>
              <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto" }}>pré-visualização</span>
            </div>
          </div>

          <button onClick={handleSaveBrand} disabled={saving} style={btnPrimary(primaryColor)}>
            {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar identidade visual"}
          </button>
        </div>
      </section>

      {/* ── Links e Redes Sociais ─────────────────────────────────────────── */}
      <section>
        <SectionTitle>Links e Redes Sociais</SectionTitle>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 22, lineHeight: 1.6 }}>
          Todos os campos são opcionais. Use para contextualizar a presença digital da empresa.
        </p>
        <div style={card}>
          <FieldGroup label="Site">
            <input value={site} onChange={e => setSite(e.target.value)} placeholder="https://www.suaempresa.com.br" style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Instagram">
            <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@suaempresa" style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="LinkedIn">
            <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/suaempresa" style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Outros links" hint="Outros canais relevantes (YouTube, WhatsApp Business, etc.)">
            <input value={otherLinks} onChange={e => setOtherLinks(e.target.value)} placeholder="https://..." style={inputStyle} />
          </FieldGroup>

          <button onClick={handleSaveLinks} disabled={savingLinks} style={btnPrimary(primaryColor)}>
            {savingLinks ? "Salvando..." : savedLinks ? "✓ Salvo!" : "Salvar links"}
          </button>
        </div>
      </section>

      {/* ── Usuários ─────────────────────────────────────────────────────── */}
      {isAdmin && (
        <UserManagementSection
          isSuperAdmin={isSuperAdmin}
          maxUsers={settings?.maxUsers ?? 10}
          primaryColor={primaryColor}
        />
      )}

      {/* ── Gestão de Plataforma (só Super Admin) ────────────────────────── */}
      {isSuperAdmin && <PlatformSection primaryColor={primaryColor} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT SECTION
// ─────────────────────────────────────────────────────────────────────────────

interface CompanyUser {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
}

function UserManagementSection({ isSuperAdmin, maxUsers, primaryColor }: { isSuperAdmin: boolean; maxUsers: number; primaryColor: string }) {
  const [users, setUsers]         = useState<CompanyUser[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError]         = useState("")

  // Create form
  const [newName, setNewName]         = useState("")
  const [newEmail, setNewEmail]       = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole]         = useState<"ADMIN" | "MEMBER">("MEMBER")
  const [creating, setCreating]       = useState(false)

  // Edit form
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState<"ADMIN" | "MEMBER">("MEMBER")
  const [saving, setSaving]     = useState(false)

  async function load() {
    try {
      const data = await fetchCompanyUsers()
      setUsers(data || [])
    } catch { setUsers([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setError("Preencha nome, e-mail e senha.")
      return
    }
    setCreating(true)
    setError("")
    try {
      await createCompanyUser({ name: newName, email: newEmail, password: newPassword, role: newRole })
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("MEMBER")
      setShowForm(false)
      await load()
    } catch (err: any) {
      setError(err.message || "Erro ao criar usuário.")
    }
    setCreating(false)
  }

  function startEdit(u: CompanyUser) {
    setEditingId(u.id)
    setEditName(u.name || "")
    setEditRole(u.role === "ADMIN" ? "ADMIN" : "MEMBER")
  }

  async function handleSaveEdit() {
    if (!editingId) return
    setSaving(true)
    setError("")
    try {
      await updateCompanyUser(editingId, { name: editName, role: editRole })
      setEditingId(null)
      await load()
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar usuário.")
    }
    setSaving(false)
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remover "${name || "usuário"}" permanentemente?`)) return
    setError("")
    try {
      await removeCompanyUser(id)
      await load()
    } catch (err: any) {
      setError(err.message || "Erro ao remover.")
    }
  }

  const atLimit = !isSuperAdmin && users.length >= maxUsers

  return (
    <section>
      <SectionTitle>Usuários da Empresa</SectionTitle>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 22, lineHeight: 1.6 }}>
        Gerencie quem tem acesso ao Strategic OS da sua empresa.
        {!isSuperAdmin && ` Limite do plano: ${maxUsers} usuários.`}
      </p>

      <div style={card}>
        {/* Header com contador */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Colaboradores</span>
            {!isSuperAdmin && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                padding: "2px 10px", borderRadius: 20,
                background: atLimit ? "#fee2e2" : "#f0fdf4",
                color: atLimit ? "#dc2626" : "#16a34a",
              }}>
                {loading ? "..." : `${users.length} / ${maxUsers}`}
              </span>
            )}
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setError("") }}
            disabled={atLimit}
            title={atLimit ? `Limite de ${maxUsers} usuários atingido` : "Adicionar usuário"}
            style={{
              ...btnDark,
              opacity: atLimit ? 0.4 : 1,
              cursor: atLimit ? "not-allowed" : "pointer",
            }}
          >
            + Adicionar
          </button>
        </div>

        {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>{error}</div>}

        {/* Inline create form */}
        {showForm && (
          <div style={{ background: "#f8f9fb", borderRadius: 10, padding: 20, marginBottom: 20, border: "1px solid #e8e8e8" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#333", marginBottom: 14 }}>Novo usuário</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={labelStyle}>Nome *</div>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome completo" style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>E-mail *</div>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@empresa.com" style={inputStyle} type="email" />
              </div>
              <div>
                <div style={labelStyle}>Senha temporária *</div>
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mín. 6 caracteres" style={inputStyle} type="password" />
              </div>
              <div>
                <div style={labelStyle}>Perfil</div>
                <select value={newRole} onChange={e => setNewRole(e.target.value as any)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="MEMBER">Membro</option>
                  <option value="ADMIN">Admin da empresa</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreate} disabled={creating} style={btnPrimary(primaryColor)}>
                {creating ? "Criando..." : "Criar usuário"}
              </button>
              <button onClick={() => { setShowForm(false); setError("") }} style={btnCancel}>Cancelar</button>
            </div>
          </div>
        )}

        {/* User list */}
        {loading ? (
          <div style={{ color: "#aaa", fontSize: 13, padding: 12 }}>Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div style={{ color: "#aaa", fontSize: 13, padding: 12 }}>Nenhum usuário cadastrado.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {users.map(u => (
              <div key={u.id}>
                {editingId === u.id ? (
                  // Edit inline
                  <div style={{ background: "#f8f9fb", borderRadius: 10, padding: 16, border: "1px solid #e8e8e8" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={labelStyle}>Nome</div>
                        <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}>Perfil</div>
                        <select value={editRole} onChange={e => setEditRole(e.target.value as any)} style={{ ...inputStyle, cursor: "pointer" }}>
                          <option value="MEMBER">Membro</option>
                          <option value="ADMIN">Admin da empresa</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleSaveEdit} disabled={saving} style={btnPrimary(primaryColor)}>
                        {saving ? "Salvando..." : "Salvar"}
                      </button>
                      <button onClick={() => setEditingId(null)} style={btnCancel}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  // Display row
                  <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", borderRadius: 8, gap: 12, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    {/* Avatar */}
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: roleColor(u.role) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: roleColor(u.role), flexShrink: 0 }}>
                      {(u.name || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{u.name || "—"}</div>
                      <div style={{ fontSize: 12, color: "#999" }}>{u.email}</div>
                    </div>
                    <RoleBadge role={u.role} />
                    {u.role !== "SUPER_ADMIN" && (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => startEdit(u)} style={btnIconSmall}>✏️</button>
                        <button onClick={() => handleRemove(u.id, u.name || u.email)} style={{ ...btnIconSmall, color: "#dc2626" }}>🗑️</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {atLimit && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#fff7ed", borderRadius: 8, fontSize: 13, color: "#c2410c" }}>
            ⚠️ Limite de {maxUsers} usuários atingido. Contate o administrador da plataforma para aumentar o limite.
          </div>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM SECTION (Super Admin only)
// ─────────────────────────────────────────────────────────────────────────────

interface CompanyRow {
  id: string
  name: string
  slug: string
  maxUsers: number
  currentUsers: number
  createdAt: string
}

function PlatformSection({ primaryColor }: { primaryColor: string }) {
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [editMax, setEditMax]     = useState<Record<string, string>>({})
  const [saving, setSaving]       = useState<string | null>(null)
  const [saved, setSaved]         = useState<string | null>(null)
  const [error, setError]         = useState("")

  async function load() {
    try {
      const data = await fetchAllCompanies()
      setCompanies(data || [])
      const defaults: Record<string, string> = {}
      for (const c of data || []) defaults[c.id] = String(c.maxUsers)
      setEditMax(defaults)
    } catch { setCompanies([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSetMax(companyId: string) {
    const val = parseInt(editMax[companyId] || "10")
    if (isNaN(val) || val < 1) { setError("Valor inválido."); return }
    setSaving(companyId)
    setError("")
    try {
      await setCompanyMaxUsers(companyId, val)
      setSaved(companyId)
      setTimeout(() => setSaved(null), 2000)
      await load()
    } catch (err: any) { setError(err.message || "Erro.") }
    setSaving(null)
  }

  return (
    <section>
      <SectionTitle>
        <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 20, fontWeight: 700, marginRight: 8, verticalAlign: "middle" }}>
          SUPER ADMIN
        </span>
        Gestão de Empresas
      </SectionTitle>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 22, lineHeight: 1.6 }}>
        Aqui você define o limite máximo de usuários que o admin de cada empresa pode adicionar.
        Você tem acesso irrestrito a todas as empresas da plataforma.
      </p>

      <div style={card}>
        {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>{error}</div>}

        {loading ? (
          <div style={{ color: "#aaa", fontSize: 13, padding: 12 }}>Carregando empresas...</div>
        ) : companies.length === 0 ? (
          <div style={{ color: "#aaa", fontSize: 13, padding: 12 }}>Nenhuma empresa cadastrada.</div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px 100px", gap: 12, padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>Empresa</span>
              <span>Usuários</span>
              <span>Limite máximo</span>
              <span></span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {companies.map(c => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px 100px", gap: 12, alignItems: "center", padding: "12px 14px", borderRadius: 8, background: "#f8f9fb" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{c.slug}</div>
                  </div>
                  <div>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                      background: c.currentUsers >= c.maxUsers ? "#fee2e2" : "#f0fdf4",
                      color: c.currentUsers >= c.maxUsers ? "#dc2626" : "#16a34a",
                    }}>
                      {c.currentUsers} / {c.maxUsers}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={editMax[c.id] ?? c.maxUsers}
                      onChange={e => setEditMax(prev => ({ ...prev, [c.id]: e.target.value }))}
                      style={{ ...inputStyle, width: 80, textAlign: "center", padding: "6px 10px" }}
                    />
                    <span style={{ fontSize: 12, color: "#aaa" }}>usuários</span>
                  </div>
                  <div>
                    <button
                      onClick={() => handleSetMax(c.id)}
                      disabled={saving === c.id}
                      style={btnPrimary(saved === c.id ? "#16a34a" : primaryColor, "small")}
                    >
                      {saving === c.id ? "..." : saved === c.id ? "✓" : "Salvar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS & STYLES
// ─────────────────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 16, fontWeight: 700, color: "#222", margin: "0 0 8px 0" }}>{children}</h2>
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={labelStyle}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", bg: "#fef3c7", color: "#92400e" },
    ADMIN:       { label: "Admin",       bg: "#ede9fe", color: "#5b21b6" },
    MEMBER:      { label: "Membro",      bg: "#f1f5f9", color: "#64748b" },
  }
  const s = map[role] || map.MEMBER
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  )
}

function roleColor(role: string) {
  if (role === "SUPER_ADMIN") return "#d97706"
  if (role === "ADMIN") return "#7c3aed"
  return "#64748b"
}

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: 28,
  border: "1px solid #f0f0f0",
  maxWidth: 680,
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#555",
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
}

const readonlyField: React.CSSProperties = {
  padding: "10px 14px",
  background: "#f8f9fb",
  borderRadius: 8,
  fontSize: 14,
  color: "#555",
  border: "1px solid #e8e8e8",
}

const btnDark: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "#111",
  color: "white",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
}

const btnCancel: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #e0e0e0",
  background: "white",
  color: "#666",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
}

const btnIconSmall: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid #e8e8e8",
  background: "white",
  fontSize: 13,
  cursor: "pointer",
}

function btnPrimary(color: string, size: "normal" | "small" = "normal"): React.CSSProperties {
  return {
    padding: size === "small" ? "6px 14px" : "11px 28px",
    borderRadius: 8,
    border: "none",
    background: color,
    color: "white",
    fontSize: size === "small" ? 12 : 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }
}
