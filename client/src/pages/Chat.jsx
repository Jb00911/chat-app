import { useState, useEffect, useRef } from "react"
import io from "socket.io-client"
import { jwtDecode } from "jwt-decode"

export default function Chat({ token }) {

  
  const decoded = jwtDecode(token)
  const username = decoded.username

  const handleLogout = () => {
  localStorage.removeItem("token")
  window.location.href = "/login"
  }

  const socketRef = useRef(null)

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUser, setTypingUser] = useState("")
  const [room, setRoom] = useState("general")

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

useEffect(() => {
  const token = localStorage.getItem("token")
  if (!token) {
    window.location.href = "/login"
  }
}, [])
  

  // Initialize socket once
  useEffect(() => {
    socketRef.current = io("https://your-render-url.onrender.com")

    socketRef.current.emit("join", { token, room })

    socketRef.current.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    socketRef.current.on("users", (usersList) => {
      setOnlineUsers(usersList)
    })

    socketRef.current.on("previous messages", (msgs) => {
      setMessages(msgs)
    })

    socketRef.current.on("typing", (user) => {
      setTypingUser(user)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser("")
      }, 1500)
    })

    return () => {
      socketRef.current.disconnect()
    }

  }, [room, token])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (!message.trim()) return

    const msgData = {
      text: message,
      time: new Date().toLocaleTimeString()
    }

    socketRef.current.emit("chat message", {
      room,
      message: msgData,
      token
    })

    setMessage("")
  }

  const handleRoomChange = (newRoom) => {
    if (newRoom === room) return
    setMessages([])
    setRoom(newRoom)
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-black via-gray-900 to-black text-white">

      {/* Sidebar */}
      
      <div className="w-64 bg-black/40 backdrop-blur-md border-r border-cyan-500/20 p-6 flex flex-col h-full">

        <h3 className="text-lg font-semibold mb-4">Rooms</h3>
        <div className="space-y-2 mb-8">
          {["general", "tech", "random"].map((r) => (
            <div
              key={r}
              onClick={() => handleRoomChange(r)}
              className={`cursor-pointer p-2 rounded-lg ${
                room === r ? "bg-cyan-600" : "bg-gray-800"
              }`}
            >
              #{r}
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold mb-4">Online Users</h3>
        <div className="space-y-3">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{user.username}</span>
            </div>
          ))}
        </div>

        {/* Logout button at the bottom */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-cyan-500 text-white py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">

        <div className="p-4 border-b border-cyan-500/20 bg-black/40 backdrop-blur-md">
          <h2 className="text-lg font-semibold">
            Room: #{room}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-xs px-4 py-2 rounded-xl ${
                msg.user?.username === username
                  ? "ml-auto bg-cyan-600"
                  : "bg-gray-700"
              }`}
            >
              <div className="text-sm font-semibold">
                {msg.user?.username}
              </div>
              <div>{msg.text}</div>
              <div className="text-xs opacity-60 mt-1">{msg.time}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {typingUser && (
          <div className="px-6 pb-2 text-sm text-cyan-400 italic">
            {typingUser} is typing...
          </div>
        )}

        <div className="p-4 border-t border-cyan-500/20 bg-black/40 backdrop-blur-md flex gap-4">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-3 rounded-lg bg-black/40 border border-cyan-500/30 focus:outline-none"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              socketRef.current.emit("typing", username)
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={sendMessage}
            className="px-6 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-all"
          >
            Send
          </button>
        </div>
        
      </div>
    </div>
  )
}


