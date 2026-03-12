import { useState } from "react"

export default function Login() {

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [companySlug,setCompanySlug] = useState("")
  const [error,setError] = useState("")

  const handleLogin = async () => {

    try {

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/trpc/login`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body: JSON.stringify({
            input:{
              email,
              password,
              companySlug
            }
          })
        }
      )

      const json = await res.json()

      const token = json.result.data.token

      localStorage.setItem("token",token)

      window.location.href="/"

    } catch(err){

      setError("Login failed")

    }

  }

  return (

    <div style={{
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      height:"100vh",
      background:"#f5f6fa"
    }}>

      <div style={{
        background:"white",
        padding:40,
        borderRadius:10,
        width:300
      }}>

        <h2>Login</h2>

        <input
          placeholder="Company slug"
          onChange={(e)=>setCompanySlug(e.target.value)}
          style={{width:"100%",marginBottom:10}}
        />

        <input
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
          style={{width:"100%",marginBottom:10}}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
          style={{width:"100%",marginBottom:10}}
        />

        <button
          onClick={handleLogin}
          style={{
            width:"100%",
            padding:10,
            background:"#6c5ce7",
            color:"white",
            border:"none",
            borderRadius:5
          }}
        >
          Login
        </button>

        {error && (
          <p style={{color:"red",marginTop:10}}>
            {error}
          </p>
        )}

      </div>

    </div>

  )

}