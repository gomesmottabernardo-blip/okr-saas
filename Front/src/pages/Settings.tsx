import { useEffect, useState } from "react"
import { fetchCompanySettings, updateCompanySettings } from "../services/api"

interface Props {
  onSave: (settings: { primaryColor?: string; logoUrl?: string; name?: string }) => void
}

export default function Settings({ onSave }: Props) {
  const [settings, setSettings] = useState<any>(null)
  const [domain, setDomain] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#6366f1")
  const [logoUrl, setLogoUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanySettings().then(s => {
      if (s) {
        setSettings(s)
        setDomain(s.domain || "")
        setPrimaryColor(s.primaryColor || "#6366f1")
        setLogoUrl(s.logoUrl || "")
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function previewLogo() {
    if (!domain) return
    const url = `https://logo.clearbit.com/${domain}`
    setLogoUrl(url)
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
        Configure a marca da empresa. O sistema busca o logo automaticamente a partir do domínio.
        As cores e logo são aplicadas no cabeçalho do sistema.
      </p>

      <div style={{ background: "white", borderRadius: 14, padding: 28, border: "1px solid #f0f0f0", maxWidth: 560 }}>

        {/* Company name (read-only) */}
        <FieldGroup label="Nome da empresa">
          <div style={{ padding: "10px 14px", background: "#f8f9fb", borderRadius: 8, fontSize: 14, color: "#555", border: "1px solid #e8e8e8" }}>
            {settings?.name || "—"}
          </div>
        </FieldGroup>

        {/* Domain */}
        <FieldGroup label="Domínio da empresa" hint="Ex: funifaixapreta.com.br">
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="seudominio.com.br"
              style={inputStyle}
            />
            <button onClick={previewLogo} style={btnSecondary}>
              Buscar logo
            </button>
          </div>
        </FieldGroup>

        {/* Logo preview */}
        {previewLogoUrl && (
          <FieldGroup label="Logo (pré-visualização)">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img
                src={previewLogoUrl}
                alt="logo"
                style={{ height: 40, maxWidth: 160, objectFit: "contain", borderRadius: 6 }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
              />
              <input
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="URL do logo (opcional)"
                style={{ ...inputStyle, flex: 1, fontSize: 12 }}
              />
            </div>
          </FieldGroup>
        )}

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
              placeholder="#6366f1"
              style={{ ...inputStyle, width: 110 }}
            />
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: primaryColor,
              border: "1px solid rgba(0,0,0,0.08)",
            }} />
          </div>
        </FieldGroup>

        {/* Preview bar */}
        <div style={{
          marginTop: 8, marginBottom: 24,
          borderRadius: 10, overflow: "hidden",
          border: "1px solid #f0f0f0",
        }}>
          <div style={{
            background: "white",
            borderBottom: `3px solid ${primaryColor}`,
            padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            {previewLogoUrl && (
              <img src={previewLogoUrl} alt="" style={{ height: 24, maxWidth: 80, objectFit: "contain" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: primaryColor }}>
              {settings?.name || "Sua empresa"}
            </span>
            <span style={{ fontSize: 12, color: "#888", marginLeft: "auto" }}>pré-visualização</span>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={btnPrimary(primaryColor)}>
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar configurações"}
        </button>
      </div>
    </div>
  )
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      {hint && <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 8px 0" }
const inputStyle: React.CSSProperties = {
  padding: "10px 14px", border: "1px solid #e0e0e0", borderRadius: 8,
  fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
}
const btnSecondary: React.CSSProperties = {
  padding: "10px 16px", borderRadius: 8, border: "1px solid #e0e0e0",
  background: "white", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500,
}
const btnPrimary = (color: string): React.CSSProperties => ({
  padding: "11px 24px", borderRadius: 8, border: "none",
  background: color, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
})
