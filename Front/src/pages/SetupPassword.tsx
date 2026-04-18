import { useState, useEffect } from "react"
import { validateSetupToken, setupPassword } from "../services/api"

interface Props {
  token: string
  onDone: () => void
}

export default function SetupPassword({ token, onDone }: Props) {
  const [step, setStep]         = useState<"loading" | "form" | "done" | "error">("loading")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [strength, setStrength] = useState(0)
  const [error, setError]       = useState("")
  const [saving, setSaving]     = useState(false)
  const [showPwd, setShowPwd]   = useState(false)

  useEffect(() => {
    validateSetupToken(token)
      .then(data => { setEmail(data.email || ""); setStep("form") })
      .catch(() => setStep("error"))
  }, [token])

  function calcStrength(pwd: string): number {
    let score = 0
    if (pwd.length >= 8)  score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  function handlePasswordChange(v: string) {
    setPassword(v)
    setStrength(calcStrength(v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.")
      return
    }
    setSaving(true)
    try {
      await setupPassword(token, password)
      setStep("done")
    } catch (err: any) {
      setError(err.message || "Erro ao definir senha. Token pode ter expirado.")
    }
    setSaving(false)
  }

  const strengthLabel = ["", "Fraca", "Regular", "Boa", "Forte", "Muito forte"][strength]
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][strength]

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8f9fb",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: "white",
        padding: "48px 40px",
        borderRadius: 16,
        width: 400,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>
            Strategic OS
          </h1>
          <p style={{ fontSize: 14, color: "#888", marginTop: 6 }}>
            {step === "loading" ? "Verificando convite..."
              : step === "error" ? "Convite inválido"
              : step === "done" ? "Senha definida!"
              : "Primeiro acesso — defina sua senha"}
          </p>
        </div>

        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa", fontSize: 14 }}>
            Carregando...
          </div>
        )}

        {step === "error" && (
          <div>
            <div style={{ padding: "16px", background: "#fee2e2", borderRadius: 10, fontSize: 14, color: "#dc2626", marginBottom: 20 }}>
              Este link de convite é inválido ou expirou.<br />
              Solicite um novo link ao administrador da sua empresa.
            </div>
            <button onClick={onDone} style={btnStyle("#111")}>
              Ir para o login
            </button>
          </div>
        )}

        {step === "done" && (
          <div>
            <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: 10, fontSize: 14, color: "#15803d", marginBottom: 20 }}>
              ✓ Sua senha foi definida com sucesso!<br />
              Faça login com o e-mail <strong>{email}</strong>.
            </div>
            <button onClick={onDone} style={btnStyle("#111")}>
              Fazer login
            </button>
          </div>
        )}

        {step === "form" && (
          <form onSubmit={handleSubmit}>
            {email && (
              <div style={{ marginBottom: 20, padding: "12px 14px", background: "#f8f9fb", borderRadius: 8, fontSize: 13 }}>
                <span style={{ color: "#888" }}>Conta: </span>
                <strong style={{ color: "#333" }}>{email}</strong>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nova senha</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#aaa",
                }}>
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 3,
                        background: i <= strength ? strengthColor : "#e5e7eb",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Confirmar senha</label>
              <input
                type={showPwd ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                required
                style={{
                  ...inputStyle,
                  borderColor: confirm && confirm !== password ? "#fca5a5" : undefined,
                  background: confirm && confirm !== password ? "#fff5f5" : undefined,
                }}
                autoComplete="new-password"
              />
              {confirm && confirm !== password && (
                <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>As senhas não coincidem</div>
              )}
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
                {error}
              </div>
            )}

            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 20, lineHeight: 1.5 }}>
              Use pelo menos 8 caracteres. Recomendamos misturar letras maiúsculas, números e símbolos.
            </div>

            <button type="submit" disabled={saving} style={btnStyle("#111")}>
              {saving ? "Salvando..." : "Definir senha e entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  color: "#111",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#444",
  marginBottom: 6,
}

function btnStyle(color: string): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px",
    borderRadius: 8,
    border: "none",
    background: color,
    color: "white",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  }
}
