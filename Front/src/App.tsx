import { useState, useEffect } from "react"
import { isLoggedIn, logout } from "./services/api"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import OkrManager from "./pages/OkrManager"

type Tab = "dashboard" | "okrs"

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [tab, setTab] = useState<Tab>("dashboard")

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f9fb",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* ── Top bar ──────────────────────────────────────── */}
      <header style={{
        background: "white",
        borderBottom: "1px solid #eee",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        height: 56,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#111",
          marginRight: 40,
        }}>
          Strategic OS
        </span>

        <nav style={{ display: "flex", gap: 4, flex: 1 }}>
          <TabButton label="Dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <TabButton label="OKRs" active={tab === "okrs"} onClick={() => setTab("okrs")} />
        </nav>

        <button
          onClick={logout}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            fontSize: 13,
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: 6,
          }}
        >
          Sair
        </button>
      </header>

      {/* ── Conteúdo ─────────────────────────────────────── */}
      <main style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 24px",
      }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "okrs" && <OkrManager />}
      </main>
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 6,
        border: "none",
        background: active ? "#f3f4f6" : "transparent",
        color: active ? "#111" : "#888",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )
}
