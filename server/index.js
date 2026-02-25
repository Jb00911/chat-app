
let users = []


// index.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from "dotenv"
dotenv.config()
import mongoose from "mongoose"
import Message from "./models/Message.js"
import authRoutes from "./routes/auth.js"
import jwt from "jsonwebtoken"

import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // frontend address
    methods: ["GET", "POST"]
  }
});
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.log(err))

io.on("connection", (socket) => {

  console.log("User connected:", socket.id)

  // JOIN ROOM
  socket.on("join", async ({ token, room }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      socket.join(room)

      users.push({
        id: socket.id,
        userId: decoded.id,
        username: decoded.username,
        room
      })

      io.to(room).emit(
        "users",
        users.filter(u => u.room === room)
      )

      const roomMessages = await Message.find({ room })
        .populate("user", "username")
        .sort({ createdAt: 1 })

      socket.emit("previous messages", roomMessages)

    } catch (err) {
      console.log("Join error:", err.message)
    }
  })

  // SEND MESSAGE
  socket.on("chat message", async ({ room, message, token }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      const newMessage = new Message({
        user: decoded.id,
        text: message.text,
        room
      })

      await newMessage.save()

      io.to(room).emit("chat message", {
        user: {
          username: decoded.username
        },
        text: message.text,
        time: message.time
      })

    } catch (err) {
      console.error("Message error:", err)
    }
  })

  // TYPING
  socket.on("typing", (username) => {
    const user = users.find(u => u.id === socket.id)
    if (user) {
      socket.to(user.room).emit("typing", username)
    }
  })

  // DISCONNECT
  socket.on("disconnect", () => {
    const user = users.find(user => user.id === socket.id)

    if (user) {
      users = users.filter(u => u.id !== socket.id)

      io.to(user.room).emit(
        "users",
        users.filter(u => u.room === user.room)
      )
    }

    console.log("User disconnected:", socket.id)
  })

})


app.use(express.json())
app.use("/api/auth", authRoutes)

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
