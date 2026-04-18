import { useEffect, useState } from "react"
import { fetchCompanySettings, updateCompanySettings } from "../services/api"

interface Props {
  onSave: (settings: { primaryColor?: string; logoUrl?: string; name?: string }) => void
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

export default function Settings({ onSave }: Props) {
  const [settings, setSettings] = useState<any>(null)
  const [domain, setDomain] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#111111")
  const [logoUrl, setLogoUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectResult, setDetectResult] = useState<{ found: boolean; logoUrl: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanySettings().then(s => {
      if (s) {
        setSettings(s)
        setDomain(s.domain || "")
        setPrimaryColor(s.primaryColor || "#111111")
        setLogoUrl(s.logoUrl || "")
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
    } catch (err) {
      console.error(err)
      setDetectResult({ found: false, logoUrl: null })
    }
    setDetecting(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateCompanySettings({
        domain: domain || undefined,
        primaryColor,
        logoUrl: logoUrl || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSave({ primaryColor, logoUrl, name: updated?.name })
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40, color: "#888" }}>Carregando...</div>

  const previewLogoUrl = logoUrl || (domain ? `https://logo.clearbit.com/${domain}` : null)

  return (
    <div>
      <h2 style={sectionTitle}>Identidade Visual da Empresa</h2>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 28, lineHeight: 1.6 }}>
        Configure a marca do cliente. O sistema busca o logo automaticamente a partir do domínio —
        testando Clearbit, Google e DuckDuckGo em sequência.
      </p>

      <div style={{ background: "white", borderRadius: 14, padding: 28, border: "1px solid #f0f0f0", maxWidth: 580 }}>

        {/* Company name */}
        <FieldGroup label="Nome da empresa">
          <div style={readonlyField}>{settings?.name || "—"}</div>
        </FieldGroup>

        {/* Domain + auto-detect */}
        <FieldGroup label="Domínio da empresa" hint="Ex: funillfaixapreta.com  •  minha-empresa.com.br">
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={domain}
              onChange={e => { setDomain(e.target.value); setDetectResult(null) }}
              placeholder="dominio.com.br"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleAutoDetect}
              disabled={detecting || !domain.trim()}
              style={{
                ...btnSecondary,
                background: detecting ? "#f3f4f6" : "#111",
                color: detecting ? "#9ca3af" : "white",
                border: "none",
                minWidth: 130,
              }}
            >
              {detecting ? "Buscando..." : "🔍 Buscar logo"}
            </button>
          </div>

          {/* Resultado da detecção automática */}
          {detectResult && (
            <div style={{
              marginTop: 10, padding: "10px 14px", borderRadius: 8,
              background: detectResult.found ? "#f0fdf4" : "#fff7ed",
              border: `1px solid ${detectResult.found ? "#bbf7d0" : "#fed7aa"}`,
              fontSize: 13,
            }}>
              {detectResult.found ? (
                <span style={{ color: "#15803d" }}>
                  ✓ Logo encontrada e aplicada automaticamente.
                </span>
              ) : (
                <span style={{ color: "#c2410c" }}>
                  Logo não encontrada nas fontes automáticas. Cole a URL manualmente abaixo ou o sistema usará as iniciais da empresa.
                </span>
              )}
            </div>
          )}
        </FieldGroup>

        {/* Logo preview + manual URL */}
        <FieldGroup label="Logo">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            {/* Preview box */}
            <div style={{
              width: 80, height: 52, borderRadius: 8,
              background: "#f8f9fb", border: "1px solid #e8e8e8",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
            }}>
              {previewLogoUrl ? (
                <img
                  src={previewLogoUrl}
                  alt="logo"
                  style={{ maxWidth: 72, maxHeight: 44, objectFit: "contain" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              ) : (
                <span style={{ fontSize: 22, fontWeight: 800, color: primaryColor }}>
                  {(settings?.name || "?").charAt(0)}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>URL manual (opcional)</div>
              <input
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                style={{ ...inputStyle, fontSize: 12 }}
              />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "#bbb", lineHeight: 1.5 }}>
            Se a busca automática não encontrar, cole aqui qualquer URL de imagem pública (PNG, SVG, JPG).
            Sugestão: clique com botão direito na logo do LinkedIn/Instagram → "Copiar endereço da imagem".
          </p>
        </FieldGroup>

        {/* Primary color */}
        <FieldGroup label="Cor principal da marca">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              style={{ width: 48, height: 40, border: "1px solid #e0e0e0", borderRadius: 8, cursor: "pointer", padding: 4 }}
            />
            <input
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              placeholder="#111111"
              style={{ ...inputStyle, width: 110 }}
            />
            <div style={{ width: 40, height: 40, borderRadius: 8, background: primaryColor, border: "1px solid rgba(0,0,0,0.08)" }} />
          </div>
        </FieldGroup>

        {/* Live preview bar */}
        <div style={{ marginTop: 4, marginBottom: 24, borderRadius: 10, overflow: "hidden", border: "1px solid #f0f0f0" }}>
          <div style={{
            background: "white",
            borderBottom: `3px solid ${primaryColor}`,
            padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            {previewLogoUrl ? (
              <img src={previewLogoUrl} alt="" style={{ height: 24, maxWidth: 80, objectFit: "contain" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
            ) : (
              <div style={{
                minWidth: 28, height: 28, borderRadius: 6, background: primaryColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900, color: "white", padding: "0 7px",
              }}>
                {(settings?.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 3).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: primaryColor }}>
              {settings?.name || "Sua empresa"}
            </span>
            <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto" }}>pré-visualização</span>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={btnPrimary(primaryColor)}>
          {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar configurações"}
        </button>
      </div>
    </div>
  )
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {hint && <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 8px 0" }
const inputStyle: React.CSSProperties = { padding: "10px 14px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }
const readonlyField: React.CSSProperties = { padding: "10px 14px", background: "#f8f9fb", borderRadius: 8, fontSize: 14, color: "#555", border: "1px solid #e8e8e8" }
const btnSecondary: React.CSSProperties = { padding: "10px 16px", borderRadius: 8, border: "1px solid #e0e0e0", background: "white", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600 }
const btnPrimary = (color: string): React.CSSProperties => ({ padding: "11px 28px", borderRadius: 8, border: "none", background: color, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" })
