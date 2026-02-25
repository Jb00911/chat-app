import { useState } from "react"
import Chat from "./pages/Chat"
import Auth from "./components/Auth"

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"))

  return token ? (
    <Chat token={token} />
  ) : (
    <Auth setToken={setToken} />
  )
}