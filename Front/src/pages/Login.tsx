import { useState } from "react"
import { login } from "../services/api"

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [companySlug, setCompanySlug] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(companySlug, email, password)
      onLogin()
    } catch (err) {
      setError("Login falhou. Verifique seus dados.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8f9fb",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "white",
        padding: "48px 40px",
        borderRadius: 16,
        width: 380,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#111",
            margin: 0,
          }}>
            Strategic OS
          </h1>
          <p style={{
            fontSize: 14,
            color: "#888",
            marginTop: 6,
          }}>
            Gestão de OKRs e métricas estratégicas
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Empresa</label>
          <input
            placeholder="slug-da-empresa"
            value={companySlug}
            onChange={e => setCompanySlug(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Senha</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            background: loading ? "#999" : "#111",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {error && (
          <p style={{
            color: "#e53e3e",
            fontSize: 13,
            marginTop: 12,
            textAlign: "center",
          }}>
            {error}
          </p>
        )}
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#555",
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
}
