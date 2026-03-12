import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

type MonthlyMetric = {
  month: string
  revenue: number
  costs: number
  profit: number
}

type DashboardData = {
  mrr: number
  activeClients: number
  revenue: number
  costs: number
  profit: number
  avgLTV: number
  margin: number
  monthlyMetrics: MonthlyMetric[]
}

function App() {

  const [status, setStatus] = useState("loading...")
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {

    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then(res => res.json())
      .then(d => setStatus(d.status))
      .catch(() => setStatus("Backend connection failed"))

  }, [])

  useEffect(() => {

    const token = localStorage.getItem("token")

    fetch(`${import.meta.env.VITE_API_URL}/trpc/dashboard.summary`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(res => {

        if (!res?.result?.data) {
          console.error("Invalid API response:", res)
          return
        }

        setData(res.result.data)

      })
      .catch(err => {
        console.error("Dashboard fetch error:", err)
      })

  }, [])

  if (!data) {
    return <div style={{ padding: 40 }}>Loading dashboard...</div>
  }

  return (

    <div style={{
      padding: 40,
      fontFamily: "Arial",
      background: "#f5f6fa",
      minHeight: "100vh"
    }}>

      <h1>Funil Faixa Preta — Strategic Dashboard</h1>

      <p>Backend status: {status}</p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6,1fr)",
        gap: "20px",
        marginTop: 40
      }}>

        <Card title="MRR" value={`R$ ${data.mrr}`} />

        <Card title="Clientes" value={data.activeClients} />

        <Card title="Receita" value={`R$ ${data.revenue}`} />

        <Card title="Custos" value={`R$ ${data.costs}`} />

        <Card title="Lucro" value={`R$ ${data.profit}`} />

        <Card title="LTV Médio" value={`R$ ${data.avgLTV.toFixed(0)}`} />

      </div>

      <div style={{
        marginTop: 60,
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 40
      }}>

        <div style={{
          background: "white",
          padding: 30,
          borderRadius: 10
        }}>

          <h2>Receita vs Custos</h2>

          <ResponsiveContainer width="100%" height={300}>

            <LineChart data={data.monthlyMetrics}>

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="costs"
                stroke="#ef4444"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        <div style={{
          background: "white",
          padding: 30,
          borderRadius: 10
        }}>

          <h2>Margem</h2>

          <p style={{
            fontSize: 40,
            fontWeight: "bold"
          }}>
            {data.margin.toFixed(1)}%
          </p>

          <p>Lucro atual da operação</p>

        </div>

      </div>

    </div>

  )

}

function Card({ title, value }: { title: string, value: any }) {

  return (

    <div style={{
      background: "white",
      padding: 25,
      borderRadius: 12,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    }}>

      <h3 style={{ fontSize: 14, color: "#666" }}>{title}</h3>

      <p style={{
        fontSize: 28,
        fontWeight: "bold",
        marginTop: 10
      }}>
        {value}
      </p>

    </div>

  )

}

export default App