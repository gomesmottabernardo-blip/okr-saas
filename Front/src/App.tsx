import { useState, useEffect } from "react"
import { isLoggedIn, logout, fetchCompanySettings, getMyRole } from "./services/api"
import Login from "./pages/Login"
import SetupPassword from "./pages/SetupPassword"
import Dashboard from "./pages/Dashboard"
import OkrManager from "./pages/OkrManager"
import Insights from "./pages/Insights"
import Settings from "./pages/Settings"

type Tab = "dashboard" | "okrs" | "insights" | "settings"

interface CompanyBrand {
  name: string
  primaryColor: string
  logoUrl?: string
}

function getSetupToken(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get("setup")
}

export default function App() {
  const [setupToken] = useState(getSetupToken)
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [tab, setTab] = useState<Tab>("dashboard")
  const [brand, setBrand] = useState<CompanyBrand>({
    name: "Strategic OS",
    primaryColor: "#6366f1",
  })
  const [logoError, setLogoError] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    if (loggedIn) {
      const role = getMyRole()
      setIsSuperAdmin(role === "SUPER_ADMIN")
      setIsAdmin(role === "ADMIN" || role === "SUPER_ADMIN")
      loadBrand()
    }
  }, [loggedIn])

  async function loadBrand() {
    try {
      const s = await fetchCompanySettings()
      if (s) {
        const b: CompanyBrand = {
          name: s.name || "Strategic OS",
          primaryColor: s.primaryColor || "#6366f1",
          logoUrl: s.logoUrl || undefined,
        }
        setBrand(b)
        applyTheme(b.primaryColor)
      }
    } catch (_) {}
  }

  function applyTheme(color: string) {
    document.documentElement.style.setProperty("--primary", color)
  }

  function handleBrandUpdate(updates: { primaryColor?: string; logoUrl?: string; name?: string }) {
    setBrand(prev => ({
      ...prev,
      ...(updates.name && { name: updates.name }),
      ...(updates.primaryColor && { primaryColor: updates.primaryColor }),
      ...(updates.logoUrl !== undefined && { logoUrl: updates.logoUrl || undefined }),
    }))
    if (updates.primaryColor) applyTheme(updates.primaryColor)
    setLogoError(false) // reset error so new logo is tried
  }

  // First-access setup flow
  if (setupToken) {
    return (
      <SetupPassword
        token={setupToken}
        onDone={() => {
          // Remove token from URL and go to login
          window.history.replaceState({}, "", window.location.pathname)
          window.location.reload()
        }}
      />
    )
  }

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  const primary = brand.primaryColor

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f9fb",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* ── Header ───────────────────────────────────────── */}
      <header style={{
        background: "white",
        borderBottom: `3px solid ${primary}`,
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        height: 56,
        position: "sticky",
        top: 0,
        zIndex: 10,
        gap: 0,
      }}>
        {/* Logo / brand — sempre visível */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 36, minWidth: 0 }}>
          {brand.logoUrl && !logoError ? (
            <img
              src={brand.logoUrl}
              alt={brand.name}
              style={{ height: 32, maxWidth: 120, objectFit: "contain" }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div style={{
              minWidth: 32, height: 32, borderRadius: 8,
              background: primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 900, color: "white",
              padding: "0 10px",
              letterSpacing: "-0.5px",
            }}>
              {brand.name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>
            {brand.name}
          </span>
        </div>

        {/* Nav tabs */}
        <nav style={{ display: "flex", gap: 2, flex: 1 }}>
          <TabBtn label="Dashboard" active={tab === "dashboard"} color={primary} onClick={() => setTab("dashboard")} />
          <TabBtn label="OKRs" active={tab === "okrs"} color={primary} onClick={() => setTab("okrs")} />
          <TabBtn label="Insights" active={tab === "insights"} color={primary} onClick={() => setTab("insights")} />
          <TabBtn label="Configurações" active={tab === "settings"} color={primary} onClick={() => setTab("settings")} />
        </nav>

        <button
          onClick={logout}
          style={{ background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", padding: "6px 10px", borderRadius: 6 }}
        >
          Sair
        </button>
      </header>

      {/* ── Content ──────────────────────────────────────── */}
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px" }}>
        {tab === "dashboard" && <Dashboard isAdmin={isAdmin} />}
        {tab === "okrs" && <OkrManager primaryColor={primary} isAdmin={isAdmin} />}
        {tab === "insights" && <Insights isAdmin={isAdmin} />}
        {tab === "settings" && <Settings onSave={handleBrandUpdate} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />}
      </main>
    </div>
  )
}

function TabBtn({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 6,
        border: "none",
        background: active ? `${color}15` : "transparent",
        color: active ? color : "#888",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  )
}
