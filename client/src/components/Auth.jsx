import { useState } from "react"

export default function Auth({ setToken }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)

  const handleSubmit = async () => {
    const endpoint = isLogin ? "login" : "register"

    const res = await fetch(`http://localhost:3001/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })

    const data = await res.json()

    if (data.token) {
      localStorage.setItem("token", data.token)
      setToken(data.token)
    } else {
      alert(data.message || "Something went wrong")
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-900 p-8 rounded-xl w-96 space-y-4">
        <h2 className="text-2xl font-bold text-center">
          {isLogin ? "Login" : "Register"}
        </h2>

        <input
          className="w-full p-3 bg-gray-800 rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 bg-gray-800 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-cyan-500 py-3 rounded font-semibold"
        >
          {isLogin ? "Login" : "Register"}
        </button>

        <p
          className="text-sm text-center cursor-pointer text-cyan-400"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "No account? Register" : "Already have account? Login"}
        </p>
      </div>
    </div>
  )
}